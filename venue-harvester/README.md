# Finding Sports Venue Harvester

Lightweight Python service for harvesting sports venue data in BC, Canada.

## Features
- No AI/ML dependencies (runs on ~50MB memory)
- Automatic harvesting every 6 hours
- REST API for venue data access
- SQLite database storage

## Deployment
This service is designed to run as a separate Railway service alongside the main Finding Sports app.

## API Endpoints
- `GET /` - API documentation
- `GET /health` - Health check
- `GET /api/venues` - Get all venues
- `GET /api/venues/search?city=vancouver` - Search venues
- `POST /api/harvest` - Trigger manual harvest
- `GET /api/status` - Harvest status