#!/usr/bin/env node

console.log('🚀 Starting Finding Sports server...');
console.log('Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
  PWD: process.cwd()
});

// Check if we're in the right directory
const fs = require('fs');
const path = require('path');

console.log('\nChecking files...');
const requiredFiles = ['server.js', 'package.json'];
requiredFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
});

// Try to start the server
try {
  console.log('\nStarting server.js...');
  require('./server.js');
} catch (error) {
  console.error('\n❌ Server failed to start:', error.message);
  console.error('Stack:', error.stack);
  
  // Don't exit, keep the process alive for Railway to see the error
  setInterval(() => {
    console.log('Keeping process alive for debugging...');
  }, 30000);
}