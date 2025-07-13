#!/usr/bin/env node

/**
 * Emergency Railway Deployment Test
 * Creates and deploys a minimal server to verify Railway is working
 */

const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

async function createMinimalServer() {
    console.log('🚨 Creating emergency minimal server for testing...\n');
    
    // Create a minimal server that definitely works
    const minimalServer = `
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 8080;

// Enable CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Emergency server running',
        timestamp: new Date().toISOString(),
        port: PORT,
        env: process.env.NODE_ENV || 'development'
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.send(\`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Finding Sports - Emergency Server</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 40px; }
                .status { padding: 20px; background: #f0f0f0; border-radius: 8px; }
                .ok { color: green; }
                .error { color: red; }
            </style>
        </head>
        <body>
            <h1>Finding Sports - Emergency Server</h1>
            <div class="status">
                <p class="ok">✅ Server is running!</p>
                <p>This is a minimal emergency server to verify Railway deployment.</p>
                <p>Time: \${new Date().toISOString()}</p>
                <p>Port: \${PORT}</p>
                <h3>Test Endpoints:</h3>
                <ul>
                    <li><a href="/health">/health</a> - Health check</li>
                    <li><a href="/api/test">/api/test</a> - API test</li>
                </ul>
                <h3>Next Steps:</h3>
                <ol>
                    <li>✅ Railway deployment is working</li>
                    <li>Set JWT_SECRET in Railway environment variables</li>
                    <li>Deploy the full server.js</li>
                </ol>
            </div>
        </body>
        </html>
    \`);
});

// Test API endpoint
app.get('/api/test', (req, res) => {
    res.json({
        message: 'API is working',
        timestamp: new Date().toISOString(),
        headers: req.headers
    });
});

// Catch all for debugging
app.use('*', (req, res) => {
    console.log(\`404: \${req.method} \${req.originalUrl}\`);
    res.status(404).json({
        error: 'Not found',
        path: req.originalUrl,
        method: req.method,
        message: 'Emergency server - endpoint not implemented'
    });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(\`🚨 Emergency server running on port \${PORT}\`);
    console.log(\`Environment: \${process.env.NODE_ENV || 'development'}\`);
    console.log(\`Railway deployment: \${process.env.RAILWAY_ENVIRONMENT || 'unknown'}\`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
`;

    // Save the emergency server
    await fs.writeFile('mockup/backend/server-emergency-test.js', minimalServer);
    console.log('✅ Created emergency test server\n');
    
    // Update Procfile to use emergency server
    await fs.writeFile('Procfile', 'web: cd mockup/backend && node server-emergency-test.js\n');
    console.log('✅ Updated Procfile to use emergency server\n');
    
    // Create minimal package.json if needed
    const minimalPackage = {
        "name": "finding-sports-backend",
        "version": "1.0.0",
        "description": "Finding Sports Backend - Emergency Test",
        "main": "server-emergency-test.js",
        "scripts": {
            "start": "node server-emergency-test.js"
        },
        "dependencies": {
            "express": "^4.18.2"
        },
        "engines": {
            "node": ">=18.0.0"
        }
    };
    
    await fs.writeFile(
        'mockup/backend/package-emergency.json', 
        JSON.stringify(minimalPackage, null, 2)
    );
    
    return true;
}

async function deployEmergencyServer() {
    try {
        await createMinimalServer();
        
        console.log('📦 Committing emergency server...\n');
        
        const commands = [
            'git add .',
            'git commit -m "🚨 EMERGENCY: Deploy minimal test server to verify Railway\n\nThis deploys a minimal Express server to test if Railway deployment is working.\nOnce confirmed, we can deploy the full server."',
            'git push origin main'
        ];
        
        for (const cmd of commands) {
            console.log(`Running: ${cmd}`);
            await new Promise((resolve, reject) => {
                exec(cmd, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`Error: ${error.message}`);
                        reject(error);
                    } else {
                        console.log(stdout);
                        resolve(stdout);
                    }
                });
            });
        }
        
        console.log('\n✅ Emergency server deployed!\n');
        console.log('⏳ Wait 2-3 minutes for Railway to build and deploy\n');
        console.log('Then test these URLs:');
        console.log('  - https://findingsports-production.up.railway.app/');
        console.log('  - https://findingsports-production.up.railway.app/health');
        console.log('  - https://findingsports-production.up.railway.app/api/test');
        
        // Wait a bit then start testing
        console.log('\n⏳ Waiting 2 minutes before testing...');
        await new Promise(resolve => setTimeout(resolve, 120000));
        
        // Test the deployment
        console.log('\n🔍 Testing emergency deployment...\n');
        const https = require('https');
        
        const testUrl = 'https://findingsports-production.up.railway.app/health';
        https.get(testUrl, (res) => {
            console.log(`Status: ${res.statusCode}`);
            if (res.statusCode === 200) {
                console.log('✅ Emergency server is working!');
                console.log('\nNext steps:');
                console.log('1. Set JWT_SECRET in Railway environment');
                console.log('2. Update Procfile to use server.js');
                console.log('3. Push the full server deployment');
            } else {
                console.log('❌ Emergency server not responding correctly');
                console.log('Check Railway logs for errors');
            }
        }).on('error', (err) => {
            console.error('❌ Failed to reach server:', err.message);
        });
        
    } catch (error) {
        console.error('Failed to deploy emergency server:', error);
    }
}

// Run the emergency deployment
deployEmergencyServer();