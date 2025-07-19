const { Pool } = require('pg');
require('dotenv').config();

/**
 * PostgreSQL Database Configuration
 * 
 * Features:
 * - Connection pooling for performance
 * - Automatic reconnection
 * - Query logging in development
 * - SSL support for production
 * - Health check functionality
 */

// Database configuration
const dbConfig = {
  // Connection settings
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'finding_sports',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
  
  // Connection pool settings
  max: parseInt(process.env.DB_POOL_MAX) || 20, // Maximum number of connections
  min: parseInt(process.env.DB_POOL_MIN) || 5,  // Minimum number of connections
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000, // 30 seconds
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 5000, // 5 seconds
  
  // SSL configuration for production
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false // For hosted databases like Railway, Heroku
  } : false,
  
  // Query timeout
  query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT) || 60000 // 60 seconds
};

// Parse DATABASE_URL if provided (common in production)
if (process.env.DATABASE_URL) {
  const url = new URL(process.env.DATABASE_URL);
  dbConfig.user = url.username;
  dbConfig.password = url.password;
  dbConfig.host = url.hostname;
  dbConfig.port = url.port;
  dbConfig.database = url.pathname.slice(1); // Remove leading slash
  dbConfig.ssl = { rejectUnauthorized: false }; // Required for most hosted databases
}

// Create connection pool
const pool = new Pool(dbConfig);

// Connection event handlers
pool.on('connect', (client) => {
  console.log('🔗 New database client connected');
  if (process.env.NODE_ENV === 'development') {
    console.log(`📊 Pool stats: Total=${pool.totalCount}, Idle=${pool.idleCount}, Waiting=${pool.waitingCount}`);
  }
});

pool.on('acquire', (client) => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🎯 Database client acquired from pool');
  }
});

pool.on('remove', (client) => {
  console.log('❌ Database client removed from pool');
});

pool.on('error', (err, client) => {
  console.error('💥 Unexpected error on idle database client:', err);
  // Don't exit the process on database errors
});

// Query wrapper with logging and error handling
const query = async (text, params = []) => {
  const start = Date.now();
  
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Executing query:', text.substring(0, 100) + (text.length > 100 ? '...' : ''));
      if (params.length > 0) {
        console.log('📝 Query params:', params);
      }
    }
    
    const result = await pool.query(text, params);
    
    if (process.env.NODE_ENV === 'development') {
      const duration = Date.now() - start;
      console.log(`✅ Query completed in ${duration}ms, returned ${result.rowCount} rows`);
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`❌ Query failed after ${duration}ms:`, error.message);
    console.error('📄 Failed query:', text);
    if (params.length > 0) {
      console.error('📝 Query params:', params);
    }
    throw error;
  }
};

// Transaction wrapper
const transaction = async (callback) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Health check function
const healthCheck = async () => {
  try {
    const result = await query('SELECT NOW() as current_time, version() as postgres_version');
    const stats = {
      status: 'healthy',
      timestamp: result.rows[0].current_time,
      version: result.rows[0].postgres_version,
      pool: {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount
      }
    };
    
    console.log('💚 Database health check passed:', stats.timestamp);
    return stats;
  } catch (error) {
    console.error('💔 Database health check failed:', error.message);
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

// Graceful shutdown
const shutdown = async () => {
  console.log('🔄 Shutting down database connection pool...');
  try {
    await pool.end();
    console.log('✅ Database pool closed successfully');
  } catch (error) {
    console.error('❌ Error closing database pool:', error);
  }
};

// Initialize database connection
const initialize = async () => {
  try {
    console.log('🚀 Initializing database connection...');
    console.log('📋 Database config:', {
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.user,
      ssl: !!dbConfig.ssl,
      pool_max: dbConfig.max,
      pool_min: dbConfig.min
    });
    
    // Test the connection
    const health = await healthCheck();
    if (health.status === 'healthy') {
      console.log('✅ Database initialized successfully');
      console.log(`📊 PostgreSQL version: ${health.version.split(' ')[1]}`);
      return true;
    } else {
      throw new Error('Database health check failed');
    }
  } catch (error) {
    console.error('💥 Failed to initialize database:', error.message);
    console.error('🔧 Please check your database configuration and ensure PostgreSQL is running');
    
    if (process.env.NODE_ENV === 'production') {
      console.error('⚠️ Database connection required in production');
      process.exit(1);
    } else {
      console.log('⚠️ Continuing in development mode without database (in-memory fallback)');
      return false;
    }
  }
};

module.exports = {
  pool,
  query,
  transaction,
  healthCheck,
  shutdown,
  initialize,
  config: dbConfig
};