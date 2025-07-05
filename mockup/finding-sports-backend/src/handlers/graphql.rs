use async_graphql::*;
use sqlx::PgPool;
use uuid::Uuid;

use crate::{
    models::*,
    services::{AuthService, VenueService, GameService},
};

pub struct QueryRoot;

#[Object]
impl QueryRoot {
    async fn health(&self) -> &'static str {
        "Finding Sports API is running!"
    }

    async fn nearby_venues(
        &self,
        ctx: &Context<'_>,
        input: VenueSearchInput,
    ) -> Result<Vec<Venue>> {
        let db = ctx.data::<PgPool>()?;
        let venue_service = VenueService::new(db.clone());
        
        venue_service.find_nearby_venues(input)
            .await
            .map_err(|e| Error::new(e.to_string()))
    }

    async fn upcoming_games(
        &self,
        ctx: &Context<'_>,
        venue_id: Option<Uuid>,
    ) -> Result<Vec<Game>> {
        let db = ctx.data::<PgPool>()?;
        let game_service = GameService::new(db.clone());
        
        game_service.get_upcoming_games(venue_id)
            .await
            .map_err(|e| Error::new(e.to_string()))
    }

    async fn available_sports(&self) -> Vec<Sport> {
        get_default_sports()
    }

    async fn me(&self, ctx: &Context<'_>) -> Result<User> {
        let user = ctx.data::<User>()
            .map_err(|_| Error::new("Not authenticated"))?;
        Ok(user.clone())
    }
}

pub struct MutationRoot;

#[Object]
impl MutationRoot {
    async fn register(
        &self,
        ctx: &Context<'_>,
        input: RegisterInput,
    ) -> Result<AuthPayload> {
        let db = ctx.data::<PgPool>()?;
        let auth_service = ctx.data::<AuthService>()?;
        
        // Check if user exists
        let existing = sqlx::query!(
            "SELECT id FROM users WHERE email = $1 OR username = $2",
            input.email.to_lowercase(),
            input.username
        )
        .fetch_optional(db)
        .await
        .map_err(|e| Error::new(e.to_string()))?;

        if existing.is_some() {
            return Err(Error::new("User already exists"));
        }

        // Create user
        let user = auth_service.create_user(input)
            .map_err(|e| Error::new(e.to_string()))?;

        // Insert into database
        sqlx::query!(
            r#"
            INSERT INTO users (
                id, email, username, password_hash, full_name,
                avatar_url, bio, preferred_sports, skill_levels,
                city, is_active, is_verified, created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            "#,
            user.id,
            user.email,
            user.username,
            user.password_hash,
            user.full_name,
            user.avatar_url,
            user.bio,
            &user.preferred_sports,
            user.skill_levels,
            user.city,
            user.is_active,
            user.is_verified,
            user.created_at,
            user.updated_at
        )
        .execute(db)
        .await
        .map_err(|e| Error::new(e.to_string()))?;

        // Generate token
        let token = auth_service.generate_token(&user)
            .map_err(|e| Error::new(e.to_string()))?;

        Ok(AuthPayload { token, user })
    }

    async fn login(
        &self,
        ctx: &Context<'_>,
        input: LoginInput,
    ) -> Result<AuthPayload> {
        let db = ctx.data::<PgPool>()?;
        let auth_service = ctx.data::<AuthService>()?;
        
        // Find user
        let user = sqlx::query_as!(
            User,
            r#"
            SELECT * FROM users WHERE email = $1
            "#,
            input.email.to_lowercase()
        )
        .fetch_optional(db)
        .await
        .map_err(|e| Error::new(e.to_string()))?
        .ok_or_else(|| Error::new("Invalid credentials"))?;

        // Verify password
        if !auth_service.verify_password(&input.password, &user.password_hash)
            .map_err(|e| Error::new(e.to_string()))? {
            return Err(Error::new("Invalid credentials"));
        }

        // Generate token
        let token = auth_service.generate_token(&user)
            .map_err(|e| Error::new(e.to_string()))?;

        Ok(AuthPayload { token, user })
    }

    async fn join_game(
        &self,
        ctx: &Context<'_>,
        game_id: Uuid,
    ) -> Result<GameAttendee> {
        let db = ctx.data::<PgPool>()?;
        let user = ctx.data::<User>()
            .map_err(|_| Error::new("Not authenticated"))?;
        
        let game_service = GameService::new(db.clone());
        
        game_service.join_game(game_id, user.id)
            .await
            .map_err(|e| Error::new(e.to_string()))
    }
}

pub struct SubscriptionRoot;

#[Subscription]
impl SubscriptionRoot {
    async fn game_updates(&self, game_id: Uuid) -> impl Stream<Item = String> {
        // Placeholder for real-time updates
        tokio_stream::once(format!("Subscribed to game {}", game_id))
    }
}