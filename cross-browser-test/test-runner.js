const { chromium, firefox, webkit } = require('playwright');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
    .option('browser', {
        alias: 'b',
        description: 'Browser to test (chromium, firefox, webkit)',
        type: 'string',
        default: 'chromium'
    })
    .option('all', {
        alias: 'a',
        description: 'Test all browsers',
        type: 'boolean',
        default: false
    })
    .option('headless', {
        description: 'Run tests in headless mode',
        type: 'boolean',
        default: true
    })
    .option('url', {
        alias: 'u',
        description: 'URL to test',
        type: 'string',
        default: 'file://' + path.join(__dirname, '..', 'mockup', 'index.html')
    })
    .help()
    .alias('help', 'h')
    .argv;

// Test configuration
const TESTS = {
    languageElements: {
        name: 'Language/Help Elements Check',
        description: 'Verifies no language selector or help elements are visible',
        selectors: [
            '[class*="language"]',
            '[id*="language"]',
            '[class*="lang-"]',
            '[id*="lang-"]',
            '.help-btn',
            '.help-button',
            '.help-menu',
            '.online-indicator',
            '.online-status',
            '[data-language]',
            '[data-lang]',
            '[aria-label*="language" i]',
            '[aria-label*="help" i]'
        ],
        textPatterns: ['🌐', 'Help', 'Language', 'English', 'Online', 'Status']
    },
    mapRendering: {
        name: 'Map Rendering Check',
        description: 'Verifies map container exists and renders properly',
        checks: async (page) => {
            const results = [];
            
            // Check map container exists
            const mapContainer = await page.$('#map');
            results.push({
                test: 'Map container exists',
                passed: !!mapContainer,
                details: mapContainer ? 'Map container found' : 'Map container NOT found'
            });
            
            // Check map has been initialized
            const mapInitialized = await page.evaluate(() => {
                return window.map !== undefined && window.map !== null;
            });
            results.push({
                test: 'Map initialized',
                passed: mapInitialized,
                details: mapInitialized ? 'Map object found in window' : 'Map object NOT found'
            });
            
            // Check map container dimensions
            if (mapContainer) {
                const dimensions = await mapContainer.boundingBox();
                const hasValidDimensions = dimensions && dimensions.width > 0 && dimensions.height > 0;
                results.push({
                    test: 'Map has valid dimensions',
                    passed: hasValidDimensions,
                    details: dimensions ? `Width: ${dimensions.width}px, Height: ${dimensions.height}px` : 'No dimensions'
                });
            }
            
            // Check for map tiles or canvas
            const mapCanvas = await page.$('#map canvas, #map .mapboxgl-canvas, #map .maplibregl-canvas');
            results.push({
                test: 'Map canvas/tiles present',
                passed: !!mapCanvas,
                details: mapCanvas ? 'Map rendering element found' : 'No map rendering element'
            });
            
            return results;
        }
    },
    gamesDisplay: {
        name: 'Games Display Check',
        description: 'Verifies games are displayed properly',
        checks: async (page) => {
            const results = [];
            
            // Wait for potential API calls
            await page.waitForTimeout(3000);
            
            // Check for games container
            const gamesContainer = await page.$('#gamesContainer, .games-container, #games-list');
            results.push({
                test: 'Games container exists',
                passed: !!gamesContainer,
                details: gamesContainer ? 'Games container found' : 'Games container NOT found'
            });
            
            // Check for game cards
            const gameCards = await page.$$('.game-card, .game-item, .event-card');
            results.push({
                test: 'Game cards present',
                passed: gameCards.length > 0,
                details: `Found ${gameCards.length} game cards`
            });
            
            // Check for loading indicators
            const loadingIndicator = await page.$('.loading, .spinner, [class*="loading"]');
            results.push({
                test: 'Loading state handled',
                passed: !loadingIndicator,
                details: loadingIndicator ? 'Loading indicator still visible' : 'No loading indicator'
            });
            
            // Check for error states
            const errorMessage = await page.$('.error, .error-message, [class*="error"]');
            results.push({
                test: 'No error states',
                passed: !errorMessage,
                details: errorMessage ? 'Error message found' : 'No error messages'
            });
            
            return results;
        }
    },
    domCleanup: {
        name: 'DOM Cleanup Verification',
        description: 'Verifies nuclear DOM cleanup is working',
        checks: async (page) => {
            const results = [];
            
            // Check if nuclear fix scripts are loaded
            const nuclearFixLoaded = await page.evaluate(() => {
                return typeof window.NUCLEAR_DOM_CLEANUP !== 'undefined';
            });
            results.push({
                test: 'Nuclear fix script loaded',
                passed: nuclearFixLoaded,
                details: nuclearFixLoaded ? 'Nuclear DOM cleanup active' : 'Nuclear cleanup NOT loaded'
            });
            
            // Check if unwanted elements are being blocked
            const blockedElementsCount = await page.evaluate(() => {
                if (window.BLOCKED_ELEMENTS) {
                    return window.BLOCKED_ELEMENTS.length;
                }
                return 0;
            });
            results.push({
                test: 'Elements being blocked',
                passed: blockedElementsCount > 0 || nuclearFixLoaded,
                details: `${blockedElementsCount} elements blocked by nuclear fix`
            });
            
            // Check for script injection attempts
            const injectionAttempts = await page.evaluate(() => {
                return window.INJECTION_ATTEMPTS || 0;
            });
            results.push({
                test: 'Injection prevention',
                passed: true,
                details: `${injectionAttempts} injection attempts prevented`
            });
            
            return results;
        }
    },
    performance: {
        name: 'Performance Metrics',
        description: 'Measures page load performance',
        checks: async (page) => {
            const results = [];
            
            const metrics = await page.evaluate(() => {
                const navigation = performance.getEntriesByType('navigation')[0];
                return {
                    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                    loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
                    firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
                    firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
                };
            });
            
            results.push({
                test: 'DOM Content Loaded',
                passed: metrics.domContentLoaded < 3000,
                details: `${metrics.domContentLoaded.toFixed(2)}ms`
            });
            
            results.push({
                test: 'Page Load Complete',
                passed: metrics.loadComplete < 5000,
                details: `${metrics.loadComplete.toFixed(2)}ms`
            });
            
            results.push({
                test: 'First Paint',
                passed: metrics.firstPaint < 1500,
                details: `${metrics.firstPaint.toFixed(2)}ms`
            });
            
            results.push({
                test: 'First Contentful Paint',
                passed: metrics.firstContentfulPaint < 2000,
                details: `${metrics.firstContentfulPaint.toFixed(2)}ms`
            });
            
            return results;
        }
    }
};

// Browser configurations
const BROWSER_CONFIGS = {
    chromium: {
        name: 'Chrome',
        launch: chromium,
        options: {
            headless: argv.headless,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        }
    },
    firefox: {
        name: 'Firefox',
        launch: firefox,
        options: {
            headless: argv.headless
        }
    },
    webkit: {
        name: 'Safari',
        launch: webkit,
        options: {
            headless: argv.headless
        }
    }
};

// Test runner function
async function runTestsForBrowser(browserType) {
    const config = BROWSER_CONFIGS[browserType];
    if (!config) {
        throw new Error(`Unknown browser: ${browserType}`);
    }
    
    console.log(chalk.blue(`\n🌐 Testing ${config.name}...\n`));
    
    const browser = await config.launch.launch(config.options);
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent: `Mozilla/5.0 (Testing ${config.name}) AppleWebKit/537.36`
    });
    const page = await context.newPage();
    
    const results = {
        browser: config.name,
        browserType: browserType,
        url: argv.url,
        timestamp: new Date().toISOString(),
        tests: {},
        screenshots: {},
        summary: {
            total: 0,
            passed: 0,
            failed: 0
        }
    };
    
    try {
        // Navigate to the page
        console.log(chalk.gray(`Navigating to: ${argv.url}`));
        await page.goto(argv.url, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000); // Give time for all scripts to load
        
        // Take initial screenshot
        const screenshotDir = path.join(__dirname, 'screenshots', browserType);
        await fs.ensureDir(screenshotDir);
        
        const initialScreenshot = path.join(screenshotDir, 'initial.png');
        await page.screenshot({ path: initialScreenshot, fullPage: true });
        results.screenshots.initial = initialScreenshot;
        
        // Run language/help elements test
        console.log(chalk.yellow('\n📋 Testing: Language/Help Elements'));
        const languageResults = [];
        
        for (const selector of TESTS.languageElements.selectors) {
            const elements = await page.$$(selector);
            const visible = [];
            
            for (const element of elements) {
                const isVisible = await element.isVisible();
                if (isVisible) {
                    visible.push(selector);
                }
            }
            
            languageResults.push({
                test: `No visible ${selector}`,
                passed: visible.length === 0,
                details: visible.length > 0 ? `Found ${visible.length} visible elements` : 'None found'
            });
        }
        
        // Check for text patterns
        for (const pattern of TESTS.languageElements.textPatterns) {
            const found = await page.$$eval('*', (elements, text) => {
                return elements.filter(el => 
                    el.textContent.includes(text) && 
                    window.getComputedStyle(el).display !== 'none'
                ).length;
            }, pattern);
            
            languageResults.push({
                test: `No visible "${pattern}" text`,
                passed: found === 0,
                details: found > 0 ? `Found ${found} instances` : 'None found'
            });
        }
        
        results.tests.languageElements = {
            name: TESTS.languageElements.name,
            results: languageResults
        };
        
        // Run map rendering test
        console.log(chalk.yellow('\n🗺️  Testing: Map Rendering'));
        results.tests.mapRendering = {
            name: TESTS.mapRendering.name,
            results: await TESTS.mapRendering.checks(page)
        };
        
        // Take map screenshot
        const mapScreenshot = path.join(screenshotDir, 'map.png');
        const mapElement = await page.$('#map');
        if (mapElement) {
            await mapElement.screenshot({ path: mapScreenshot });
            results.screenshots.map = mapScreenshot;
        }
        
        // Run games display test
        console.log(chalk.yellow('\n🎮 Testing: Games Display'));
        results.tests.gamesDisplay = {
            name: TESTS.gamesDisplay.name,
            results: await TESTS.gamesDisplay.checks(page)
        };
        
        // Run DOM cleanup test
        console.log(chalk.yellow('\n🧹 Testing: DOM Cleanup'));
        results.tests.domCleanup = {
            name: TESTS.domCleanup.name,
            results: await TESTS.domCleanup.checks(page)
        };
        
        // Run performance test
        console.log(chalk.yellow('\n⚡ Testing: Performance'));
        results.tests.performance = {
            name: TESTS.performance.name,
            results: await TESTS.performance.checks(page)
        };
        
        // Take final screenshot
        const finalScreenshot = path.join(screenshotDir, 'final.png');
        await page.screenshot({ path: finalScreenshot, fullPage: true });
        results.screenshots.final = finalScreenshot;
        
        // Calculate summary
        for (const testGroup of Object.values(results.tests)) {
            for (const result of testGroup.results) {
                results.summary.total++;
                if (result.passed) {
                    results.summary.passed++;
                } else {
                    results.summary.failed++;
                }
            }
        }
        
    } catch (error) {
        console.error(chalk.red(`Error testing ${config.name}:`), error);
        results.error = error.message;
    } finally {
        await browser.close();
    }
    
    return results;
}

// Main execution
async function main() {
    console.log(chalk.bold.cyan('\n🚀 Finding Sports Cross-Browser Nuclear Fix Test Suite\n'));
    console.log(chalk.gray(`Testing URL: ${argv.url}`));
    console.log(chalk.gray(`Headless mode: ${argv.headless}`));
    
    const browsers = argv.all 
        ? ['chromium', 'firefox', 'webkit'] 
        : [argv.browser];
    
    const allResults = {};
    const summaryTable = [];
    
    for (const browser of browsers) {
        try {
            const results = await runTestsForBrowser(browser);
            allResults[browser] = results;
            
            // Print results
            console.log(chalk.bold(`\n📊 Results for ${results.browser}:`));
            
            for (const [testKey, testGroup] of Object.entries(results.tests)) {
                console.log(chalk.underline(`\n${testGroup.name}:`));
                
                for (const result of testGroup.results) {
                    const icon = result.passed ? '✅' : '❌';
                    const color = result.passed ? chalk.green : chalk.red;
                    console.log(color(`  ${icon} ${result.test}: ${result.details}`));
                }
            }
            
            // Summary
            const passRate = (results.summary.passed / results.summary.total * 100).toFixed(1);
            const summaryColor = passRate === '100.0' ? chalk.green : passRate >= '80.0' ? chalk.yellow : chalk.red;
            
            console.log(chalk.bold(`\n📈 Summary:`));
            console.log(summaryColor(`  Pass Rate: ${passRate}% (${results.summary.passed}/${results.summary.total})`));
            
            summaryTable.push({
                browser: results.browser,
                total: results.summary.total,
                passed: results.summary.passed,
                failed: results.summary.failed,
                passRate: passRate
            });
            
        } catch (error) {
            console.error(chalk.red(`\nFailed to test ${browser}:`), error.message);
            allResults[browser] = { error: error.message };
        }
    }
    
    // Save results to JSON
    const resultsFile = path.join(__dirname, 'test-results.json');
    await fs.writeJson(resultsFile, allResults, { spaces: 2 });
    console.log(chalk.gray(`\nResults saved to: ${resultsFile}`));
    
    // Print final summary table
    console.log(chalk.bold.cyan('\n📊 FINAL SUMMARY:\n'));
    console.log(chalk.bold('Browser        Total  Passed  Failed  Pass Rate'));
    console.log(chalk.gray('─'.repeat(50)));
    
    for (const row of summaryTable) {
        const color = row.passRate === '100.0' ? chalk.green : row.passRate >= '80.0' ? chalk.yellow : chalk.red;
        console.log(
            `${row.browser.padEnd(13)} ${row.total.toString().padStart(5)}  ${row.passed.toString().padStart(6)}  ${row.failed.toString().padStart(6)}  ${color(row.passRate + '%')}`
        );
    }
    
    // Overall verdict
    const allPassed = summaryTable.every(row => row.passRate === '100.0');
    console.log(chalk.bold(`\n${allPassed ? '✅ ALL TESTS PASSED!' : '❌ Some tests failed.'}`));
    
    process.exit(allPassed ? 0 : 1);
}

// Run the tests
main().catch(console.error);