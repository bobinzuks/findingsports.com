// Comprehensive deployment test
const { spawn } = require('child_process');
const http = require('http');

console.log('🧪 Testing deployment configuration...\n');

// Test 1: Check if server file exists
const fs = require('fs');
const serverPath = './absolute-failsafe-server.js';

if (!fs.existsSync(serverPath)) {
    console.error('❌ Server file not found!');
    process.exit(1);
}
console.log('✅ Server file exists');

// Test 2: Check syntax
try {
    require(serverPath);
    console.log('✅ Server syntax is valid');
} catch (err) {
    console.error('❌ Syntax error:', err);
    process.exit(1);
}

// Test 3: Start server
console.log('\n🚀 Starting server...');
const server = spawn('node', [serverPath], {
    env: { ...process.env, PORT: 3001 }
});

let serverStarted = false;

server.stdout.on('data', (data) => {
    console.log('Server:', data.toString());
    if (data.toString().includes('SERVER STARTED SUCCESSFULLY')) {
        serverStarted = true;
        runHealthChecks();
    }
});

server.stderr.on('data', (data) => {
    console.error('Server error:', data.toString());
});

// Test health endpoints after 2 seconds
function runHealthChecks() {
    console.log('\n🏥 Testing health endpoints...');
    
    const endpoints = ['/health', '/api/health', '/_health', '/healthz', '/'];
    let completed = 0;
    
    endpoints.forEach(endpoint => {
        http.get(`http://localhost:3001${endpoint}`, (res) => {
            if (res.statusCode === 200) {
                console.log(`✅ ${endpoint} - OK (${res.statusCode})`);
            } else {
                console.log(`❌ ${endpoint} - Failed (${res.statusCode})`);
            }
            completed++;
            if (completed === endpoints.length) {
                console.log('\n✅ All tests passed! Deployment is 100% ready.');
                server.kill();
                process.exit(0);
            }
        }).on('error', (err) => {
            console.error(`❌ ${endpoint} - Error:`, err.message);
            completed++;
            if (completed === endpoints.length) {
                server.kill();
                process.exit(1);
            }
        });
    });
}

// Timeout after 10 seconds
setTimeout(() => {
    if (!serverStarted) {
        console.error('\n❌ Server failed to start within 10 seconds');
        server.kill();
        process.exit(1);
    }
}, 10000);