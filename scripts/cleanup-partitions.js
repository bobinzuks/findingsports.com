#!/usr/bin/env node

const { Pool } = require('pg');
const winston = require('winston');
require('dotenv').config();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [new winston.transports.Console()],
});

async function cleanupPartitions() {
  logger.info('Starting partition cleanup...');
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    // Drop old partitions
    logger.info('Dropping old partitions...');
    await pool.query('SELECT drop_old_game_partitions()');
    
    // Create future partitions
    logger.info('Creating future partitions...');
    await pool.query('SELECT create_future_game_partitions()');
    
    // Get partition info
    const partitionInfo = await pool.query(`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
        (SELECT COUNT(*) FROM pg_catalog.pg_class WHERE relname = tablename) as row_estimate
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename LIKE 'games_%'
      ORDER BY tablename;
    `);

    logger.info('Current partitions:');
    partitionInfo.rows.forEach(partition => {
      logger.info(`  ${partition.tablename}: ${partition.size}`);
    });

    // Vacuum analyze for performance
    logger.info('Running VACUUM ANALYZE on games tables...');
    await pool.query('VACUUM ANALYZE games;');
    await pool.query('VACUUM ANALYZE venues;');

    // Get storage statistics
    const stats = await pool.query(`
      SELECT 
        COUNT(DISTINCT venue_id) as total_venues,
        COUNT(*) as total_games,
        COUNT(CASE WHEN start_time >= NOW() THEN 1 END) as upcoming_games,
        COUNT(CASE WHEN start_time < NOW() THEN 1 END) as past_games
      FROM games
      WHERE start_time >= NOW() - INTERVAL '7 days';
    `);

    logger.info('Storage statistics:', stats.rows[0]);

    logger.info('Partition cleanup completed successfully!');
  } catch (error) {
    logger.error('Partition cleanup failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run cleanup
cleanupPartitions();