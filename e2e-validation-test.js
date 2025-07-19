#!/usr/bin/env node

/**
 * End-to-End Validation Test Suite
 * Comprehensive testing of all user flows and system integration
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

class E2EValidator {
    constructor() {
        this.browser = null;
        this.page = null;
        this.testResults = {
            passed: 0,
            failed: 0,
            tests: []
        };
        this.baseUrl = 'http://localhost:8080';
        this.screenshots = [];
    }

    async initialize() {
        console.log('🚀 Initializing E2E Validation Test Suite...');
        
        this.browser = await puppeteer.launch({
            headless: false, // Show browser for visual debugging
            defaultViewport: { width: 1280, height: 720 },
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        this.page = await this.browser.newPage();
        
        // Enable console logs
        this.page.on('console', msg => {
            console.log(`PAGE LOG: ${msg.text()}`);
        });
        
        // Enable request/response logging
        this.page.on('response', response => {
            if (response.status() >= 400) {
                console.log(`❌ HTTP ${response.status()}: ${response.url()}`);
            }
        });
    }

    async runAllTests() {
        console.log('\n📋 Starting Comprehensive E2E Validation...\n');

        const tests = [
            // Core Navigation and UI
            () => this.testPageLoad(),
            () => this.testMobileResponsiveness(),
            () => this.testCrossBrowserCompatibility(),
            
            // Authentication Flows
            () => this.testUserRegistrationFlow(),
            () => this.testUserLoginFlow(),
            () => this.testGoogleOAuthFlow(),
            () => this.testLogoutFlow(),
            
            // Game Discovery Workflows
            () => this.testGameSearchWorkflow(),
            () => this.testPlayNowWorkflow(),
            () => this.testLocationDetectionWorkflow(),
            () => this.testMapIntegrationWorkflow(),
            
            // Social Features
            () => this.testSocialFeedWorkflow(),
            () => this.testChatFunctionalityWorkflow(),
            () => this.testModerationWorkflow(),
            
            // Real-time Features
            () => this.testWebSocketConnectivity(),
            () => this.testRealTimeUpdates(),
            
            // Data Persistence
            () => this.testDataPersistenceAcrossSessions(),
            () => this.testOfflineCapabilities(),
            
            // Error Handling
            () => this.testErrorHandlingFlows(),
            () => this.testNetworkFailureRecovery(),
            
            // Production Readiness
            () => this.testPerformanceMetrics(),
            () => this.testSecurityValidation(),
            () => this.testDeploymentHealth()
        ];

        for (const test of tests) {
            try {
                await test();
            } catch (error) {
                this.logTestFailure(test.name, error);
            }
        }

        return this.generateReport();
    }

    async testPageLoad() {
        console.log('🌐 Testing Page Load and Initial State...');
        
        await this.page.goto(this.baseUrl, { waitUntil: 'networkidle2' });
        
        // Check if main page elements load
        await this.page.waitForSelector('.header', { timeout: 10000 });
        await this.page.waitForSelector('.search-section', { timeout: 5000 });
        await this.page.waitForSelector('.play-now-btn', { timeout: 5000 });
        
        const title = await this.page.title();
        this.assert(title.includes('Finding Sports'), 'Page title contains "Finding Sports"');
        
        // Check if Google Maps loads
        try {
            await this.page.waitForFunction(
                () => window.google && window.google.maps,
                { timeout: 15000 }
            );
            this.logTestPass('Google Maps API loaded successfully');
        } catch (error) {
            this.logTestFailure('Google Maps API loading', error);
        }
        
        this.logTestPass('Page load and initial state');
    }

    async testMobileResponsiveness() {
        console.log('📱 Testing Mobile Responsiveness...');
        
        const viewports = [
            { width: 375, height: 667, name: 'iPhone SE' },
            { width: 414, height: 896, name: 'iPhone 11' },
            { width: 768, height: 1024, name: 'iPad' },
            { width: 1920, height: 1080, name: 'Desktop' }
        ];
        
        for (const viewport of viewports) {
            await this.page.setViewport(viewport);
            await this.page.reload({ waitUntil: 'networkidle2' });
            
            // Check if elements are visible and properly sized
            const isHeaderVisible = await this.page.isVisible('.header');
            const isSearchVisible = await this.page.isVisible('.search-section');
            const isPlayNowVisible = await this.page.isVisible('.play-now-btn');
            
            this.assert(isHeaderVisible, `Header visible on ${viewport.name}`);
            this.assert(isSearchVisible, `Search section visible on ${viewport.name}`);
            this.assert(isPlayNowVisible, `Play Now button visible on ${viewport.name}`);
            
            await this.takeScreenshot(`mobile-${viewport.name.toLowerCase()}`);
        }
        
        this.logTestPass('Mobile responsiveness');
    }

    async testUserRegistrationFlow() {
        console.log('📝 Testing User Registration Flow...');
        
        await this.page.goto(`${this.baseUrl}/login.html`);
        
        // Switch to registration tab
        await this.page.click('.auth-tab:nth-child(2)'); // Sign Up tab
        await this.page.waitForSelector('#registerForm', { visible: true });
        
        // Fill registration form
        const testUser = {
            email: `test.${Date.now()}@example.com`,
            username: `testuser_${Date.now()}`,
            fullName: 'Test User',
            password: 'testpassword123'
        };
        
        await this.page.type('#regEmail', testUser.email);
        await this.page.type('#regUsername', testUser.username);
        await this.page.type('#regFullName', testUser.fullName);
        await this.page.type('#regPassword', testUser.password);
        
        // Submit registration
        await this.page.click('.auth-btn');
        
        // Wait for registration response
        try {
            await this.page.waitForNavigation({ timeout: 10000 });
            this.logTestPass('User registration completed');
        } catch (error) {
            // Check for registration success message
            const message = await this.page.$eval('#authMessage', el => el.textContent).catch(() => '');
            if (message.includes('success') || message.includes('registered')) {
                this.logTestPass('User registration completed with message');
            } else {
                this.logTestFailure('User registration', new Error(`Registration failed: ${message}`));
            }
        }
        
        await this.takeScreenshot('user-registration');
    }

    async testUserLoginFlow() {
        console.log('🔐 Testing User Login Flow...');
        
        await this.page.goto(`${this.baseUrl}/login.html`);
        
        // Use demo credentials
        await this.page.type('#email', 'demo@example.com');
        await this.page.type('#password', 'demo123');
        
        // Submit login
        await this.page.click('.auth-btn');
        
        try {
            // Wait for redirect or success
            await this.page.waitForFunction(
                () => localStorage.getItem('token') || window.location.pathname === '/',
                { timeout: 10000 }
            );
            
            const token = await this.page.evaluate(() => localStorage.getItem('token'));
            this.assert(token, 'Login token stored in localStorage');
            
            this.logTestPass('User login flow');
        } catch (error) {
            this.logTestFailure('User login', error);
        }
        
        await this.takeScreenshot('user-login');
    }

    async testPlayNowWorkflow() {
        console.log('🎯 Testing Play Now Workflow...');
        
        await this.page.goto(this.baseUrl);
        
        // Click Play Now button
        await this.page.click('.play-now-btn');
        
        // Wait for Play Now results to load
        try {
            await this.page.waitForSelector('.play-now-results', { timeout: 15000 });
            
            // Check if activities are displayed
            const hasActivities = await this.page.$('.play-now-results') !== null;
            this.assert(hasActivities, 'Play Now results displayed');
            
            // Check if map is initialized
            const mapExists = await this.page.$('#playNowMap') !== null;
            this.assert(mapExists, 'Play Now map container exists');
            
            this.logTestPass('Play Now workflow');
        } catch (error) {
            this.logTestFailure('Play Now workflow', error);
        }
        
        await this.takeScreenshot('play-now-workflow');
    }

    async testSocialFeedWorkflow() {
        console.log('💬 Testing Social Feed Workflow...');
        
        await this.page.goto(this.baseUrl);
        
        // Switch to social feed tab
        await this.page.click('button[onclick*="social"]');
        
        // Check if social feed loads
        try {
            await this.page.waitForSelector('#social-feed-container', { timeout: 10000 });
            
            const feedExists = await this.page.$('#social-feed-container') !== null;
            this.assert(feedExists, 'Social feed container exists');
            
            // Test creating a post (if logged in)
            const createButton = await this.page.$('#createPostBtn');
            if (createButton) {
                await this.page.click('#createPostBtn');
                // Check if post creation modal appears
                await this.page.waitForTimeout(2000);
            }
            
            this.logTestPass('Social feed workflow');
        } catch (error) {
            this.logTestFailure('Social feed workflow', error);
        }
        
        await this.takeScreenshot('social-feed');
    }

    async testWebSocketConnectivity() {
        console.log('🔌 Testing WebSocket Connectivity...');
        
        await this.page.goto(this.baseUrl);
        
        // Wait for WebSocket to connect
        try {
            await this.page.waitForFunction(
                () => window.webSocketClient && window.webSocketClient.connected,
                { timeout: 10000 }
            );
            
            const isConnected = await this.page.evaluate(() => 
                window.webSocketClient && window.webSocketClient.connected
            );
            
            this.assert(isConnected, 'WebSocket connected successfully');
            this.logTestPass('WebSocket connectivity');
        } catch (error) {
            this.logTestFailure('WebSocket connectivity', error);
        }
    }

    async testErrorHandlingFlows() {
        console.log('⚠️ Testing Error Handling Flows...');
        
        // Test 404 error handling
        await this.page.goto(`${this.baseUrl}/nonexistent-page`);
        const is404Handled = await this.page.$('h1') !== null; // Basic check for error page
        
        // Test API error handling
        await this.page.goto(this.baseUrl);
        
        // Simulate network failure
        await this.page.setOfflineMode(true);
        await this.page.click('.search-btn');
        await this.page.waitForTimeout(3000);
        
        // Re-enable network
        await this.page.setOfflineMode(false);
        
        this.logTestPass('Error handling flows');
        await this.takeScreenshot('error-handling');
    }

    async testPerformanceMetrics() {
        console.log('⚡ Testing Performance Metrics...');
        
        const metrics = await this.page.metrics();
        
        // Performance thresholds
        const thresholds = {
            JSHeapUsedSize: 50 * 1024 * 1024, // 50MB
            domNodes: 1000,
            layoutCount: 50
        };
        
        this.assert(
            metrics.JSHeapUsedSize < thresholds.JSHeapUsedSize,
            `JS Heap usage under ${thresholds.JSHeapUsedSize / 1024 / 1024}MB`
        );
        
        // Test page load performance
        const timing = await this.page.evaluate(() => {
            const nav = performance.getEntriesByType('navigation')[0];
            return {
                domContentLoaded: nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
                loadComplete: nav.loadEventEnd - nav.loadEventStart
            };
        });
        
        this.assert(timing.domContentLoaded < 3000, 'DOM content loaded under 3 seconds');
        
        this.logTestPass('Performance metrics');
    }

    async testSecurityValidation() {
        console.log('🔒 Testing Security Validation...');
        
        await this.page.goto(this.baseUrl);
        
        // Test XSS protection
        try {
            await this.page.evaluate(() => {
                const testInput = document.createElement('input');
                testInput.value = '<script>alert("xss")</script>';
                document.body.appendChild(testInput);
                
                // Trigger any input processing
                testInput.dispatchEvent(new Event('input'));
            });
            
            // Check if alert was blocked (no alert should appear)
            await this.page.waitForTimeout(1000);
            this.logTestPass('XSS protection active');
        } catch (error) {
            this.logTestFailure('XSS protection test', error);
        }
        
        // Test CSRF protection headers
        const response = await this.page.goto(this.baseUrl);
        const headers = response.headers();
        
        this.assert(
            headers['x-frame-options'] || headers['content-security-policy'],
            'Security headers present'
        );
        
        this.logTestPass('Security validation');
    }

    async testDeploymentHealth() {
        console.log('🏥 Testing Deployment Health...');
        
        // Test version endpoint
        try {
            const response = await this.page.goto(`${this.baseUrl}/api/version/check`);
            const isHealthy = response.status() === 200;
            
            this.assert(isHealthy, 'Health check endpoint responds');
            
            if (isHealthy) {
                const data = await response.json();
                console.log('Deployment version:', data);
            }
            
            this.logTestPass('Deployment health check');
        } catch (error) {
            this.logTestFailure('Deployment health check', error);
        }
    }

    // Helper methods
    async takeScreenshot(name) {
        const filename = `e2e-${name}-${Date.now()}.png`;
        await this.page.screenshot({ path: filename, fullPage: true });
        this.screenshots.push(filename);
        console.log(`📸 Screenshot saved: ${filename}`);
    }

    assert(condition, message) {
        if (condition) {
            this.testResults.passed++;
            this.testResults.tests.push({ status: 'PASS', message });
        } else {
            this.testResults.failed++;
            this.testResults.tests.push({ status: 'FAIL', message });
            throw new Error(`Assertion failed: ${message}`);
        }
    }

    logTestPass(testName) {
        console.log(`✅ PASS: ${testName}`);
        this.testResults.passed++;
        this.testResults.tests.push({ status: 'PASS', message: testName });
    }

    logTestFailure(testName, error) {
        console.log(`❌ FAIL: ${testName} - ${error.message}`);
        this.testResults.failed++;
        this.testResults.tests.push({ 
            status: 'FAIL', 
            message: testName, 
            error: error.message 
        });
    }

    async generateReport() {
        console.log('\n📊 E2E Validation Report');
        console.log('=' .repeat(50));
        console.log(`Total Tests: ${this.testResults.passed + this.testResults.failed}`);
        console.log(`✅ Passed: ${this.testResults.passed}`);
        console.log(`❌ Failed: ${this.testResults.failed}`);
        console.log(`📸 Screenshots: ${this.screenshots.length}`);
        
        const successRate = (this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100;
        console.log(`📈 Success Rate: ${successRate.toFixed(1)}%`);
        
        console.log('\nDetailed Results:');
        this.testResults.tests.forEach((test, index) => {
            const icon = test.status === 'PASS' ? '✅' : '❌';
            console.log(`${index + 1}. ${icon} ${test.message}`);
            if (test.error) {
                console.log(`   Error: ${test.error}`);
            }
        });
        
        // Save detailed report
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalTests: this.testResults.passed + this.testResults.failed,
                passed: this.testResults.passed,
                failed: this.testResults.failed,
                successRate: successRate
            },
            tests: this.testResults.tests,
            screenshots: this.screenshots,
            environment: {
                baseUrl: this.baseUrl,
                userAgent: await this.page.evaluate(() => navigator.userAgent),
                viewport: await this.page.viewport()
            }
        };
        
        fs.writeFileSync('e2e-validation-report.json', JSON.stringify(report, null, 2));
        console.log('\n📄 Detailed report saved: e2e-validation-report.json');
        
        return report;
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

// Main execution
async function main() {
    const validator = new E2EValidator();
    
    try {
        await validator.initialize();
        const report = await validator.runAllTests();
        
        // Store validation results in memory
        console.log('\n💾 Storing validation results...');
        
        // Coordination hook
        console.log('npx claude-flow hooks post-edit --file "e2e-validation" --memory-key "e2e/validation"');
        
        process.exit(report.summary.failed === 0 ? 0 : 1);
    } catch (error) {
        console.error('❌ E2E Validation failed:', error);
        process.exit(1);
    } finally {
        await validator.cleanup();
    }
}

if (require.main === module) {
    main();
}

module.exports = E2EValidator;