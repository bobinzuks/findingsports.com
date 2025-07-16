#!/usr/bin/env node

const { Pool } = require('pg');
const GameModel = require('../src/models/game.model');
require('dotenv').config();

async function migrate() {
  console.log('Starting database migration...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    const gameModel = new GameModel(pool);
    
    // Create tables
    console.log('Creating tables...');
    await gameModel.createTables();
    
    // Create partitions for next 7 days
    console.log('Creating partitions...');
    await gameModel.createPartitions();
    
    // Create cleanup job
    console.log('Setting up cleanup jobs...');
    await pool.query(`
      -- Create a function to drop old partitions
      CREATE OR REPLACE FUNCTION drop_old_game_partitions() RETURNS void AS $$
      DECLARE
        partition_name TEXT;
      BEGIN
        FOR partition_name IN 
          SELECT tablename 
          FROM pg_tables 
          WHERE schemaname = 'public' 
          AND tablename LIKE 'games_%'
          AND tablename < 'games_' || to_char(CURRENT_DATE - INTERVAL '7 days', 'YYYY_MM_DD')
        LOOP
          EXECUTE 'DROP TABLE IF EXISTS ' || partition_name;
          RAISE NOTICE 'Dropped partition %', partition_name;
        END LOOP;
      END;
      $$ LANGUAGE plpgsql;

      -- Create a function to create future partitions
      CREATE OR REPLACE FUNCTION create_future_game_partitions() RETURNS void AS $$
      DECLARE
        i INTEGER;
        partition_date DATE;
        partition_name TEXT;
        start_date TEXT;
        end_date TEXT;
      BEGIN
        FOR i IN 0..7 LOOP
          partition_date := CURRENT_DATE + (i || ' days')::INTERVAL;
          partition_name := 'games_' || to_char(partition_date, 'YYYY_MM_DD');
          start_date := to_char(partition_date, 'YYYY-MM-DD');
          end_date := to_char(partition_date + INTERVAL '1 day', 'YYYY-MM-DD');
          
          IF NOT EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename = partition_name
          ) THEN
            EXECUTE format(
              'CREATE TABLE %I PARTITION OF games FOR VALUES FROM (%L) TO (%L)',
              partition_name, start_date, end_date
            );
            RAISE NOTICE 'Created partition %', partition_name;
          END IF;
        END LOOP;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Create indexes for performance
    console.log('Creating additional indexes...');
    await pool.query(`
      -- Covering index for location queries
      CREATE INDEX IF NOT EXISTS idx_games_covering 
      ON games (start_time, venue_id, sport, game_type) 
      INCLUDE (end_time, capacity, current_players, skill_level, price);
      
      -- Index for user games
      CREATE INDEX IF NOT EXISTS idx_user_games_user 
      ON user_games (user_id, verification_status);
      
      -- Index for venue updates
      CREATE INDEX IF NOT EXISTS idx_venues_updated 
      ON venues (updated_at);
    `);

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration
migrate();