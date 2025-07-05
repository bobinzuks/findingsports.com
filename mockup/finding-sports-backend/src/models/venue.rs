use async_graphql::*;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow, SimpleObject)]
#[graphql(name = "Venue")]
pub struct Venue {
    pub id: Uuid,
    pub name: String,
    pub address: String,
    pub city: String,
    pub province: String,
    pub postal_code: String,
    pub latitude: f64,
    pub longitude: f64,
    pub amenities: Vec<String>,
    pub venue_type: VenueType,
    pub source_url: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, Enum, PartialEq, Eq)]
pub enum VenueType {
    RecreationCenter,
    Park,
    School,
    PrivateFacility,
    CommunityCenter,
}

#[derive(Debug, Clone, Serialize, Deserialize, InputObject)]
pub struct CreateVenueInput {
    pub name: String,
    pub address: String,
    pub city: String,
    pub province: String,
    pub postal_code: String,
    pub latitude: f64,
    pub longitude: f64,
    pub amenities: Vec<String>,
    pub venue_type: VenueType,
    pub source_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, InputObject)]
pub struct VenueSearchInput {
    pub latitude: f64,
    pub longitude: f64,
    pub radius_km: f64,
    pub sport_types: Option<Vec<String>>,
    pub venue_types: Option<Vec<VenueType>>,
}

impl Venue {
    pub fn new(input: CreateVenueInput) -> Self {
        let now = Utc::now();
        Self {
            id: Uuid::new_v4(),
            name: input.name,
            address: input.address,
            city: input.city,
            province: input.province,
            postal_code: input.postal_code,
            latitude: input.latitude,
            longitude: input.longitude,
            amenities: input.amenities,
            venue_type: input.venue_type,
            source_url: input.source_url,
            created_at: now,
            updated_at: now,
        }
    }

    pub fn distance_km(&self, lat: f64, lon: f64) -> f64 {
        // Haversine formula for distance calculation
        let r = 6371.0; // Earth's radius in km
        let lat1 = self.latitude.to_radians();
        let lat2 = lat.to_radians();
        let delta_lat = (lat - self.latitude).to_radians();
        let delta_lon = (lon - self.longitude).to_radians();

        let a = (delta_lat / 2.0).sin().powi(2)
            + lat1.cos() * lat2.cos() * (delta_lon / 2.0).sin().powi(2);
        let c = 2.0 * a.sqrt().asin();

        r * c
    }
}