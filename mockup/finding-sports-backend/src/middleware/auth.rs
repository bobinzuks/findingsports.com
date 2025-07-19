use axum::{
    extract::{Request, State},
    http::{HeaderMap, StatusCode},
    middleware::Next,
    response::{IntoResponse, Response},
    Json,
};
use serde_json::json;
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    models::{User, UserRole},
    services::auth::{AuthService, Claims},
};

pub struct AuthUser {
    pub id: Uuid,
    pub email: String,
    pub username: String,
    pub role: UserRole,
    pub user: User,
}

impl AuthUser {
    pub fn is_moderator(&self) -> bool {
        self.user.is_moderator()
    }

    pub fn is_admin(&self) -> bool {
        self.user.is_admin()
    }

    pub fn has_permission(&self, permission: &str, resource: Option<&str>) -> bool {
        self.user.has_permission(permission, resource)
    }
}

#[axum::async_trait]
impl<S> axum::extract::FromRequestParts<S> for AuthUser
where
    S: Send + Sync,
{
    type Rejection = (StatusCode, Json<serde_json::Value>);

    async fn from_request_parts(
        parts: &mut axum::http::request::Parts,
        _state: &S,
    ) -> Result<Self, Self::Rejection> {
        // Get token from Authorization header
        let token = parts
            .headers
            .get("Authorization")
            .and_then(|header| header.to_str().ok())
            .and_then(|header| header.strip_prefix("Bearer "))
            .ok_or_else(|| {
                (
                    StatusCode::UNAUTHORIZED,
                    Json(json!({ "error": "Missing or invalid authorization header" })),
                )
            })?;

        // Extract auth service and database from extensions
        let auth_service = parts
            .extensions
            .get::<AuthService>()
            .ok_or_else(|| {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({ "error": "Auth service not found" })),
                )
            })?;

        let db = parts
            .extensions
            .get::<PgPool>()
            .ok_or_else(|| {
                (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(json!({ "error": "Database not found" })),
                )
            })?;

        // Verify token
        let claims = auth_service.verify_token(token).map_err(|_| {
            (
                StatusCode::UNAUTHORIZED,
                Json(json!({ "error": "Invalid token" })),
            )
        })?;

        // Get user from database
        let user = sqlx::query_as::<_, User>(
            "SELECT * FROM users WHERE id = $1 AND is_active = true",
        )
        .bind(claims.sub)
        .fetch_optional(db)
        .await
        .map_err(|_| {
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({ "error": "Database error" })),
            )
        })?
        .ok_or_else(|| {
            (
                StatusCode::UNAUTHORIZED,
                Json(json!({ "error": "User not found or inactive" })),
            )
        })?;

        // Check if user is banned
        if user.is_banned() {
            return Err((
                StatusCode::FORBIDDEN,
                Json(json!({ 
                    "error": "User is banned",
                    "reason": user.ban_reason,
                    "until": user.banned_until
                })),
            ));
        }

        Ok(AuthUser {
            id: user.id,
            email: user.email.clone(),
            username: user.username.clone(),
            role: user.role,
            user,
        })
    }
}

// Middleware for optional authentication
pub async fn optional_auth_middleware<B>(
    State(db): State<PgPool>,
    State(auth_service): State<AuthService>,
    headers: HeaderMap,
    mut request: Request<B>,
    next: Next<B>,
) -> Response {
    // Try to extract token
    if let Some(auth_header) = headers.get("Authorization") {
        if let Ok(header_str) = auth_header.to_str() {
            if let Some(token) = header_str.strip_prefix("Bearer ") {
                // Try to verify token and get user
                if let Ok(claims) = auth_service.verify_token(token) {
                    if let Ok(Some(user)) = sqlx::query_as::<_, User>(
                        "SELECT * FROM users WHERE id = $1 AND is_active = true",
                    )
                    .bind(claims.sub)
                    .fetch_optional(&db)
                    .await
                    {
                        if !user.is_banned() {
                            request.extensions_mut().insert(AuthUser {
                                id: user.id,
                                email: user.email.clone(),
                                username: user.username.clone(),
                                role: user.role,
                                user,
                            });
                        }
                    }
                }
            }
        }
    }

    // Insert services for later extraction
    request.extensions_mut().insert(db);
    request.extensions_mut().insert(auth_service);

    next.run(request).await
}

// Middleware for required authentication
pub async fn auth_middleware<B>(
    State(db): State<PgPool>,
    State(auth_service): State<AuthService>,
    headers: HeaderMap,
    request: Request<B>,
    next: Next<B>,
) -> Result<Response, Response> {
    // Get token from Authorization header
    let token = headers
        .get("Authorization")
        .and_then(|header| header.to_str().ok())
        .and_then(|header| header.strip_prefix("Bearer "))
        .ok_or_else(|| {
            (
                StatusCode::UNAUTHORIZED,
                Json(json!({ "error": "Missing or invalid authorization header" })),
            )
                .into_response()
        })?;

    // Verify token
    let claims = auth_service.verify_token(token).map_err(|_| {
        (
            StatusCode::UNAUTHORIZED,
            Json(json!({ "error": "Invalid token" })),
        )
            .into_response()
    })?;

    // Get user from database
    let user = sqlx::query_as::<_, User>(
        "SELECT * FROM users WHERE id = $1 AND is_active = true",
    )
    .bind(claims.sub)
    .fetch_optional(&db)
    .await
    .map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(json!({ "error": "Database error" })),
        )
            .into_response()
    })?
    .ok_or_else(|| {
        (
            StatusCode::UNAUTHORIZED,
            Json(json!({ "error": "User not found or inactive" })),
        )
            .into_response()
    })?;

    // Check if user is banned
    if user.is_banned() {
        return Err((
            StatusCode::FORBIDDEN,
            Json(json!({ 
                "error": "User is banned",
                "reason": user.ban_reason,
                "until": user.banned_until
            })),
        )
            .into_response());
    }

    let mut request = request;
    request.extensions_mut().insert(AuthUser {
        id: user.id,
        email: user.email.clone(),
        username: user.username.clone(),
        role: user.role,
        user,
    });
    request.extensions_mut().insert(db);
    request.extensions_mut().insert(auth_service);

    Ok(next.run(request).await)
}

// Middleware for moderator-only routes
pub async fn moderator_middleware<B>(
    auth_user: AuthUser,
    request: Request<B>,
    next: Next<B>,
) -> Result<Response, Response> {
    if !auth_user.is_moderator() {
        return Err((
            StatusCode::FORBIDDEN,
            Json(json!({ "error": "Moderator access required" })),
        )
            .into_response());
    }

    let mut request = request;
    request.extensions_mut().insert(auth_user);
    Ok(next.run(request).await)
}

// Middleware for admin-only routes
pub async fn admin_middleware<B>(
    auth_user: AuthUser,
    request: Request<B>,
    next: Next<B>,
) -> Result<Response, Response> {
    if !auth_user.is_admin() {
        return Err((
            StatusCode::FORBIDDEN,
            Json(json!({ "error": "Admin access required" })),
        )
            .into_response());
    }

    let mut request = request;
    request.extensions_mut().insert(auth_user);
    Ok(next.run(request).await)
}