use anyhow::{anyhow, Result};
use chrono::{Duration, Utc};
use sqlx::PgPool;
use uuid::Uuid;

use crate::models::{
    CreateModerationAction, DemoteModerator, ModerationAction, ModerationActionType,
    ModerationLogFilter, PromoteModerator, ReportFilter, ReportStatus, ResolveReport,
    User, UserReport, UserRole,
};

pub struct ModerationService {
    db: PgPool,
}

impl ModerationService {
    pub fn new(db: PgPool) -> Self {
        Self { db }
    }

    // List all moderators
    pub async fn list_moderators(&self) -> Result<Vec<User>> {
        let moderators = sqlx::query_as::<_, User>(
            "SELECT * FROM users WHERE role IN ('moderator', 'admin') AND is_active = true ORDER BY created_at DESC"
        )
        .fetch_all(&self.db)
        .await?;

        Ok(moderators)
    }

    // Promote user to moderator
    pub async fn promote_to_moderator(
        &self,
        admin_id: Uuid,
        input: PromoteModerator,
    ) -> Result<User> {
        // Verify admin permissions
        let admin = sqlx::query_as::<_, User>(
            "SELECT * FROM users WHERE id = $1 AND role = 'admin'"
        )
        .bind(admin_id)
        .fetch_optional(&self.db)
        .await?
        .ok_or_else(|| anyhow!("Unauthorized: Admin access required"))?;

        // Get target user
        let mut user = sqlx::query_as::<_, User>(
            "SELECT * FROM users WHERE id = $1"
        )
        .bind(input.user_id)
        .fetch_optional(&self.db)
        .await?
        .ok_or_else(|| anyhow!("User not found"))?;

        // Update user role
        sqlx::query(
            "UPDATE users SET role = 'moderator', updated_at = NOW() WHERE id = $1"
        )
        .bind(input.user_id)
        .execute(&self.db)
        .await?;

        // Log the action
        sqlx::query(
            r#"
            INSERT INTO moderation_actions (
                id, action_type, moderator_id, target_user_id, 
                reason, metadata, created_at
            ) VALUES ($1, 'promote_moderator', $2, $3, $4, $5, NOW())
            "#
        )
        .bind(Uuid::new_v4())
        .bind(admin_id)
        .bind(input.user_id)
        .bind("User promoted to moderator")
        .bind(serde_json::json!({ "permissions": input.permissions }))
        .execute(&self.db)
        .await?;

        user.role = UserRole::Moderator;
        Ok(user)
    }

    // Demote moderator to regular user
    pub async fn demote_moderator(
        &self,
        admin_id: Uuid,
        input: DemoteModerator,
    ) -> Result<User> {
        // Verify admin permissions
        let admin = sqlx::query_as::<_, User>(
            "SELECT * FROM users WHERE id = $1 AND role = 'admin'"
        )
        .bind(admin_id)
        .fetch_optional(&self.db)
        .await?
        .ok_or_else(|| anyhow!("Unauthorized: Admin access required"))?;

        // Get target user
        let mut user = sqlx::query_as::<_, User>(
            "SELECT * FROM users WHERE id = $1 AND role = 'moderator'"
        )
        .bind(input.user_id)
        .fetch_optional(&self.db)
        .await?
        .ok_or_else(|| anyhow!("Moderator not found"))?;

        // Update user role
        sqlx::query(
            "UPDATE users SET role = 'user', updated_at = NOW() WHERE id = $1"
        )
        .bind(input.user_id)
        .execute(&self.db)
        .await?;

        // Log the action
        sqlx::query(
            r#"
            INSERT INTO moderation_actions (
                id, action_type, moderator_id, target_user_id, 
                reason, metadata, created_at
            ) VALUES ($1, 'demote_moderator', $2, $3, $4, $5, NOW())
            "#
        )
        .bind(Uuid::new_v4())
        .bind(admin_id)
        .bind(input.user_id)
        .bind(&input.reason)
        .bind(serde_json::json!({}))
        .execute(&self.db)
        .await?;

        user.role = UserRole::User;
        Ok(user)
    }

    // Get moderation reports
    pub async fn get_reports(&self, filter: ReportFilter) -> Result<Vec<UserReport>> {
        let mut query = String::from(
            "SELECT * FROM user_reports WHERE 1=1"
        );
        let mut bind_count = 0;

        if filter.status.is_some() {
            bind_count += 1;
            query.push_str(&format!(" AND status = ${}", bind_count));
        }
        if filter.report_type.is_some() {
            bind_count += 1;
            query.push_str(&format!(" AND report_type = ${}", bind_count));
        }
        if filter.reporter_id.is_some() {
            bind_count += 1;
            query.push_str(&format!(" AND reporter_id = ${}", bind_count));
        }
        if filter.reported_user_id.is_some() {
            bind_count += 1;
            query.push_str(&format!(" AND reported_user_id = ${}", bind_count));
        }

        query.push_str(" ORDER BY created_at DESC");

        let mut db_query = sqlx::query_as::<_, UserReport>(&query);

        if let Some(status) = filter.status {
            db_query = db_query.bind(format!("{:?}", status).to_lowercase());
        }
        if let Some(report_type) = filter.report_type {
            db_query = db_query.bind(format!("{:?}", report_type).to_lowercase());
        }
        if let Some(reporter_id) = filter.reporter_id {
            db_query = db_query.bind(reporter_id);
        }
        if let Some(reported_user_id) = filter.reported_user_id {
            db_query = db_query.bind(reported_user_id);
        }

        let reports = db_query.fetch_all(&self.db).await?;
        Ok(reports)
    }

    // Perform moderation action
    pub async fn perform_action(
        &self,
        moderator_id: Uuid,
        action: CreateModerationAction,
    ) -> Result<ModerationAction> {
        // Verify moderator permissions
        let moderator = sqlx::query_as::<_, User>(
            "SELECT * FROM users WHERE id = $1"
        )
        .bind(moderator_id)
        .fetch_optional(&self.db)
        .await?
        .ok_or_else(|| anyhow!("Moderator not found"))?;

        if !moderator.is_moderator() {
            return Err(anyhow!("Unauthorized: Moderator access required"));
        }

        // Perform the action based on type
        match action.action_type {
            ModerationActionType::Ban => {
                if let Some(user_id) = action.target_user_id {
                    let duration = action.duration_minutes.unwrap_or(10080); // Default 7 days
                    let banned_until = Utc::now() + Duration::minutes(duration as i64);
                    
                    sqlx::query(
                        "UPDATE users SET banned_until = $1, ban_reason = $2 WHERE id = $3"
                    )
                    .bind(banned_until)
                    .bind(&action.reason)
                    .bind(user_id)
                    .execute(&self.db)
                    .await?;
                }
            }
            ModerationActionType::Unban => {
                if let Some(user_id) = action.target_user_id {
                    sqlx::query(
                        "UPDATE users SET banned_until = NULL, ban_reason = NULL WHERE id = $1"
                    )
                    .bind(user_id)
                    .execute(&self.db)
                    .await?;
                }
            }
            ModerationActionType::Mute => {
                if let Some(user_id) = action.target_user_id {
                    if let Some(room_id) = action.target_room_id {
                        let duration = action.duration_minutes.unwrap_or(60); // Default 1 hour
                        let muted_until = Utc::now() + Duration::minutes(duration as i64);
                        
                        sqlx::query(
                            "UPDATE chat_participants SET is_muted = true, muted_until = $1 
                             WHERE user_id = $2 AND room_id = $3"
                        )
                        .bind(muted_until)
                        .bind(user_id)
                        .bind(room_id)
                        .execute(&self.db)
                        .await?;
                    }
                }
            }
            ModerationActionType::Unmute => {
                if let Some(user_id) = action.target_user_id {
                    if let Some(room_id) = action.target_room_id {
                        sqlx::query(
                            "UPDATE chat_participants SET is_muted = false, muted_until = NULL 
                             WHERE user_id = $1 AND room_id = $2"
                        )
                        .bind(user_id)
                        .bind(room_id)
                        .execute(&self.db)
                        .await?;
                    }
                }
            }
            ModerationActionType::DeleteMessage => {
                if let Some(message_id) = action.target_message_id {
                    sqlx::query(
                        "UPDATE chat_messages SET is_deleted = true, deleted_at = NOW(), 
                         deleted_by = $1 WHERE id = $2"
                    )
                    .bind(moderator_id)
                    .bind(message_id)
                    .execute(&self.db)
                    .await?;
                }
            }
            ModerationActionType::Warn => {
                // Warning is handled by trigger in database
            }
            _ => {
                // Other actions can be implemented as needed
            }
        }

        // Log the moderation action
        let moderation_action = ModerationAction {
            id: Uuid::new_v4(),
            action_type: action.action_type,
            moderator_id,
            target_user_id: action.target_user_id,
            target_message_id: action.target_message_id,
            target_room_id: action.target_room_id,
            reason: action.reason,
            duration_minutes: action.duration_minutes,
            metadata: serde_json::json!({}),
            created_at: Utc::now(),
        };

        sqlx::query(
            r#"
            INSERT INTO moderation_actions (
                id, action_type, moderator_id, target_user_id, 
                target_message_id, target_room_id, reason, 
                duration_minutes, metadata, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            "#
        )
        .bind(&moderation_action.id)
        .bind(format!("{:?}", moderation_action.action_type).to_lowercase())
        .bind(&moderation_action.moderator_id)
        .bind(&moderation_action.target_user_id)
        .bind(&moderation_action.target_message_id)
        .bind(&moderation_action.target_room_id)
        .bind(&moderation_action.reason)
        .bind(&moderation_action.duration_minutes)
        .bind(&moderation_action.metadata)
        .bind(&moderation_action.created_at)
        .execute(&self.db)
        .await?;

        Ok(moderation_action)
    }

    // Get moderation logs
    pub async fn get_moderation_logs(
        &self,
        filter: ModerationLogFilter,
    ) -> Result<Vec<ModerationAction>> {
        let mut query = String::from(
            "SELECT * FROM moderation_actions WHERE 1=1"
        );
        let mut bind_count = 0;

        if filter.moderator_id.is_some() {
            bind_count += 1;
            query.push_str(&format!(" AND moderator_id = ${}", bind_count));
        }
        if filter.target_user_id.is_some() {
            bind_count += 1;
            query.push_str(&format!(" AND target_user_id = ${}", bind_count));
        }
        if filter.action_type.is_some() {
            bind_count += 1;
            query.push_str(&format!(" AND action_type = ${}", bind_count));
        }
        if filter.from_date.is_some() {
            bind_count += 1;
            query.push_str(&format!(" AND created_at >= ${}", bind_count));
        }
        if filter.to_date.is_some() {
            bind_count += 1;
            query.push_str(&format!(" AND created_at <= ${}", bind_count));
        }

        query.push_str(" ORDER BY created_at DESC");

        let mut db_query = sqlx::query_as::<_, ModerationAction>(&query);

        if let Some(moderator_id) = filter.moderator_id {
            db_query = db_query.bind(moderator_id);
        }
        if let Some(target_user_id) = filter.target_user_id {
            db_query = db_query.bind(target_user_id);
        }
        if let Some(action_type) = filter.action_type {
            db_query = db_query.bind(format!("{:?}", action_type).to_lowercase());
        }
        if let Some(from_date) = filter.from_date {
            db_query = db_query.bind(from_date);
        }
        if let Some(to_date) = filter.to_date {
            db_query = db_query.bind(to_date);
        }

        let logs = db_query.fetch_all(&self.db).await?;
        Ok(logs)
    }

    // Resolve a report
    pub async fn resolve_report(
        &self,
        moderator_id: Uuid,
        input: ResolveReport,
    ) -> Result<UserReport> {
        // Update the report
        let report = sqlx::query_as::<_, UserReport>(
            r#"
            UPDATE user_reports 
            SET status = 'resolved', 
                resolution = $1, 
                resolved_by = $2, 
                resolved_at = NOW(),
                updated_at = NOW()
            WHERE id = $3
            RETURNING *
            "#
        )
        .bind(&input.resolution)
        .bind(moderator_id)
        .bind(input.report_id)
        .fetch_optional(&self.db)
        .await?
        .ok_or_else(|| anyhow!("Report not found"))?;

        // If action was taken, create moderation action
        if let Some(action_type) = input.action_taken {
            if let Some(reported_user_id) = report.reported_user_id {
                let action = CreateModerationAction {
                    action_type,
                    target_user_id: Some(reported_user_id),
                    target_message_id: report.reported_message_id,
                    target_room_id: None,
                    reason: format!("Action taken for report: {}", input.resolution),
                    duration_minutes: None,
                };
                
                self.perform_action(moderator_id, action).await?;
            }
        }

        Ok(report)
    }
}