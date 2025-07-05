use anyhow::Result;
use finding_sports_backend::config::Config;
use sqlx::postgres::PgPoolOptions;

#[tokio::main]
async fn main() -> Result<()> {
    dotenv::dotenv().ok();
    
    println!("🔄 Running database migrations...");

    let config = Config::from_env()?;
    let db = PgPoolOptions::new()
        .max_connections(5)
        .connect(&config.database_url)
        .await?;

    sqlx::migrate!("./migrations")
        .run(&db)
        .await?;

    println!("✅ Migrations completed successfully!");

    Ok(())
}