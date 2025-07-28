// Test configuration for Finding Sports cross-browser tests
module.exports = {
    // Test timeouts (in milliseconds)
    timeouts: {
        navigation: 30000,      // Page navigation timeout
        waitForElement: 10000,  // Element visibility timeout
        apiCall: 5000,         // API response timeout
        screenshot: 5000       // Screenshot capture timeout
    },
    
    // Viewport sizes for different devices
    viewports: {
        desktop: { width: 1920, height: 1080 },
        laptop: { width: 1366, height: 768 },
        tablet: { width: 768, height: 1024 },
        mobile: { width: 375, height: 667 }
    },
    
    // URLs to test (can be overridden via command line)
    urls: {
        local: 'file://' + require('path').join(__dirname, '..', 'mockup', 'index.html'),
        staging: 'https://staging.finding-sports.com',
        production: 'https://finding-sports.com'
    },
    
    // Additional selectors to check for nuclear fix
    additionalSelectors: {
        language: [
            '.translate-button',
            '#google-translate-element',
            '.goog-te-banner-frame',
            '[class*="translate"]',
            '[id*="translate"]'
        ],
        help: [
            '.support-button',
            '.help-center',
            '.assistance-link',
            '[aria-label*="support" i]',
            '[title*="assistance" i]'
        ]
    },
    
    // Performance thresholds (in milliseconds)
    performanceThresholds: {
        domContentLoaded: 3000,
        pageLoadComplete: 5000,
        firstPaint: 1500,
        firstContentfulPaint: 2000,
        largestContentfulPaint: 2500
    },
    
    // Screenshot options
    screenshots: {
        fullPage: true,
        quality: 80,
        type: 'png',
        animations: 'disabled',
        caret: 'hide'
    },
    
    // Browser launch options
    browserOptions: {
        chromium: {
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        },
        firefox: {
            firefoxUserPrefs: {
                'media.navigator.enabled': false,
                'media.peerconnection.enabled': false
            }
        },
        webkit: {
            // Safari-specific options
        }
    },
    
    // Report options
    report: {
        includePassedTests: true,
        includeScreenshots: true,
        includeConsoleErrors: true,
        includeNetworkErrors: true,
        generateMarkdown: true,
        generateHTML: true
    },
    
    // Test retry configuration
    retry: {
        times: 2,
        delay: 1000
    },
    
    // Custom test data
    testData: {
        // Expected number of game cards (minimum)
        minGameCards: 1,
        
        // Map container ID
        mapContainerId: 'map',
        
        // Games container selectors
        gamesContainerSelectors: [
            '#gamesContainer',
            '.games-container',
            '#games-list',
            '.events-list'
        ]
    }
};