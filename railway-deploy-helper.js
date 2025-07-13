#!/usr/bin/env node

/**
 * Railway Deploy Helper - Quick setup for Finding Sports
 * Generates secure environment variables for Railway
 */

const crypto = require('crypto');
const fs = require('fs');

// Generate secure secrets
const generateSecureSecret = () => crypto.randomBytes(32).toString('hex');

console.log('🚂 Railway Environment Variables for Finding Sports\n');
console.log('Copy and paste these into Railway:\n');

const jwtSecret = generateSecureSecret();
const envVars = {
  JWT_SECRET: jwtSecret,
  NODE_ENV: 'production',
  CORS_ORIGIN: 'https://findingsports.com',
  PORT: '8080',
  
  // Optional but recommended
  GOOGLE_MAPS_API_KEY: 'your-google-maps-api-key-here',
  
  // Feature flags
  ENABLE_WEBSOCKET: 'true',
  ENABLE_CACHING: 'true',
  ENABLE_INTELLIGENT_CACHE: 'true',
  ENABLE_SWARM_SYSTEM: 'true',
  
  // Performance settings
  CACHE_TTL: '3600',
  AGGREGATION_INTERVAL: '300000',
  MAX_CONCURRENT_SCRAPERS: '10',
  
  // WebSocket settings
  WS_HEARTBEAT_INTERVAL: '30000',
  WS_MAX_CONNECTIONS: '1000',
  
  // Logging
  LOG_LEVEL: 'info'
};

// Display in Railway format
console.log('```');
Object.entries(envVars).forEach(([key, value]) => {
  console.log(`${key}=${value}`);
});
console.log('```\n');

// Save to file for reference
const envContent = Object.entries(envVars)
  .map(([key, value]) => `${key}=${value}`)
  .join('\n');

fs.writeFileSync('.env.railway-generated', envContent);

console.log('📋 Instructions:');
console.log('1. Go to Railway dashboard: https://railway.app/dashboard');
console.log('2. Open your Finding Sports project');
console.log('3. Click on your service');
console.log('4. Go to "Variables" tab');
console.log('5. Click "RAW Editor"');
console.log('6. Paste the variables above');
console.log('7. Click "Update Variables"');
console.log('8. Railway will automatically redeploy\n');

console.log('💾 Saved to: .env.railway-generated (for reference only)\n');

console.log('🔒 Security Notes:');
console.log('- JWT_SECRET has been randomly generated');
console.log('- Never commit .env files to git');
console.log('- Add Google Maps API key if you have one\n');

console.log('🚀 After setting variables, Railway will redeploy automatically.');
console.log('   Monitor the deployment at: https://railway.app/dashboard\n');

console.log('✅ Once deployed, test with: node test-deployment-live.js');