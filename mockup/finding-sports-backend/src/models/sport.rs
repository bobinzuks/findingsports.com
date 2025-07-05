use async_graphql::*;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, SimpleObject)]
pub struct Sport {
    pub name: String,
    pub category: SportCategory,
    pub icon: String,
    pub is_indoor: bool,
    pub is_outdoor: bool,
    pub typical_duration_minutes: i32,
    pub min_players: i32,
    pub max_players: Option<i32>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, Enum, PartialEq, Eq)]
pub enum SportCategory {
    TeamSport,
    RacquetSport,
    IndividualSport,
    WaterSport,
    WinterSport,
    Other,
}

pub fn get_default_sports() -> Vec<Sport> {
    vec![
        Sport {
            name: "Basketball".to_string(),
            category: SportCategory::TeamSport,
            icon: "🏀".to_string(),
            is_indoor: true,
            is_outdoor: true,
            typical_duration_minutes: 60,
            min_players: 2,
            max_players: Some(10),
        },
        Sport {
            name: "Soccer".to_string(),
            category: SportCategory::TeamSport,
            icon: "⚽".to_string(),
            is_indoor: true,
            is_outdoor: true,
            typical_duration_minutes: 90,
            min_players: 4,
            max_players: Some(22),
        },
        Sport {
            name: "Volleyball".to_string(),
            category: SportCategory::TeamSport,
            icon: "🏐".to_string(),
            is_indoor: true,
            is_outdoor: true,
            typical_duration_minutes: 60,
            min_players: 4,
            max_players: Some(12),
        },
        Sport {
            name: "Tennis".to_string(),
            category: SportCategory::RacquetSport,
            icon: "🎾".to_string(),
            is_indoor: true,
            is_outdoor: true,
            typical_duration_minutes: 60,
            min_players: 2,
            max_players: Some(4),
        },
        Sport {
            name: "Hockey".to_string(),
            category: SportCategory::TeamSport,
            icon: "🏒".to_string(),
            is_indoor: true,
            is_outdoor: false,
            typical_duration_minutes: 60,
            min_players: 6,
            max_players: Some(12),
        },
        Sport {
            name: "Badminton".to_string(),
            category: SportCategory::RacquetSport,
            icon: "🏸".to_string(),
            is_indoor: true,
            is_outdoor: false,
            typical_duration_minutes: 45,
            min_players: 2,
            max_players: Some(4),
        },
        Sport {
            name: "Swimming".to_string(),
            category: SportCategory::WaterSport,
            icon: "🏊".to_string(),
            is_indoor: true,
            is_outdoor: true,
            typical_duration_minutes: 60,
            min_players: 1,
            max_players: None,
        },
        Sport {
            name: "Pickleball".to_string(),
            category: SportCategory::RacquetSport,
            icon: "🏓".to_string(),
            is_indoor: true,
            is_outdoor: true,
            typical_duration_minutes: 45,
            min_players: 2,
            max_players: Some(4),
        },
    ]
}