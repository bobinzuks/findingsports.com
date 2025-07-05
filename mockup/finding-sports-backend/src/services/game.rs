use anyhow::Result;
use chrono::{DateTime, Utc};
use sqlx::PgPool;
use uuid::Uuid;

use crate::models::{Game, GameAttendee, AttendeeStatus};

pub struct GameService {
    db: PgPool,
}

impl GameService {
    pub fn new(db: PgPool) -> Self {
        Self { db }
    }

    pub async fn get_upcoming_games(&self, venue_id: Option<Uuid>) -> Result<Vec<Game>> {
        let query = if let Some(vid) = venue_id {
            sqlx::query_as!(
                Game,
                r#"
                SELECT 
                    id,
                    venue_id,
                    sport_type,
                    game_type as "game_type: _",
                    title,
                    description,
                    start_time,
                    end_time,
                    max_attendees,
                    current_attendees,
                    price,
                    is_indoor,
                    skill_level as "skill_level: _",
                    organizer_id,
                    source_url,
                    created_at,
                    updated_at
                FROM games
                WHERE venue_id = $1 AND start_time > NOW()
                ORDER BY start_time
                LIMIT 100
                "#,
                vid
            )
            .fetch_all(&self.db)
            .await?
        } else {
            sqlx::query_as!(
                Game,
                r#"
                SELECT 
                    id,
                    venue_id,
                    sport_type,
                    game_type as "game_type: _",
                    title,
                    description,
                    start_time,
                    end_time,
                    max_attendees,
                    current_attendees,
                    price,
                    is_indoor,
                    skill_level as "skill_level: _",
                    organizer_id,
                    source_url,
                    created_at,
                    updated_at
                FROM games
                WHERE start_time > NOW()
                ORDER BY start_time
                LIMIT 100
                "#
            )
            .fetch_all(&self.db)
            .await?
        };

        Ok(query)
    }

    pub async fn join_game(&self, game_id: Uuid, user_id: Uuid) -> Result<GameAttendee> {
        // Check if already joined
        let existing = sqlx::query!(
            "SELECT id FROM game_attendees WHERE game_id = $1 AND user_id = $2",
            game_id,
            user_id
        )
        .fetch_optional(&self.db)
        .await?;

        if existing.is_some() {
            return Err(anyhow::anyhow!("Already joined this game"));
        }

        // Check if game is full
        let game = sqlx::query!(
            "SELECT max_attendees, current_attendees FROM games WHERE id = $1",
            game_id
        )
        .fetch_one(&self.db)
        .await?;

        if let Some(max) = game.max_attendees {
            if game.current_attendees >= max {
                return Err(anyhow::anyhow!("Game is full"));
            }
        }

        // Add attendee
        let attendee_id = Uuid::new_v4();
        let now = Utc::now();

        sqlx::query!(
            r#"
            INSERT INTO game_attendees (id, game_id, user_id, status, joined_at)
            VALUES ($1, $2, $3, $4, $5)
            "#,
            attendee_id,
            game_id,
            user_id,
            AttendeeStatus::Confirmed as _,
            now
        )
        .execute(&self.db)
        .await?;

        // Update attendee count
        sqlx::query!(
            "UPDATE games SET current_attendees = current_attendees + 1 WHERE id = $1",
            game_id
        )
        .execute(&self.db)
        .await?;

        Ok(GameAttendee {
            id: attendee_id,
            game_id,
            user_id,
            status: AttendeeStatus::Confirmed,
            joined_at: now,
        })
    }
}