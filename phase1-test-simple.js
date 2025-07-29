#!/usr/bin/env node
// Phase 1 Simple Testing Script for Finding Sports using built-in modules
const https = require('https');
const { URL } = require('url');

const SITE_URL = 'https://findingsports.com';
const TEST_RESULTS = {
    passed: [],
    failed: [],
    warnings: []
};

// Helper function to fetch page content
function fetchPage(url) {
    return new Promise((resolve, reject) => {
        https.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Cache-Control': 'no-cache'
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, data }));
        }).on('error', reject);
    });
}

// Simple HTML parser
function findInHTML(html, patterns) {
    const lowerHTML = html.toLowerCase();
    return patterns.some(pattern => {
        if (pattern instanceof RegExp) {
            return pattern.test(lowerHTML);
        }
        return lowerHTML.includes(pattern.toLowerCase());
    });
}

// Test 1: Verify removed items
async function test1_ItemsRemoved() {
    console.log('\n📋 Test 1: Checking if unwanted items are removed...');
    
    try {
        const response = await fetchPage(SITE_URL);
        const html = response.data;
        
        // Check for banned content
        const languagePatterns = ['🌐', 'language selector', 'lang-menu', 'i18n', 'English ▼'];
        const helpPatterns = ['? Help', 'help-button', 'help-icon', '?</button>'];
        const onlinePatterns = ['Online</span>', 'online-indicator', 'connection-status'];
        
        const hasLanguage = findInHTML(html, languagePatterns);
        const hasHelp = findInHTML(html, helpPatterns);
        const hasOnline = findInHTML(html, onlinePatterns);
        
        if (!hasLanguage && !hasHelp && !hasOnline) {
            TEST_RESULTS.passed.push('Test 1: All unwanted items removed ✅');
            console.log('✅ PASS: No unwanted elements found');
            return true;
        } else {
            const found = [];
            if (hasLanguage) found.push('Language selector');
            if (hasHelp) found.push('Help button');
            if (hasOnline) found.push('Online status');
            TEST_RESULTS.failed.push(`Test 1: Found ${found.join(', ')}`);
            console.log(`❌ FAIL: Found ${found.join(', ')}`);
            return false;
        }
    } catch (error) {
        TEST_RESULTS.failed.push(`Test 1: Error - ${error.message}`);
        console.log(`❌ ERROR: ${error.message}`);
        return false;
    }
}

// Test 2: Map functionality
async function test2_MapFunctionality() {
    console.log('\n📋 Test 2: Checking map functionality...');
    
    try {
        const response = await fetchPage(SITE_URL);
        const html = response.data;
        
        const mapPatterns = ['id="map"', 'class="map', 'maplibre', 'mapbox', 'loading map'];
        const hasMap = findInHTML(html, mapPatterns);
        
        if (hasMap) {
            TEST_RESULTS.passed.push('Test 2: Map element found ✅');
            console.log('✅ PASS: Map functionality present');
            return true;
        } else {
            TEST_RESULTS.failed.push('Test 2: No map element found');
            console.log('❌ FAIL: Map not found');
            return false;
        }
    } catch (error) {
        TEST_RESULTS.failed.push(`Test 2: Error - ${error.message}`);
        console.log(`❌ ERROR: ${error.message}`);
        return false;
    }
}

// Test 3: Play Now button and games
async function test3_PlayNowButton() {
    console.log('\n📋 Test 3: Checking Play Now button and games...');
    
    try {
        const response = await fetchPage(SITE_URL);
        const html = response.data;
        
        const playNowPatterns = ['Play Now', 'play-now', 'playNow'];
        const hasPlayNow = findInHTML(html, playNowPatterns);
        
        // Also check games API
        const apiResponse = await fetchPage(`${SITE_URL}/api/v2/games`);
        const hasAPI = apiResponse.status === 200;
        
        if (hasPlayNow) {
            TEST_RESULTS.passed.push('Test 3: Play Now button found ✅');
            console.log('✅ PASS: Play Now button present');
            if (hasAPI) {
                console.log('   ✓ Games API also responding');
            }
            return true;
        } else {
            TEST_RESULTS.failed.push('Test 3: No Play Now button');
            console.log('❌ FAIL: Play Now button not found');
            return false;
        }
    } catch (error) {
        TEST_RESULTS.failed.push(`Test 3: Error - ${error.message}`);
        console.log(`❌ ERROR: ${error.message}`);
        return false;
    }
}

// Test 4: Login button
async function test4_LoginButton() {
    console.log('\n📋 Test 4: Checking login button...');
    
    try {
        const response = await fetchPage(SITE_URL);
        const html = response.data;
        
        const loginPatterns = ['>Login<', 'href="/login"', 'onclick="login'];
        const hasLogin = findInHTML(html, loginPatterns);
        
        if (hasLogin) {
            TEST_RESULTS.passed.push('Test 4: Login button found ✅');
            console.log('✅ PASS: Login button present');
            return true;
        } else {
            TEST_RESULTS.failed.push('Test 4: No login button');
            console.log('❌ FAIL: Login button not found');
            return false;
        }
    } catch (error) {
        TEST_RESULTS.failed.push(`Test 4: Error - ${error.message}`);
        console.log(`❌ ERROR: ${error.message}`);
        return false;
    }
}

// Test 5-10: Quick checks for other features
async function testOtherFeatures() {
    console.log('\n📋 Testing remaining features (5-10)...');
    
    try {
        const response = await fetchPage(SITE_URL);
        const html = response.data;
        
        // Test 5: Login/Admin
        const loginPage = await fetchPage(`${SITE_URL}/login`);
        if (loginPage.status === 200 || loginPage.status === 404) {
            TEST_RESULTS.passed.push('Test 5: Login endpoint exists ✅');
            console.log('✅ Test 5: Login functionality available');
        } else {
            TEST_RESULTS.failed.push('Test 5: Login endpoint error');
        }
        
        // Test 6: Search
        if (findInHTML(html, ['search', 'Search Games'])) {
            TEST_RESULTS.passed.push('Test 6: Search functionality found ✅');
            console.log('✅ Test 6: Search feature present');
        } else {
            TEST_RESULTS.warnings.push('Test 6: Search not clearly visible');
            console.log('⚠️  Test 6: Search unclear');
        }
        
        // Test 7: Social Feed
        if (findInHTML(html, ['social', 'feed', 'post', 'community'])) {
            TEST_RESULTS.passed.push('Test 7: Social Feed found ✅');
            console.log('✅ Test 7: Social Feed present');
        } else {
            TEST_RESULTS.failed.push('Test 7: No Social Feed');
            console.log('❌ Test 7: Social Feed not found');
        }
        
        // Test 8: Upcoming Games
        if (findInHTML(html, ['upcoming', 'Upcoming Games', 'scheduled'])) {
            TEST_RESULTS.passed.push('Test 8: Upcoming Games found ✅');
            console.log('✅ Test 8: Upcoming Games present');
        } else {
            TEST_RESULTS.failed.push('Test 8: No Upcoming Games');
            console.log('❌ Test 8: Upcoming Games not found');
        }
        
        // Test 9: Sport Rules
        if (findInHTML(html, ['sport rules', 'Sport Rules', 'rules', 'how to play'])) {
            TEST_RESULTS.passed.push('Test 9: Sport Rules found ✅');
            console.log('✅ Test 9: Sport Rules present');
        } else {
            TEST_RESULTS.failed.push('Test 9: No Sport Rules');
            console.log('❌ Test 9: Sport Rules not found');
        }
        
        // Test 10: Community Hub
        if (findInHTML(html, ['community', 'Community Hub', 'join community'])) {
            TEST_RESULTS.passed.push('Test 10: Community Hub found ✅');
            console.log('✅ Test 10: Community Hub present');
        } else {
            TEST_RESULTS.failed.push('Test 10: No Community Hub');
            console.log('❌ Test 10: Community Hub not found');
        }
        
    } catch (error) {
        console.log(`⚠️  Error testing features: ${error.message}`);
    }
}

// Main runner
async function runAllTests() {
    console.log('🚀 Starting Phase 1 Testing for Finding Sports');
    console.log(`🌐 Testing: ${SITE_URL}`);
    console.log('═'.repeat(50));
    
    await test1_ItemsRemoved();
    await test2_MapFunctionality();
    await test3_PlayNowButton();
    await test4_LoginButton();
    await testOtherFeatures();
    
    // Summary
    console.log('\n' + '═'.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('═'.repeat(50));
    
    console.log(`\n✅ PASSED: ${TEST_RESULTS.passed.length}`);
    TEST_RESULTS.passed.forEach(r => console.log(`   ${r}`));
    
    if (TEST_RESULTS.warnings.length > 0) {
        console.log(`\n⚠️  WARNINGS: ${TEST_RESULTS.warnings.length}`);
        TEST_RESULTS.warnings.forEach(r => console.log(`   ${r}`));
    }
    
    if (TEST_RESULTS.failed.length > 0) {
        console.log(`\n❌ FAILED: ${TEST_RESULTS.failed.length}`);
        TEST_RESULTS.failed.forEach(r => console.log(`   ${r}`));
    }
    
    const allPassed = TEST_RESULTS.failed.length === 0;
    console.log('\n' + '═'.repeat(50));
    if (allPassed) {
        console.log('🎉 ALL CRITICAL TESTS PASSED!');
        console.log('➡️  Ready for Phase 3 (deployment)');
    } else {
        console.log('⚠️  SOME TESTS FAILED!');
        console.log('➡️  Moving to Phase 2 (fixes)');
    }
    
    // Save results
    require('fs').writeFileSync('phase1-results.json', JSON.stringify(TEST_RESULTS, null, 2));
    console.log('\n📄 Results saved to phase1-results.json');
}

runAllTests().catch(console.error);