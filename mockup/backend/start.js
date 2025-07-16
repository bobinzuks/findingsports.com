#!/usr/bin/env node

// Simple startup script with better error handling
console.log('🚀 Starting Finding Sports backend...');
console.log('Node version:', process.version);
console.log('Current directory:', process.cwd());

// Set default environment
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Ensure required dependencies exist
try {
    require('express');
    require('cors');
    console.log('✅ Core dependencies found');
} catch (error) {
    console.error('❌ Missing dependencies:', error.message);
    console.log('Running npm install...');
    require('child_process').execSync('npm install', { stdio: 'inherit' });
}

// Start the server with error handling
try {
    require('./server.js');
} catch (error) {
    console.error('❌ Server startup failed:', error);
    console.error(error.stack);
    
    // Try minimal server as fallback
    console.log('🔄 Attempting minimal server startup...');
    try {
        require('./server-minimal.js');
    } catch (minimalError) {
        console.error('❌ Minimal server also failed:', minimalError);
        process.exit(1);
    }
}