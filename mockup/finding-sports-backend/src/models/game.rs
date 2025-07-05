use async_graphql::*;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, SimpleObject)]
#[graphql(name = "Game")]
pub struct Game {
    pub id: Uuid,
    pub venue_id: Uuid,
    pub sport_type: String,
    pub game_type: GameType,
    pub title: String,
    pub description: Option<String>,
    pub start_time: DateTime<Utc>,
    pub end_time: DateTime<Utc>,
    pub max_attendees: Option<i32>,
    pub current_attendees: i32,
    pub price: Option<f64>,
    pub is_indoor: bool,
    pub skill_level: Option<SkillLevel>,
    pub organizer_id: Option<Uuid>,
    pub source_url: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, Enum, PartialEq, Eq)]
pub enum GameType {
    DropIn,
    Organized,
    League,
    Tournament,
    Pickup,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, Enum, PartialEq, Eq)]
pub enum SkillLevel {
    Beginner,
    Intermediate,
    Advanced,
    AllLevels,
}

#[derive(Debug, Clone, Serialize, Deserialize, InputObject)]
pub struct CreateGameInput {
    pub venue_id: Uuid,
    pub sport_type: String,
    pub game_type: GameType,
    pub title: String,
    pub description: Option<String>,
    pub start_time: DateTime<Utc>,
    pub end_time: DateTime<Utc>,
    pub max_attendees: Option<i32>,
    pub price: Option<f64>,
    pub is_indoor: bool,
    pub skill_level: Option<SkillLevel>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, SimpleObject)]
pub struct GameAttendee {
    pub id: Uuid,
    pub game_id: Uuid,
    pub user_id: Uuid,
    pub status: AttendeeStatus,
    pub joined_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, Enum, PartialEq, Eq)]
pub enum AttendeeStatus {
    Confirmed,
    Maybe,
    Invited,
    Waitlist,
}

impl Game {
    pub fn new(input: CreateGameInput, organizer_id: Option<Uuid>) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4(),
            venue_id: input.venue_id,
            sport_type: input.sport_type,
            game_type: input.game_type,
            title: input.title,
            description: input.description,
            start_time: input.start_time,
            end_time: input.end_time,
            max_attendees: input.max_attendees,
            current_attendees: 0,
            price: input.price,
            is_indoor: input.is_indoor,
            skill_level: input.skill_level,
            organizer_id,
            source_url: None,
            created_at: now,
            updated_at: now,
        }
    }

    pub fn is_full(&self) -> bool {
        if let Some(max) = self.max_attendees {
            self.current_attendees >= max
        } else {
            false
        }
    }

    pub fn available_spots(&self) -> Option<i32> {
        self.max_attendees.map(|max| max - self.current_attendees)
    }
}