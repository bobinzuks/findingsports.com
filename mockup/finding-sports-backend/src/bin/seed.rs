use anyhow::Result;
use chrono::{Duration, Utc};
use finding_sports_backend::{
    config::Config,
    models::*,
    services::AuthService,
};
use sqlx::postgres::PgPoolOptions;
use uuid::Uuid;

#[tokio::main]
async fn main() -> Result<()> {
    dotenv::dotenv().ok();
    
    println!("🌱 Seeding database...");

    let config = Config::from_env()?;
    let db = PgPoolOptions::new()
        .max_connections(5)
        .connect(&config.database_url)
        .await?;

    let auth_service = AuthService::new(config.jwt_secret);

    // Create test users
    let users = vec![
        ("john@example.com", "john_doe", "password123", "John Doe"),
        ("sarah@example.com", "sarah_smith", "password123", "Sarah Smith"),
        ("mike@example.com", "mike_jones", "password123", "Mike Jones"),
        ("lisa@example.com", "lisa_wong", "password123", "Lisa Wong"),
        ("demo@example.com", "demo_user", "demo123", "Demo User"),
    ];

    let mut user_ids = Vec::new();

    for (email, username, password, full_name) in users {
        let user = auth_service.create_user(RegisterInput {
            email: email.to_string(),
            username: username.to_string(),
            password: password.to_string(),
            full_name: Some(full_name.to_string()),
        })?;

        sqlx::query!(
            r#"
            INSERT INTO users (
                id, email, username, password_hash, full_name,
                preferred_sports, city, is_active, is_verified,
                created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (email) DO NOTHING
            "#,
            user.id,
            user.email,
            user.username,
            user.password_hash,
            user.full_name,
            &vec!["basketball".to_string(), "soccer".to_string()],
            "Vancouver",
            true,
            true,
            user.created_at,
            user.updated_at
        )
        .execute(&db)
        .await?;

        user_ids.push(user.id);
        println!("✅ Created user: {}", username);
    }

    // Create venues
    let venues = vec![
        (
            "Hillcrest Community Centre",
            "4575 Clancy Loranger Way",
            "Vancouver",
            49.2451, -123.1088,
            vec!["Gym", "Pool", "Basketball Courts"],
            VenueType::RecreationCenter,
        ),
        (
            "Kitsilano Community Centre",
            "2690 Larch Street",
            "Vancouver",
            49.2644, -123.1555,
            vec!["Gym", "Tennis Courts", "Soccer Field"],
            VenueType::CommunityCenter,
        ),
        (
            "Coal Harbour Community Centre",
            "480 Broughton Street",
            "Vancouver",
            49.2902, -123.1259,
            vec!["Gym", "Basketball Court", "Fitness Room"],
            VenueType::CommunityCenter,
        ),
        (
            "Trout Lake Community Centre",
            "3360 Victoria Drive",
            "Vancouver",
            49.2548, -123.0657,
            vec!["Ice Rink", "Basketball Courts", "Soccer Field"],
            VenueType::RecreationCenter,
        ),
        (
            "UBC Recreation Centre",
            "6121 University Boulevard",
            "Vancouver",
            49.2685, -123.2496,
            vec!["Pool", "Gym", "Basketball Courts", "Volleyball Courts"],
            VenueType::RecreationCenter,
        ),
    ];

    let mut venue_ids = Vec::new();

    for (name, address, city, lat, lon, amenities, venue_type) in venues {
        let venue_id = Uuid::new_v4();
        
        sqlx::query!(
            r#"
            INSERT INTO venues (
                id, name, address, city, province, postal_code,
                location, latitude, longitude, amenities, venue_type,
                created_at, updated_at
            )
            VALUES (
                $1, $2, $3, $4, $5, $6,
                ST_MakePoint($7, $8)::geography,
                $7, $8, $9, $10, $11, $12
            )
            ON CONFLICT DO NOTHING
            "#,
            venue_id,
            name,
            address,
            city,
            "BC",
            "V6B 1A1",
            lon,
            lat,
            &amenities,
            venue_type as _,
            Utc::now(),
            Utc::now()
        )
        .execute(&db)
        .await?;

        venue_ids.push(venue_id);
        println!("✅ Created venue: {}", name);
    }

    // Create games
    let sports = vec!["Basketball", "Soccer", "Volleyball", "Tennis", "Hockey"];
    let game_types = vec![GameType::DropIn, GameType::Pickup, GameType::Organized];
    
    let now = Utc::now();
    
    for (i, venue_id) in venue_ids.iter().enumerate() {
        for j in 0..5 {
            let sport = sports[j % sports.len()];
            let game_type = game_types[j % game_types.len()];
            let start_time = now + Duration::days(j as i64) + Duration::hours(18 + (i as i64));
            let end_time = start_time + Duration::hours(2);
            
            let game_id = Uuid::new_v4();
            
            sqlx::query!(
                r#"
                INSERT INTO games (
                    id, venue_id, sport_type, game_type, title,
                    description, start_time, end_time, max_attendees,
                    current_attendees, price, is_indoor, skill_level,
                    organizer_id, created_at, updated_at
                )
                VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
                )
                "#,
                game_id,
                venue_id,
                sport.to_lowercase(),
                game_type as _,
                format!("{} {} - Drop In", game_type.to_string(), sport),
                Some(format!("Join us for {} {}! All skill levels welcome.", 
                    if j % 2 == 0 { "casual" } else { "competitive" }, sport.to_lowercase())),
                start_time,
                end_time,
                Some(if sport == "Tennis" { 4 } else { 20 }),
                j % 5 + 1, // Random current attendees
                if j % 3 == 0 { Some(5.0) } else { Some(0.0) },
                true,
                Some(SkillLevel::AllLevels) as _,
                Some(user_ids[i % user_ids.len()]),
                Utc::now(),
                Utc::now()
            )
            .execute(&db)
            .await?;

            // Add some attendees
            for k in 0..(j % 3 + 1) {
                let attendee_id = Uuid::new_v4();
                let user_id = user_ids[(i + k) % user_ids.len()];
                
                sqlx::query!(
                    r#"
                    INSERT INTO game_attendees (id, game_id, user_id, status, joined_at)
                    VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT (game_id, user_id) DO NOTHING
                    "#,
                    attendee_id,
                    game_id,
                    user_id,
                    AttendeeStatus::Confirmed as _,
                    Utc::now()
                )
                .execute(&db)
                .await?;
            }
            
            println!("✅ Created game: {} at venue {}", sport, i + 1);
        }
    }

    // Create some friend connections
    sqlx::query!(
        r#"
        INSERT INTO user_connections (id, user_id, friend_id, connection_type, created_at)
        VALUES 
            ($1, $2, $3, 'friend', NOW()),
            ($4, $5, $6, 'friend', NOW()),
            ($7, $8, $9, 'friend', NOW())
        ON CONFLICT DO NOTHING
        "#,
        Uuid::new_v4(), user_ids[0], user_ids[1],
        Uuid::new_v4(), user_ids[1], user_ids[2],
        Uuid::new_v4(), user_ids[2], user_ids[3]
    )
    .execute(&db)
    .await?;

    println!("\n🎉 Database seeded successfully!");
    println!("\n📧 Test accounts:");
    println!("   Email: demo@example.com");
    println!("   Password: demo123");
    println!("\n   Email: john@example.com");
    println!("   Password: password123");

    Ok(())
}