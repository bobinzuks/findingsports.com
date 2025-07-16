const { Pool } = require('pg');
const geohash = require('geohash');

class GameModel {
  constructor(pool) {
    this.pool = pool;
  }

  async createTables() {
    await this.pool.query(`
      -- Enable PostGIS
      CREATE EXTENSION IF NOT EXISTS postgis;
      
      -- Venues table
      CREATE TABLE IF NOT EXISTS venues (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        address TEXT,
        location GEOGRAPHY(POINT, 4326) NOT NULL,
        geohash VARCHAR(12) NOT NULL,
        type VARCHAR(50),
        source VARCHAR(50) NOT NULL,
        source_id VARCHAR(255),
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_source_venue UNIQUE(source, source_id)
      );
      
      -- Games table (partitioned by date)
      CREATE TABLE IF NOT EXISTS games (
        id UUID DEFAULT gen_random_uuid(),
        venue_id UUID NOT NULL REFERENCES venues(id),
        sport VARCHAR(50) NOT NULL,
        game_type VARCHAR(50) NOT NULL DEFAULT 'drop-in',
        start_time TIMESTAMP WITH TIME ZONE NOT NULL,
        end_time TIMESTAMP WITH TIME ZONE NOT NULL,
        capacity INTEGER,
        current_players INTEGER DEFAULT 0,
        skill_level VARCHAR(50),
        price DECIMAL(10,2),
        source VARCHAR(50) NOT NULL,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id, start_time)
      ) PARTITION BY RANGE (start_time);
      
      -- User submitted games
      CREATE TABLE IF NOT EXISTS user_games (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        game_id UUID NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        verification_status VARCHAR(50) DEFAULT 'pending',
        verification_count INTEGER DEFAULT 0,
        reported_count INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (game_id, created_at) REFERENCES games(id, start_time)
      );
      
      -- Create indexes
      CREATE INDEX idx_venues_location ON venues USING GIST(location);
      CREATE INDEX idx_venues_geohash ON venues(geohash);
      CREATE INDEX idx_games_venue_time ON games(venue_id, start_time);
      CREATE INDEX idx_games_sport ON games(sport);
      CREATE INDEX idx_games_start_time ON games(start_time);
    `);
  }

  async createPartitions() {
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const tableName = `games_${date.toISOString().split('T')[0].replace(/-/g, '_')}`;
      const startDate = date.toISOString().split('T')[0];
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS ${tableName} 
        PARTITION OF games 
        FOR VALUES FROM ('${startDate}') TO ('${endDate.toISOString().split('T')[0]}');
      `);
    }
  }

  async addVenue(venue) {
    const { name, address, latitude, longitude, type, source, sourceId, metadata } = venue;
    const hash = geohash.encode(latitude, longitude, 8);
    
    const query = `
      INSERT INTO venues (name, address, location, geohash, type, source, source_id, metadata)
      VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326), $5, $6, $7, $8, $9)
      ON CONFLICT (source, source_id) 
      DO UPDATE SET 
        name = EXCLUDED.name,
        address = EXCLUDED.address,
        location = EXCLUDED.location,
        geohash = EXCLUDED.geohash,
        metadata = EXCLUDED.metadata,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    
    const result = await this.pool.query(query, [
      name, address, longitude, latitude, hash, type, source, sourceId, metadata
    ]);
    
    return result.rows[0];
  }

  async addGame(game) {
    const { venueId, sport, gameType, startTime, endTime, capacity, skillLevel, price, source, metadata } = game;
    
    const query = `
      INSERT INTO games (venue_id, sport, game_type, start_time, end_time, capacity, skill_level, price, source, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT DO NOTHING
      RETURNING *;
    `;
    
    const result = await this.pool.query(query, [
      venueId, sport, gameType, startTime, endTime, capacity, skillLevel, price, source, metadata
    ]);
    
    return result.rows[0];
  }

  async findGamesNearLocation(latitude, longitude, radiusKm = 10, filters = {}) {
    const hash = geohash.encode(latitude, longitude, 4); // Lower precision for radius search
    
    const query = `
      WITH nearby_venues AS (
        SELECT 
          v.*,
          ST_Distance(v.location::geography, ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography) as distance_meters
        FROM venues v
        WHERE 
          v.geohash LIKE $3 || '%'
          AND ST_DWithin(
            v.location::geography,
            ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
            $4
          )
      )
      SELECT 
        g.*,
        nv.name as venue_name,
        nv.address as venue_address,
        nv.distance_meters,
        nv.location
      FROM games g
      JOIN nearby_venues nv ON g.venue_id = nv.id
      WHERE 
        g.start_time >= NOW()
        AND g.start_time <= NOW() + INTERVAL '7 days'
        ${filters.sport ? 'AND g.sport = $5' : ''}
        ${filters.gameType ? 'AND g.game_type = $6' : ''}
      ORDER BY g.start_time, nv.distance_meters
      LIMIT 100;
    `;
    
    const params = [longitude, latitude, hash, radiusKm * 1000];
    if (filters.sport) params.push(filters.sport);
    if (filters.gameType) params.push(filters.gameType);
    
    const result = await this.pool.query(query, params);
    return result.rows;
  }

  async cleanupOldGames() {
    const query = `DROP TABLE IF EXISTS games_${new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0].replace(/-/g, '_')};`;
    await this.pool.query(query);
  }
}

module.exports = GameModel;