use async_graphql::*;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, SimpleObject)]
#[graphql(name = "User")]
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub username: String,
    #[graphql(skip)]
    pub password_hash: String,
    pub full_name: Option<String>,
    pub avatar_url: Option<String>,
    pub bio: Option<String>,
    pub preferred_sports: Vec<String>,
    pub skill_levels: serde_json::Value, // JSON object mapping sport to skill level
    pub city: Option<String>,
    pub is_active: bool,
    pub is_verified: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, InputObject)]
pub struct RegisterInput {
    pub email: String,
    pub username: String,
    pub password: String,
    pub full_name: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, InputObject)]
pub struct LoginInput {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, SimpleObject)]
pub struct AuthPayload {
    pub token: String,
    pub user: User,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, SimpleObject)]
pub struct UserConnection {
    pub id: Uuid,
    pub user_id: Uuid,
    pub friend_id: Uuid,
    pub connection_type: ConnectionType,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, Enum, PartialEq, Eq)]
pub enum ConnectionType {
    Friend,
    Blocked,
    Pending,
}

impl User {
    pub fn new(input: RegisterInput, password_hash: String) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4(),
            email: input.email.to_lowercase(),
            username: input.username,
            password_hash,
            full_name: input.full_name,
            avatar_url: None,
            bio: None,
            preferred_sports: Vec::new(),
            skill_levels: serde_json::json!({}),
            city: None,
            is_active: true,
            is_verified: false,
            created_at: now,
            updated_at: now,
        }
    }
}