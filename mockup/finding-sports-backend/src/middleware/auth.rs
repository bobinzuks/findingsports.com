use axum::{
    extract::Request,
    http::StatusCode,
    middleware::Next,
    response::Response,
};

pub async fn auth_middleware(
    request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    // TODO: Implement JWT token validation
    // For now, just pass through
    Ok(next.run(request).await)
}