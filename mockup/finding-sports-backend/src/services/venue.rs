use anyhow::Result;
use sqlx::PgPool;
use uuid::Uuid;

use crate::models::{Venue, VenueSearchInput};

pub struct VenueService {
    db: PgPool,
}

impl VenueService {
    pub fn new(db: PgPool) -> Self {
        Self { db }
    }

    pub async fn find_nearby_venues(&self, input: VenueSearchInput) -> Result<Vec<Venue>> {
        let venues = sqlx::query_as!(
            Venue,
            r#"
            SELECT 
                id,
                name,
                address,
                city,
                province,
                postal_code,
                latitude,
                longitude,
                amenities,
                venue_type as "venue_type: _",
                source_url,
                created_at,
                updated_at
            FROM venues
            WHERE ST_DWithin(
                location::geography,
                ST_MakePoint($1, $2)::geography,
                $3 * 1000
            )
            ORDER BY ST_Distance(location, ST_MakePoint($1, $2))
            LIMIT 50
            "#,
            input.longitude,
            input.latitude,
            input.radius_km
        )
        .fetch_all(&self.db)
        .await?;

        Ok(venues)
    }

    pub async fn get_venue_by_id(&self, id: Uuid) -> Result<Option<Venue>> {
        let venue = sqlx::query_as!(
            Venue,
            r#"
            SELECT 
                id,
                name,
                address,
                city,
                province,
                postal_code,
                latitude,
                longitude,
                amenities,
                venue_type as "venue_type: _",
                source_url,
                created_at,
                updated_at
            FROM venues
            WHERE id = $1
            "#,
            id
        )
        .fetch_optional(&self.db)
        .await?;

        Ok(venue)
    }
}