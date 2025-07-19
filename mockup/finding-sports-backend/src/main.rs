use axum::{
    routing::{get, post},
    Router,
    extract::State,
    middleware,
};
use async_graphql::{http::GraphiQLSource, Schema};
use async_graphql_axum::{GraphQLRequest, GraphQLResponse};
use sqlx::postgres::PgPoolOptions;
use std::net::SocketAddr;
use tower_http::cors::CorsLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

pub mod config;
pub mod models;
pub mod handlers;
pub mod services;
pub mod middleware as app_middleware;

use config::Config;
use handlers::{QueryRoot, MutationRoot, SubscriptionRoot};
use services::AuthService;

pub type AppSchema = Schema<QueryRoot, MutationRoot, SubscriptionRoot>;

#[derive(Clone)]
pub struct AppState {
    pub schema: AppSchema,
    pub db: sqlx::PgPool,
    pub redis: redis::Client,
    pub config: Config,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "finding_sports=debug,tower_http=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Load configuration
    let config = Config::from_env()?;

    // Database connection
    let db_pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&config.database_url)
        .await?;

    // Run migrations
    sqlx::migrate!("./migrations").run(&db_pool).await?;

    // Redis connection
    let redis_client = redis::Client::open(config.redis_url.clone())?;

    // Initialize services
    let auth_service = AuthService::new(config.jwt_secret.clone());

    // GraphQL schema
    let schema = Schema::build(QueryRoot, MutationRoot, SubscriptionRoot)
        .data(db_pool.clone())
        .data(redis_client.clone())
        .data(auth_service)
        .finish();

    // Application state
    let app_state = AppState {
        schema,
        db: db_pool,
        redis: redis_client,
        config: config.clone(),
    };

    // Build moderation routes
    let moderation_routes = Router::new()
        .route("/moderators", get(handlers::list_moderators))
        .route("/moderators/:user_id/promote", post(handlers::promote_moderator))
        .route("/moderators/:user_id/demote", post(handlers::demote_moderator))
        .route("/moderation/reports", get(handlers::get_reports))
        .route("/moderation/reports/:report_id/resolve", post(handlers::resolve_report))
        .route("/moderation/actions", post(handlers::perform_moderation_action))
        .route("/moderation/logs", get(handlers::get_moderation_logs))
        .route("/reports", post(handlers::create_report))
        .layer(middleware::from_fn_with_state(
            (db_pool.clone(), auth_service.clone()),
            app_middleware::auth::optional_auth_middleware,
        ));

    // Build router
    let app = Router::new()
        .route("/", get(graphiql))
        .route("/graphql", post(graphql_handler))
        .route("/health", get(health_check))
        .nest("/api", moderation_routes)
        .layer(CorsLayer::permissive())
        .with_state(app_state);

    // Start server
    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    tracing::info!("Finding Sports API listening on {}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

async fn graphiql() -> axum::response::Html<String> {
    axum::response::Html(GraphiQLSource::build().endpoint("/graphql").finish())
}

async fn graphql_handler(
    State(state): State<AppState>,
    req: GraphQLRequest,
) -> GraphQLResponse {
    let schema = state.schema.clone();
    schema.execute(req.into_inner()).await.into()
}

async fn health_check() -> &'static str {
    "OK"
}