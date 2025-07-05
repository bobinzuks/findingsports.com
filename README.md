# Finding Sports 🏃‍♂️

Finding Sports near you—wherever, whenever.

## Overview

Finding Sports solves the problem of scattered information about drop-in sports games across multiple recreation center websites. Our platform aggregates all venue data into one easy-to-use application with real-time availability, social features, and location-based search.

## Tech Stack

- **Backend**: Rust with Axum framework
- **Database**: PostgreSQL with PostGIS extension
- **Cache**: Redis
- **Frontend**: React (coming soon)
- **Real-time**: WebSockets
- **API**: GraphQL

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Rust 1.75+ (for local development)
- PostgreSQL 16 with PostGIS
- Redis 7+

### Using Docker (Recommended)

1. Clone the repository:
```bash
git clone <your-repo>
cd finding-sports
```

2. Start all services:
```bash
docker-compose up -d
```

This will start:
- PostgreSQL with PostGIS on port 5432
- Redis on port 6379
- Backend API on port 8080
- Frontend mockup on port 3000

3. Access the applications:
- Frontend: http://localhost:3000
- GraphQL Playground: http://localhost:8080
- API Health: http://localhost:8080/health

### Local Development

1. Install dependencies:
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install PostgreSQL with PostGIS
# On Ubuntu/Debian:
sudo apt install postgresql-16 postgresql-16-postgis-3

# On macOS:
brew install postgresql@16 postgis
```

2. Set up the database:
```bash
createdb finding_sports
psql finding_sports -c "CREATE EXTENSION postgis;"
```

3. Copy environment variables:
```bash
cd finding-sports-backend
cp .env.example .env
# Edit .env with your database credentials
```

4. Run migrations:
```bash
cd finding-sports-backend
cargo install sqlx-cli
sqlx migrate run
```

5. Start the backend:
```bash
cargo run
```

6. Start the frontend:
```bash
cd mockup
python3 -m http.server 3000
```

## Project Structure

```
finding-sports/
├── mockup/                     # Frontend mockup
│   ├── index.html
│   ├── css/
│   └── js/
├── finding-sports-backend/     # Rust backend
│   ├── src/
│   │   ├── models/            # Data models
│   │   ├── services/          # Business logic
│   │   ├── handlers/          # HTTP handlers
│   │   └── main.rs           # Entry point
│   ├── migrations/            # Database migrations
│   └── Cargo.toml
├── docker-compose.yml         # Docker services
└── docs/                      # Documentation
```

## Features

### Current
- ✅ Interactive mockup with map integration
- ✅ Location-based venue search
- ✅ Sport filtering
- ✅ Backend API structure
- ✅ Database schema with PostGIS
- ✅ Docker development environment

### In Progress
- 🚧 Web scraping for rec centers
- 🚧 Real-time WebSocket updates
- 🚧 User authentication
- 🚧 Social features

### Planned
- 📋 React frontend application
- 📋 Mobile apps (React Native)
- 📋 Advanced search filters
- 📋 Game booking system
- 📋 Push notifications

## API Examples

### GraphQL Queries

```graphql
# Search venues near location
query NearbyVenues {
  nearbyVenues(
    latitude: 49.2827
    longitude: -123.1207
    radiusKm: 5.0
    sportTypes: ["basketball", "soccer"]
  ) {
    id
    name
    address
    distance
    upcomingGames {
      title
      startTime
      availableSpots
    }
  }
}

# Get user's upcoming games
query MyGames {
  myUpcomingGames {
    id
    title
    venue {
      name
      address
    }
    startTime
    attendees {
      username
      avatarUrl
    }
  }
}
```

## Development

### Running Tests
```bash
cd finding-sports-backend
cargo test
```

### Adding a New Scraper
1. Implement the `VenueScraper` trait in `src/services/scraper.rs`
2. Add to the `ScraperOrchestrator`
3. Test with real data

### Database Migrations
```bash
# Create new migration
sqlx migrate add <migration_name>

# Run migrations
sqlx migrate run

# Revert last migration
sqlx migrate revert
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Contact

For questions or support, please open an issue on GitHub.