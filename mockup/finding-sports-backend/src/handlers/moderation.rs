use axum::{
    extract::{Json, Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
};
use serde::{Deserialize, Serialize};
use serde_json::json;
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    middleware::auth::AuthUser,
    models::{
        CreateModerationAction, DemoteModerator, ModerationLogFilter, PromoteModerator,
        ReportFilter, ResolveReport,
    },
    services::ModerationService,
};

#[derive(Deserialize)]
pub struct ModeratorQuery {
    pub page: Option<i32>,
    pub limit: Option<i32>,
}

#[derive(Serialize)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

impl<T> ApiResponse<T> {
    pub fn success(data: T) -> Self {
        Self {
            success: true,
            data: Some(data),
            error: None,
        }
    }

    pub fn error(message: String) -> Self {
        Self {
            success: false,
            data: None,
            error: Some(message),
        }
    }
}

// GET /api/moderators - List all moderators
pub async fn list_moderators(
    State(db): State<PgPool>,
    _auth: AuthUser,
    Query(_params): Query<ModeratorQuery>,
) -> Result<impl IntoResponse, (StatusCode, Json<ApiResponse<()>>)> {
    let service = ModerationService::new(db);
    
    match service.list_moderators().await {
        Ok(moderators) => Ok(Json(ApiResponse::success(moderators))),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::error(e.to_string())),
        )),
    }
}

// POST /api/moderators/:userId/promote - Promote user to moderator (admin only)
pub async fn promote_moderator(
    State(db): State<PgPool>,
    auth: AuthUser,
    Path(user_id): Path<Uuid>,
    Json(permissions): Json<Option<Vec<String>>>,
) -> Result<impl IntoResponse, (StatusCode, Json<ApiResponse<()>>)> {
    if !auth.is_admin() {
        return Err((
            StatusCode::FORBIDDEN,
            Json(ApiResponse::error("Admin access required".to_string())),
        ));
    }

    let service = ModerationService::new(db);
    let input = PromoteModerator {
        user_id,
        permissions,
    };

    match service.promote_to_moderator(auth.id, input).await {
        Ok(user) => Ok(Json(ApiResponse::success(user))),
        Err(e) => Err((
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::error(e.to_string())),
        )),
    }
}

// POST /api/moderators/:userId/demote - Demote moderator (admin only)
pub async fn demote_moderator(
    State(db): State<PgPool>,
    auth: AuthUser,
    Path(user_id): Path<Uuid>,
    Json(input): Json<DemoteModerator>,
) -> Result<impl IntoResponse, (StatusCode, Json<ApiResponse<()>>)> {
    if !auth.is_admin() {
        return Err((
            StatusCode::FORBIDDEN,
            Json(ApiResponse::error("Admin access required".to_string())),
        ));
    }

    let service = ModerationService::new(db);
    let demote_input = DemoteModerator {
        user_id,
        reason: input.reason,
    };

    match service.demote_moderator(auth.id, demote_input).await {
        Ok(user) => Ok(Json(ApiResponse::success(user))),
        Err(e) => Err((
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::error(e.to_string())),
        )),
    }
}

// GET /api/moderation/reports - Get reports (moderators only)
pub async fn get_reports(
    State(db): State<PgPool>,
    auth: AuthUser,
    Query(filter): Query<ReportFilter>,
) -> Result<impl IntoResponse, (StatusCode, Json<ApiResponse<()>>)> {
    if !auth.is_moderator() {
        return Err((
            StatusCode::FORBIDDEN,
            Json(ApiResponse::error("Moderator access required".to_string())),
        ));
    }

    let service = ModerationService::new(db);

    match service.get_reports(filter).await {
        Ok(reports) => Ok(Json(ApiResponse::success(reports))),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::error(e.to_string())),
        )),
    }
}

// POST /api/moderation/reports/:reportId/resolve - Resolve a report
pub async fn resolve_report(
    State(db): State<PgPool>,
    auth: AuthUser,
    Path(report_id): Path<Uuid>,
    Json(input): Json<ResolveReport>,
) -> Result<impl IntoResponse, (StatusCode, Json<ApiResponse<()>>)> {
    if !auth.is_moderator() {
        return Err((
            StatusCode::FORBIDDEN,
            Json(ApiResponse::error("Moderator access required".to_string())),
        ));
    }

    let service = ModerationService::new(db);
    let resolve_input = ResolveReport {
        report_id,
        resolution: input.resolution,
        action_taken: input.action_taken,
    };

    match service.resolve_report(auth.id, resolve_input).await {
        Ok(report) => Ok(Json(ApiResponse::success(report))),
        Err(e) => Err((
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::error(e.to_string())),
        )),
    }
}

// POST /api/moderation/actions - Perform moderation action
pub async fn perform_moderation_action(
    State(db): State<PgPool>,
    auth: AuthUser,
    Json(action): Json<CreateModerationAction>,
) -> Result<impl IntoResponse, (StatusCode, Json<ApiResponse<()>>)> {
    if !auth.is_moderator() {
        return Err((
            StatusCode::FORBIDDEN,
            Json(ApiResponse::error("Moderator access required".to_string())),
        ));
    }

    let service = ModerationService::new(db);

    match service.perform_action(auth.id, action).await {
        Ok(moderation_action) => Ok(Json(ApiResponse::success(moderation_action))),
        Err(e) => Err((
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::error(e.to_string())),
        )),
    }
}

// GET /api/moderation/logs - Get moderation logs
pub async fn get_moderation_logs(
    State(db): State<PgPool>,
    auth: AuthUser,
    Query(filter): Query<ModerationLogFilter>,
) -> Result<impl IntoResponse, (StatusCode, Json<ApiResponse<()>>)> {
    if !auth.is_moderator() {
        return Err((
            StatusCode::FORBIDDEN,
            Json(ApiResponse::error("Moderator access required".to_string())),
        ));
    }

    let service = ModerationService::new(db);

    match service.get_moderation_logs(filter).await {
        Ok(logs) => Ok(Json(ApiResponse::success(logs))),
        Err(e) => Err((
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse::error(e.to_string())),
        )),
    }
}

// POST /api/reports - Create a new report (any authenticated user)
pub async fn create_report(
    State(db): State<PgPool>,
    auth: AuthUser,
    Json(report): Json<serde_json::Value>,
) -> Result<impl IntoResponse, (StatusCode, Json<ApiResponse<()>>)> {
    let report_id = Uuid::new_v4();
    let reporter_id = auth.id;

    // Extract fields from JSON
    let reported_user_id = report.get("reported_user_id")
        .and_then(|v| v.as_str())
        .and_then(|s| Uuid::parse_str(s).ok());
    
    let reported_message_id = report.get("reported_message_id")
        .and_then(|v| v.as_str())
        .and_then(|s| Uuid::parse_str(s).ok());
    
    let report_type = report.get("report_type")
        .and_then(|v| v.as_str())
        .unwrap_or("other");
    
    let description = report.get("description")
        .and_then(|v| v.as_str())
        .unwrap_or("");

    let result = sqlx::query(
        r#"
        INSERT INTO user_reports (
            id, reporter_id, reported_user_id, reported_message_id,
            report_type, description, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW(), NOW())
        "#
    )
    .bind(report_id)
    .bind(reporter_id)
    .bind(reported_user_id)
    .bind(reported_message_id)
    .bind(report_type)
    .bind(description)
    .execute(&db)
    .await;

    match result {
        Ok(_) => Ok(Json(ApiResponse::success(json!({ "report_id": report_id })))),
        Err(e) => Err((
            StatusCode::BAD_REQUEST,
            Json(ApiResponse::error(e.to_string())),
        )),
    }
}