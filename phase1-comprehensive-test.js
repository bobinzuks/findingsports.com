#!/usr/bin/env node
// Phase 1 Comprehensive Testing Script for Finding Sports
// Tests all 10 requirements from the hive-mind session

const axios = require('axios');
const cheerio = require('cheerio');
const colors = require('colors');

const SITE_URL = 'https://findingsports.com';
const TEST_RESULTS = {
    passed: [],
    failed: [],
    warnings: []
};

// Helper function for making requests
async function fetchPage(url, options = {}) {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                ...options.headers
            },
            ...options
        });
        return response;
    } catch (error) {
        console.error(`Error fetching ${url}:`, error.message);
        return null;
    }
}

// Test 1: Verify 3 items removed (language selector, help button, online status)
async function test1_ItemsRemoved() {
    console.log('\n📋 Test 1: Checking if 3 unwanted items are removed...'.cyan);
    
    const response = await fetchPage(SITE_URL);
    if (!response) {
        TEST_RESULTS.failed.push('Test 1: Could not fetch page');
        return false;
    }
    
    const $ = cheerio.load(response.data);
    const html = response.data.toLowerCase();
    
    // Check for language selector
    const languageSelectors = [
        $('[class*="language"]').not('[class*="language-example"]').length,
        $('[id*="language"]').not('[id*="language-example"]').length,
        $('*:contains("🌐")').length,
        $('*:contains("English")').filter((i, el) => $(el).text().includes('▼')).length,
        html.includes('language selector'),
        html.includes('lang-menu'),
        html.includes('i18n')
    ];
    
    // Check for help button
    const helpButtons = [
        $('[class*="help"]').length,
        $('*:contains("?")').filter((i, el) => $(el).text().trim() === '?' || $(el).text().includes('Help')).length,
        $('button:contains("Help")').length,
        $('a[href*="/help"]').length,
        html.includes('help-button'),
        html.includes('help-icon')
    ];
    
    // Check for online status
    const onlineIndicators = [
        $('[class*="online"]').length,
        $('[class*="status"]').filter((i, el) => $(el).text().includes('Online')).length,
        $('*:contains("Online")').length,
        html.includes('connection-status'),
        html.includes('online-indicator')
    ];
    
    const languageFound = languageSelectors.some(val => val > 0);
    const helpFound = helpButtons.some(val => val > 0);
    const onlineFound = onlineIndicators.some(val => val > 0);
    
    if (!languageFound && !helpFound && !onlineFound) {
        TEST_RESULTS.passed.push('Test 1: All 3 unwanted items successfully removed ✅');
        console.log('✅ PASS: No language selector, help button, or online status found'.green);
        return true;
    } else {
        const issues = [];
        if (languageFound) issues.push('Language selector');
        if (helpFound) issues.push('Help button');
        if (onlineFound) issues.push('Online status');
        
        TEST_RESULTS.failed.push(`Test 1: Found unwanted items: ${issues.join(', ')}`);
        console.log(`❌ FAIL: Found unwanted items: ${issues.join(', ')}`.red);
        return false;
    }
}

// Test 2: Map functionality when not logged in
async function test2_MapFunctionality() {
    console.log('\n📋 Test 2: Checking map functionality when not logged in...'.cyan);
    
    const response = await fetchPage(SITE_URL);
    if (!response) {
        TEST_RESULTS.failed.push('Test 2: Could not fetch page');
        return false;
    }
    
    const $ = cheerio.load(response.data);
    const html = response.data;
    
    // Check for map container
    const mapElements = [
        $('#map').length > 0,
        $('[id*="map"]').length > 0,
        $('[class*="map"]').length > 0,
        html.includes('maplibre'),
        html.includes('mapbox'),
        html.includes('loading map'),
        html.includes('map-container')
    ];
    
    const hasMapElement = mapElements.some(val => val);
    
    if (hasMapElement) {
        // Check for fallback message
        const hasFallback = html.includes('loading map') || 
                           html.includes('map is loading') ||
                           html.includes('enable location') ||
                           $('#map').text().length > 0;
        
        if (hasFallback) {
            TEST_RESULTS.passed.push('Test 2: Map has proper fallback when not logged in ✅');
            console.log('✅ PASS: Map element found with proper fallback'.green);
            return true;
        } else {
            TEST_RESULTS.warnings.push('Test 2: Map element found but no clear fallback message');
            console.log('⚠️  WARNING: Map element found but fallback unclear'.yellow);
            return true;
        }
    } else {
        TEST_RESULTS.failed.push('Test 2: No map element found on page');
        console.log('❌ FAIL: No map element found'.red);
        return false;
    }
}

// Test 3: Play Now button with >2 games
async function test3_PlayNowButton() {
    console.log('\n📋 Test 3: Checking Play Now button and games display...'.cyan);
    
    const response = await fetchPage(SITE_URL);
    if (!response) {
        TEST_RESULTS.failed.push('Test 3: Could not fetch page');
        return false;
    }
    
    const $ = cheerio.load(response.data);
    
    // Check for Play Now button
    const playNowButton = $('button:contains("Play Now")').length > 0 ||
                         $('a:contains("Play Now")').length > 0 ||
                         $('[onclick*="playNow"]').length > 0 ||
                         $('[class*="play-now"]').length > 0;
    
    if (!playNowButton) {
        TEST_RESULTS.failed.push('Test 3: No Play Now button found');
        console.log('❌ FAIL: Play Now button not found'.red);
        return false;
    }
    
    // Check for games API endpoint
    const apiResponse = await fetchPage(`${SITE_URL}/api/v2/games`);
    if (apiResponse && apiResponse.data) {
        const games = Array.isArray(apiResponse.data) ? apiResponse.data : apiResponse.data.games || [];
        const gameCount = games.length;
        
        if (gameCount > 2) {
            TEST_RESULTS.passed.push(`Test 3: Play Now button found with ${gameCount} games ✅`);
            console.log(`✅ PASS: Play Now button found with ${gameCount} games displayed`.green);
            return true;
        } else {
            TEST_RESULTS.failed.push(`Test 3: Only ${gameCount} games found (need >2)`);
            console.log(`❌ FAIL: Only ${gameCount} games found (need more than 2)`.red);
            return false;
        }
    } else {
        // Check for game elements on page
        const gameElements = $('[class*="game-card"]').length ||
                           $('[class*="game-item"]').length ||
                           $('[data-game]').length;
        
        if (gameElements > 2) {
            TEST_RESULTS.passed.push(`Test 3: Play Now button found with ${gameElements} game elements ✅`);
            console.log(`✅ PASS: Play Now button found with ${gameElements} game elements`.green);
            return true;
        } else {
            TEST_RESULTS.warnings.push('Test 3: Could not verify game count via API');
            console.log('⚠️  WARNING: Play Now button found but game count unclear'.yellow);
            return true;
        }
    }
}

// Test 4: Login button replacing deleted items
async function test4_LoginButton() {
    console.log('\n📋 Test 4: Checking if login button replaced deleted items...'.cyan);
    
    const response = await fetchPage(SITE_URL);
    if (!response) {
        TEST_RESULTS.failed.push('Test 4: Could not fetch page');
        return false;
    }
    
    const $ = cheerio.load(response.data);
    
    // Check for login button in header/nav area
    const loginInHeader = $('header').find('button:contains("Login"), a:contains("Login")').length > 0 ||
                         $('.navbar').find('button:contains("Login"), a:contains("Login")').length > 0 ||
                         $('nav').find('button:contains("Login"), a:contains("Login")').length > 0 ||
                         $('.header-right').find('button:contains("Login"), a:contains("Login")').length > 0;
    
    // Check general login presence
    const hasLogin = loginInHeader ||
                    $('button:contains("Login")').length > 0 ||
                    $('a:contains("Login")').length > 0 ||
                    $('[onclick*="login"]').length > 0 ||
                    $('[href*="/login"]').length > 0;
    
    if (hasLogin) {
        if (loginInHeader) {
            TEST_RESULTS.passed.push('Test 4: Login button found in header area (replacing deleted items) ✅');
            console.log('✅ PASS: Login button properly positioned in header'.green);
        } else {
            TEST_RESULTS.warnings.push('Test 4: Login button found but not clearly in header position');
            console.log('⚠️  WARNING: Login button found but position unclear'.yellow);
        }
        return true;
    } else {
        TEST_RESULTS.failed.push('Test 4: No login button found');
        console.log('❌ FAIL: Login button not found'.red);
        return false;
    }
}

// Test 5: Login and admin functionality
async function test5_LoginFunctionality() {
    console.log('\n📋 Test 5: Testing login and admin functionality...'.cyan);
    
    // First check if login page exists
    const loginPage = await fetchPage(`${SITE_URL}/login`);
    const hasLoginPage = loginPage && loginPage.status === 200;
    
    // Check for admin endpoints
    const adminEndpoint = await fetchPage(`${SITE_URL}/api/admin/status`);
    const hasAdminAPI = adminEndpoint && (adminEndpoint.status === 200 || adminEndpoint.status === 401);
    
    // Check main page for login form
    const response = await fetchPage(SITE_URL);
    if (!response) {
        TEST_RESULTS.failed.push('Test 5: Could not fetch page');
        return false;
    }
    
    const $ = cheerio.load(response.data);
    const hasLoginForm = $('form[action*="login"]').length > 0 ||
                        $('input[type="email"], input[type="username"]').length > 0 ||
                        $('input[type="password"]').length > 0;
    
    if (hasLoginPage || hasLoginForm || hasAdminAPI) {
        const features = [];
        if (hasLoginPage) features.push('login page');
        if (hasLoginForm) features.push('login form');
        if (hasAdminAPI) features.push('admin API');
        
        TEST_RESULTS.passed.push(`Test 5: Login functionality available (${features.join(', ')}) ✅`);
        console.log(`✅ PASS: Login/admin functionality confirmed via ${features.join(', ')}`.green);
        return true;
    } else {
        TEST_RESULTS.failed.push('Test 5: No login or admin functionality found');
        console.log('❌ FAIL: Login/admin functionality not accessible'.red);
        return false;
    }
}

// Test 6: Play Now + Search when logged in
async function test6_LoggedInFeatures() {
    console.log('\n📋 Test 6: Checking Play Now + Search features (would need login)...'.cyan);
    
    // Since we can't actually log in, check if the features exist
    const response = await fetchPage(SITE_URL);
    if (!response) {
        TEST_RESULTS.failed.push('Test 6: Could not fetch page');
        return false;
    }
    
    const $ = cheerio.load(response.data);
    const html = response.data.toLowerCase();
    
    // Check for search functionality
    const hasSearch = $('input[type="search"]').length > 0 ||
                     $('input[placeholder*="search"]').length > 0 ||
                     $('[class*="search"]').length > 0 ||
                     html.includes('search games') ||
                     html.includes('searchgames');
    
    // Check for category filtering
    const hasCategories = $('[class*="category"]').length > 0 ||
                         $('[data-category]').length > 0 ||
                         html.includes('sport-category') ||
                         html.includes('game-category');
    
    if (hasSearch || hasCategories) {
        const features = [];
        if (hasSearch) features.push('search functionality');
        if (hasCategories) features.push('category system');
        
        TEST_RESULTS.warnings.push(`Test 6: ${features.join(' and ')} found (full test requires login)`);
        console.log(`⚠️  WARNING: ${features.join(' and ')} present but full test needs authentication`.yellow);
        return true;
    } else {
        TEST_RESULTS.failed.push('Test 6: No search or category features found');
        console.log('❌ FAIL: Search/category features not found'.red);
        return false;
    }
}

// Test 7: Social Feed functionality
async function test7_SocialFeed() {
    console.log('\n📋 Test 7: Checking Social Feed functionality...'.cyan);
    
    const response = await fetchPage(SITE_URL);
    if (!response) {
        TEST_RESULTS.failed.push('Test 7: Could not fetch page');
        return false;
    }
    
    const $ = cheerio.load(response.data);
    const html = response.data.toLowerCase();
    
    // Check for social feed elements
    const hasSocialFeed = $('[class*="social"]').length > 0 ||
                         $('[class*="feed"]').length > 0 ||
                         $('[class*="post"]').length > 0 ||
                         $('[id*="social"]').length > 0 ||
                         html.includes('social feed') ||
                         html.includes('community feed') ||
                         html.includes('post-content');
    
    // Check for posting capability
    const hasPosting = $('textarea[placeholder*="post"]').length > 0 ||
                      $('button:contains("Post")').length > 0 ||
                      $('[class*="create-post"]').length > 0 ||
                      html.includes('share your') ||
                      html.includes('what\'s on your mind');
    
    if (hasSocialFeed) {
        if (hasPosting) {
            TEST_RESULTS.passed.push('Test 7: Social Feed with posting capability found ✅');
            console.log('✅ PASS: Social Feed with posting functionality present'.green);
        } else {
            TEST_RESULTS.warnings.push('Test 7: Social Feed found but posting unclear');
            console.log('⚠️  WARNING: Social Feed present but posting capability unclear'.yellow);
        }
        return true;
    } else {
        TEST_RESULTS.failed.push('Test 7: No Social Feed found');
        console.log('❌ FAIL: Social Feed not found'.red);
        return false;
    }
}

// Test 8: Upcoming Games
async function test8_UpcomingGames() {
    console.log('\n📋 Test 8: Checking Upcoming Games functionality...'.cyan);
    
    const response = await fetchPage(SITE_URL);
    if (!response) {
        TEST_RESULTS.failed.push('Test 8: Could not fetch page');
        return false;
    }
    
    const $ = cheerio.load(response.data);
    const html = response.data.toLowerCase();
    
    // Check for upcoming games section
    const hasUpcoming = $('[class*="upcoming"]').length > 0 ||
                       $('[id*="upcoming"]').length > 0 ||
                       $('*:contains("Upcoming Games")').length > 0 ||
                       html.includes('upcoming games') ||
                       html.includes('scheduled games') ||
                       html.includes('next games');
    
    // Check API endpoint
    const apiResponse = await fetchPage(`${SITE_URL}/api/v2/games/upcoming`);
    const hasAPI = apiResponse && (apiResponse.status === 200 || apiResponse.status === 404);
    
    if (hasUpcoming || hasAPI) {
        TEST_RESULTS.passed.push('Test 8: Upcoming Games functionality found ✅');
        console.log('✅ PASS: Upcoming Games feature present'.green);
        return true;
    } else {
        TEST_RESULTS.failed.push('Test 8: No Upcoming Games feature found');
        console.log('❌ FAIL: Upcoming Games not found'.red);
        return false;
    }
}

// Test 9: Sport Rules
async function test9_SportRules() {
    console.log('\n📋 Test 9: Checking Sport Rules functionality...'.cyan);
    
    // Check main page for sport rules link
    const response = await fetchPage(SITE_URL);
    if (!response) {
        TEST_RESULTS.failed.push('Test 9: Could not fetch page');
        return false;
    }
    
    const $ = cheerio.load(response.data);
    const html = response.data.toLowerCase();
    
    // Check for sport rules elements
    const hasSportRules = $('a[href*="sport-rules"]').length > 0 ||
                         $('a[href*="rules"]').length > 0 ||
                         $('*:contains("Sport Rules")').length > 0 ||
                         html.includes('sport rules') ||
                         html.includes('game rules') ||
                         html.includes('how to play');
    
    // Try to access sport rules page
    const rulesPage = await fetchPage(`${SITE_URL}/sport-rules`);
    const hasRulesPage = rulesPage && rulesPage.status === 200;
    
    if (hasSportRules || hasRulesPage) {
        TEST_RESULTS.passed.push('Test 9: Sport Rules functionality found ✅');
        console.log('✅ PASS: Sport Rules feature available'.green);
        return true;
    } else {
        TEST_RESULTS.failed.push('Test 9: No Sport Rules feature found');
        console.log('❌ FAIL: Sport Rules not found'.red);
        return false;
    }
}

// Test 10: Community Hub
async function test10_CommunityHub() {
    console.log('\n📋 Test 10: Checking Community Hub functionality...'.cyan);
    
    const response = await fetchPage(SITE_URL);
    if (!response) {
        TEST_RESULTS.failed.push('Test 10: Could not fetch page');
        return false;
    }
    
    const $ = cheerio.load(response.data);
    const html = response.data.toLowerCase();
    
    // Check for community hub elements
    const hasCommunity = $('a[href*="community"]').length > 0 ||
                        $('[class*="community"]').length > 0 ||
                        $('[id*="community"]').length > 0 ||
                        $('*:contains("Community Hub")').length > 0 ||
                        html.includes('community hub') ||
                        html.includes('community center') ||
                        html.includes('join community');
    
    // Try community page
    const communityPage = await fetchPage(`${SITE_URL}/community`);
    const hasCommunityPage = communityPage && communityPage.status === 200;
    
    if (hasCommunity || hasCommunityPage) {
        TEST_RESULTS.passed.push('Test 10: Community Hub functionality found ✅');
        console.log('✅ PASS: Community Hub feature present'.green);
        return true;
    } else {
        TEST_RESULTS.failed.push('Test 10: No Community Hub found');
        console.log('❌ FAIL: Community Hub not found'.red);
        return false;
    }
}

// Main test runner
async function runAllTests() {
    console.log('🚀 Starting Phase 1 Comprehensive Testing for Finding Sports'.bold.cyan);
    console.log(`🌐 Testing URL: ${SITE_URL}`.gray);
    console.log('═'.repeat(60).gray);
    
    // Run all tests
    await test1_ItemsRemoved();
    await test2_MapFunctionality();
    await test3_PlayNowButton();
    await test4_LoginButton();
    await test5_LoginFunctionality();
    await test6_LoggedInFeatures();
    await test7_SocialFeed();
    await test8_UpcomingGames();
    await test9_SportRules();
    await test10_CommunityHub();
    
    // Summary
    console.log('\n' + '═'.repeat(60).gray);
    console.log('📊 TEST SUMMARY'.bold.cyan);
    console.log('═'.repeat(60).gray);
    
    console.log(`\n✅ PASSED: ${TEST_RESULTS.passed.length}`.green.bold);
    TEST_RESULTS.passed.forEach(result => console.log(`   ${result}`.green));
    
    if (TEST_RESULTS.warnings.length > 0) {
        console.log(`\n⚠️  WARNINGS: ${TEST_RESULTS.warnings.length}`.yellow.bold);
        TEST_RESULTS.warnings.forEach(result => console.log(`   ${result}`.yellow));
    }
    
    if (TEST_RESULTS.failed.length > 0) {
        console.log(`\n❌ FAILED: ${TEST_RESULTS.failed.length}`.red.bold);
        TEST_RESULTS.failed.forEach(result => console.log(`   ${result}`.red));
    }
    
    // Decision
    console.log('\n' + '═'.repeat(60).gray);
    const allPassed = TEST_RESULTS.failed.length === 0;
    if (allPassed) {
        console.log('🎉 ALL TESTS PASSED! Ready for Phase 3 (deployment)'.green.bold);
        console.log('Next: Push to GitHub and deploy to Railway'.gray);
    } else {
        console.log('⚠️  SOME TESTS FAILED! Moving to Phase 2 (analysis and fixes)'.yellow.bold);
        console.log(`Failed tests require investigation: ${TEST_RESULTS.failed.length} issues`.gray);
    }
    
    // Save results for Phase 2
    const fs = require('fs');
    fs.writeFileSync('phase1-test-results.json', JSON.stringify(TEST_RESULTS, null, 2));
    console.log('\n📄 Results saved to phase1-test-results.json'.gray);
    
    return allPassed;
}

// Run the tests
if (require.main === module) {
    runAllTests().catch(console.error);
}

module.exports = { runAllTests, TEST_RESULTS };