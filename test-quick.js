#!/usr/bin/env node

const https = require('https');

console.log('🚀 Quick Finding Sports Test\n');

function test(name, url) {
    return new Promise((resolve) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const icon = res.statusCode === 200 ? '✅' : '❌';
                console.log(`${icon} ${name}: ${res.statusCode}`);
                if (res.statusCode !== 200 && data.includes('<!DOCTYPE html>')) {
                    console.log('   → Returning HTML error page');
                }
                resolve();
            });
        }).on('error', (err) => {
            console.log(`❌ ${name}: ERROR - ${err.message}`);
            resolve();
        });
    });
}

async function runTests() {
    await test('Homepage', 'https://findingsports.com/');
    await test('Health', 'https://findingsports.com/health');
    await test('Play Now', 'https://findingsports.com/api/play-now');
    await test('Venues', 'https://findingsports.com/api/venues');
    await test('Sports', 'https://findingsports.com/api/sports');
    await test('Games', 'https://findingsports.com/api/games');
    
    console.log('\n📝 Railway Dashboard: https://railway.app/dashboard');
    console.log('📖 Deployment Guide: ./railway-deployment-guide.md');
}

runTests();