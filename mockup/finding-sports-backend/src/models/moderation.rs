use async_graphql::*;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, SimpleObject)]
pub struct ModerationAction {
    pub id: Uuid,
    pub action_type: ModerationActionType,
    pub moderator_id: Uuid,
    pub target_user_id: Option<Uuid>,
    pub target_message_id: Option<Uuid>,
    pub target_room_id: Option<Uuid>,
    pub reason: String,
    pub duration_minutes: Option<i32>,
    pub metadata: serde_json::Value,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, Enum, PartialEq, Eq, sqlx::Type)]
#[sqlx(type_name = "text")]
#[sqlx(rename_all = "snake_case")]
pub enum ModerationActionType {
    Warn,
    Mute,
    Kick,
    Ban,
    Unban,
    Unmute,
    DeleteMessage,
    EditMessage,
    LockChat,
    UnlockChat,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, SimpleObject)]
pub struct UserReport {
    pub id: Uuid,
    pub reporter_id: Uuid,
    pub reported_user_id: Option<Uuid>,
    pub reported_message_id: Option<Uuid>,
    pub report_type: ReportType,
    pub description: String,
    pub status: ReportStatus,
    pub resolution: Option<String>,
    pub resolved_by: Option<Uuid>,
    pub resolved_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, Enum, PartialEq, Eq, sqlx::Type)]
#[sqlx(type_name = "text")]
#[sqlx(rename_all = "snake_case")]
pub enum ReportType {
    Spam,
    Harassment,
    InappropriateContent,
    Impersonation,
    Violence,
    HateSpeech,
    Other,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, Enum, PartialEq, Eq, sqlx::Type)]
#[sqlx(type_name = "text")]
#[sqlx(rename_all = "snake_case")]
pub enum ReportStatus {
    Pending,
    Reviewing,
    Resolved,
    Dismissed,
    Escalated,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, SimpleObject)]
pub struct RolePermission {
    pub id: Uuid,
    pub role: String,
    pub permission: String,
    pub resource: Option<String>,
    pub created_at: DateTime<Utc>,
}

// Input types for mutations

#[derive(Debug, Clone, Serialize, Deserialize, InputObject)]
pub struct PromoteModerator {
    pub user_id: Uuid,
    pub permissions: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, InputObject)]
pub struct DemoteModerator {
    pub user_id: Uuid,
    pub reason: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, InputObject)]
pub struct CreateModerationAction {
    pub action_type: ModerationActionType,
    pub target_user_id: Option<Uuid>,
    pub target_message_id: Option<Uuid>,
    pub target_room_id: Option<Uuid>,
    pub reason: String,
    pub duration_minutes: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, InputObject)]
pub struct ResolveReport {
    pub report_id: Uuid,
    pub resolution: String,
    pub action_taken: Option<ModerationActionType>,
}

// Filter types for queries

#[derive(Debug, Clone, Serialize, Deserialize, InputObject)]
pub struct ModerationLogFilter {
    pub moderator_id: Option<Uuid>,
    pub target_user_id: Option<Uuid>,
    pub action_type: Option<ModerationActionType>,
    pub from_date: Option<DateTime<Utc>>,
    pub to_date: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, InputObject)]
pub struct ReportFilter {
    pub status: Option<ReportStatus>,
    pub report_type: Option<ReportType>,
    pub reporter_id: Option<Uuid>,
    pub reported_user_id: Option<Uuid>,
}