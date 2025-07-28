// Example of custom tests that can be added to the test suite
const config = require('./test-config');

// Custom test definitions
const CUSTOM_TESTS = {
    // Test for specific button functionality
    playNowButton: {
        name: 'Play Now Button Verification',
        description: 'Ensures Play Now button works without language elements',
        checks: async (page) => {
            const results = [];
            
            // Check if Play Now button exists
            const playNowButton = await page.$('.play-now-btn, #playNowBtn, [class*="play-now"]');
            results.push({
                test: 'Play Now button exists',
                passed: !!playNowButton,
                details: playNowButton ? 'Button found' : 'Button NOT found'
            });
            
            // Check button doesn't have language attributes
            if (playNowButton) {
                const hasLanguageAttr = await playNowButton.evaluate(el => {
                    return el.hasAttribute('data-lang') || 
                           el.hasAttribute('data-i18n') ||
                           el.getAttribute('class').includes('language');
                });
                
                results.push({
                    test: 'No language attributes on button',
                    passed: !hasLanguageAttr,
                    details: hasLanguageAttr ? 'Language attributes found!' : 'Clean button'
                });
            }
            
            return results;
        }
    },
    
    // Test for mobile responsiveness
    mobileResponsive: {
        name: 'Mobile Responsiveness Check',
        description: 'Verifies the site works on mobile viewports',
        checks: async (page) => {
            const results = [];
            
            // Set mobile viewport
            await page.setViewportSize({ width: 375, height: 667 });
            await page.waitForTimeout(1000);
            
            // Check if map adjusts to mobile
            const mapContainer = await page.$('#map');
            if (mapContainer) {
                const box = await mapContainer.boundingBox();
                const isMobileOptimized = box && box.width <= 375;
                
                results.push({
                    test: 'Map responsive on mobile',
                    passed: isMobileOptimized,
                    details: box ? `Width: ${box.width}px` : 'No dimensions'
                });
            }
            
            // Check if navigation is mobile-friendly
            const mobileMenu = await page.$('.mobile-menu, .hamburger, [class*="mobile-nav"]');
            results.push({
                test: 'Mobile navigation present',
                passed: !!mobileMenu,
                details: mobileMenu ? 'Mobile menu found' : 'No mobile menu'
            });
            
            // Reset viewport
            await page.setViewportSize(config.viewports.desktop);
            
            return results;
        }
    },
    
    // Test for API connectivity
    apiConnectivity: {
        name: 'API Connectivity Check',
        description: 'Verifies API calls are working properly',
        checks: async (page) => {
            const results = [];
            
            // Monitor network requests
            const apiCalls = [];
            page.on('response', response => {
                const url = response.url();
                if (url.includes('/api/') || url.includes('games') || url.includes('venues')) {
                    apiCalls.push({
                        url: url,
                        status: response.status(),
                        ok: response.ok()
                    });
                }
            });
            
            // Wait for API calls
            await page.waitForTimeout(3000);
            
            results.push({
                test: 'API calls made',
                passed: apiCalls.length > 0,
                details: `${apiCalls.length} API calls detected`
            });
            
            // Check for successful responses
            const successfulCalls = apiCalls.filter(call => call.ok);
            results.push({
                test: 'API calls successful',
                passed: successfulCalls.length > 0,
                details: `${successfulCalls.length}/${apiCalls.length} successful`
            });
            
            // Check for API errors
            const failedCalls = apiCalls.filter(call => !call.ok);
            results.push({
                test: 'No API errors',
                passed: failedCalls.length === 0,
                details: failedCalls.length > 0 ? 
                    `${failedCalls.length} failed calls` : 'All calls successful'
            });
            
            return results;
        }
    },
    
    // Test for console errors
    consoleErrors: {
        name: 'Console Error Check',
        description: 'Monitors for JavaScript errors in console',
        checks: async (page) => {
            const results = [];
            const consoleErrors = [];
            
            // Capture console errors
            page.on('console', msg => {
                if (msg.type() === 'error') {
                    consoleErrors.push(msg.text());
                }
            });
            
            // Navigate and wait
            await page.reload();
            await page.waitForTimeout(2000);
            
            // Filter out known/acceptable errors
            const criticalErrors = consoleErrors.filter(error => 
                !error.includes('favicon.ico') &&
                !error.includes('Failed to load resource') &&
                !error.includes('net::ERR_FILE_NOT_FOUND')
            );
            
            results.push({
                test: 'No critical console errors',
                passed: criticalErrors.length === 0,
                details: criticalErrors.length > 0 ? 
                    `${criticalErrors.length} errors found` : 'Console clean'
            });
            
            // Check for specific nuclear fix errors
            const nuclearErrors = consoleErrors.filter(error =>
                error.includes('NUCLEAR') ||
                error.includes('DOM_CLEANUP') ||
                error.includes('interceptor')
            );
            
            results.push({
                test: 'Nuclear fix running without errors',
                passed: nuclearErrors.length === 0,
                details: nuclearErrors.length > 0 ? 
                    'Nuclear fix errors detected!' : 'Nuclear fix healthy'
            });
            
            return results;
        }
    },
    
    // Test for accessibility
    accessibility: {
        name: 'Basic Accessibility Check',
        description: 'Verifies basic accessibility requirements',
        checks: async (page) => {
            const results = [];
            
            // Check for alt text on images
            const imagesWithoutAlt = await page.$$eval('img:not([alt])', imgs => imgs.length);
            results.push({
                test: 'All images have alt text',
                passed: imagesWithoutAlt === 0,
                details: imagesWithoutAlt > 0 ? 
                    `${imagesWithoutAlt} images missing alt text` : 'All images accessible'
            });
            
            // Check for ARIA labels on interactive elements
            const buttonsWithoutLabel = await page.$$eval(
                'button:not([aria-label]):not(:has(text))', 
                buttons => buttons.length
            );
            results.push({
                test: 'Buttons have labels',
                passed: buttonsWithoutLabel === 0,
                details: buttonsWithoutLabel > 0 ? 
                    `${buttonsWithoutLabel} buttons need labels` : 'All buttons labeled'
            });
            
            // Check color contrast (basic check)
            const hasHighContrast = await page.evaluate(() => {
                const styles = window.getComputedStyle(document.body);
                const bg = styles.backgroundColor;
                const fg = styles.color;
                // Simple check - in real testing use proper contrast calculation
                return bg !== fg;
            });
            
            results.push({
                test: 'Basic contrast check',
                passed: hasHighContrast,
                details: hasHighContrast ? 'Contrast exists' : 'No contrast detected'
            });
            
            return results;
        }
    }
};

// Export for use in main test runner
module.exports = CUSTOM_TESTS;

// Example of how to integrate custom tests:
/*
// In test-runner.js, add:
const customTests = require('./custom-tests-example');

// Then in the main test flow, add:
for (const [testKey, testDef] of Object.entries(customTests)) {
    console.log(chalk.yellow(`\n🔧 Testing: ${testDef.name}`));
    results.tests[testKey] = {
        name: testDef.name,
        results: await testDef.checks(page)
    };
}
*/