#!/usr/bin/env node

/**
 * Automated Screenshot Testing for Finding Sports
 * Takes screenshots of live site and saves to Downloads folder
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Get user's Downloads folder
const DOWNLOADS_DIR = path.join(require('os').homedir(), 'Downloads');

// Base URL for testing
const BASE_URL = 'https://findingsports.com';

// Test cases
const testCases = [
    {
        name: 'Homepage - Header Check',
        url: BASE_URL,
        checks: [
            'Language selector should NOT be visible',
            'Online indicator should NOT be visible', 
            'Help button should NOT be visible',
            'Login button SHOULD be visible'
        ]
    },
    {
        name: 'Homepage - Map Check',
        url: BASE_URL,
        checks: [
            'Map should render (not gray box)',
            'Map should show location markers'
        ]
    },
    {
        name: 'Play Now - Games Count',
        url: BASE_URL,
        action: 'Click Play Now button',
        checks: [
            'Should show MORE than 2 games',
            'Should display "All Available Games" section',
            'Should show game count (21 games)'
        ]
    },
    {
        name: 'Login Page',
        url: `${BASE_URL}/login.html`,
        checks: [
            'Login form should be visible',
            'Email and password fields present'
        ]
    }
];

/**
 * Take screenshot using Firefox
 */
async function takeScreenshot(testCase, index) {
    return new Promise((resolve, reject) => {
        const timestamp = new Date().toISOString().replace(/:/g, '-').substring(0, 19);
        const filename = `Screenshot ${timestamp} Finding Sports - ${testCase.name.replace(/\s+/g, '-')}.png`;
        const filepath = path.join(DOWNLOADS_DIR, filename);
        
        console.log(`\n📸 Test ${index + 1}: ${testCase.name}`);
        console.log(`🌐 URL: ${testCase.url}`);
        
        if (testCase.action) {
            console.log(`🎯 Action: ${testCase.action}`);
        }
        
        console.log('📋 Checks:');
        testCase.checks.forEach(check => {
            console.log(`   - ${check}`);
        });
        
        // Open Firefox and wait
        console.log('\n⏳ Opening in Firefox...');
        exec(`firefox "${testCase.url}"`, (error) => {
            if (error) {
                console.error('❌ Failed to open Firefox:', error);
                reject(error);
                return;
            }
        });
        
        // Wait for page load
        setTimeout(() => {
            console.log('📸 Taking screenshot...');
            
            // Try to take screenshot using gnome-screenshot
            exec(`gnome-screenshot -w -f "${filepath}"`, (error, stdout, stderr) => {
                if (error) {
                    // Try alternative method
                    exec(`import "${filepath}"`, (error2) => {
                        if (error2) {
                            console.log('❌ Screenshot failed. Please take manual screenshot.');
                            console.log(`📁 Save as: ${filename}`);
                            resolve({ success: false, filename, testCase });
                        } else {
                            console.log(`✅ Screenshot saved: ${filename}`);
                            resolve({ success: true, filename, filepath, testCase });
                        }
                    });
                } else {
                    console.log(`✅ Screenshot saved: ${filename}`);
                    resolve({ success: true, filename, filepath, testCase });
                }
            });
        }, 5000); // Wait 5 seconds for page load
    });
}

/**
 * Run all tests
 */
async function runTests() {
    console.log('🧪 Finding Sports - Automated Screenshot Testing');
    console.log('=' .repeat(60));
    console.log(`📁 Screenshots will be saved to: ${DOWNLOADS_DIR}`);
    console.log('=' .repeat(60));
    
    const results = [];
    
    // Run tests sequentially
    for (let i = 0; i < testCases.length; i++) {
        const result = await takeScreenshot(testCases[i], i);
        results.push(result);
        
        // Wait between tests
        if (i < testCases.length - 1) {
            console.log('\n⏳ Waiting before next test...\n');
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    
    results.forEach((result, index) => {
        if (result.success) {
            console.log(`✅ Test ${index + 1}: ${result.testCase.name}`);
            console.log(`   📸 ${result.filename}`);
        } else {
            console.log(`❌ Test ${index + 1}: ${result.testCase.name} - Manual screenshot needed`);
        }
    });
    
    console.log('\n📋 MANUAL VERIFICATION CHECKLIST:');
    console.log('='.repeat(60));
    
    testCases.forEach((testCase, index) => {
        console.log(`\n${index + 1}. ${testCase.name}:`);
        testCase.checks.forEach(check => {
            console.log(`   [ ] ${check}`);
        });
    });
    
    console.log('\n🔍 Please review each screenshot and check off items above.');
    console.log(`📁 Screenshots location: ${DOWNLOADS_DIR}`);
}

// Check if screenshot tools are available
function checkDependencies() {
    return new Promise((resolve) => {
        exec('which gnome-screenshot', (error1) => {
            exec('which import', (error2) => {
                if (error1 && error2) {
                    console.log('⚠️  No screenshot tool found.');
                    console.log('📦 Please install one of:');
                    console.log('   - gnome-screenshot: sudo apt install gnome-screenshot');
                    console.log('   - ImageMagick: sudo apt install imagemagick');
                    resolve(false);
                } else {
                    resolve(true);
                }
            });
        });
    });
}

// Main execution
async function main() {
    const hasDeps = await checkDependencies();
    
    if (!hasDeps) {
        console.log('\n❌ Missing dependencies. Please install required tools.');
        process.exit(1);
    }
    
    await runTests();
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { takeScreenshot, runTests };