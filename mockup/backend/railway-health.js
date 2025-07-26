// Railway Health Check Script
// This script runs a health check against our server

const http = require('http');

const PORT = process.env.PORT || 3000;

function checkHealth() {
    const options = {
        hostname: 'localhost',
        port: PORT,
        path: '/health',
        method: 'GET',
        timeout: 5000
    };

    const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            if (res.statusCode === 200) {
                console.log('✅ Health check passed:', data);
                process.exit(0);
            } else {
                console.error('❌ Health check failed:', res.statusCode);
                process.exit(1);
            }
        });
    });

    req.on('error', (err) => {
        console.error('❌ Health check error:', err.message);
        process.exit(1);
    });

    req.on('timeout', () => {
        console.error('❌ Health check timeout');
        req.destroy();
        process.exit(1);
    });

    req.end();
}

// Wait a bit for server to start
setTimeout(checkHealth, 2000);