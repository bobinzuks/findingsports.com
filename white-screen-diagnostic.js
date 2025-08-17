/**
 * White Screen Diagnostic Script
 * Comprehensive debugging tool to identify why a page appears blank/white
 * 
 * Usage: Copy and paste this entire script into browser console
 * or inject it into the page via script tag
 */

(function() {
    'use strict';
    
    console.log('🔍 Starting White Screen Diagnostic...');
    console.log('='.repeat(50));
    
    const results = {
        errors: [],
        warnings: [],
        info: [],
        tests: {}
    };
    
    // Utility functions
    function log(type, message, data = null) {
        const timestamp = new Date().toISOString();
        const entry = { timestamp, message, data };
        results[type].push(entry);
        
        const emoji = {
            errors: '❌',
            warnings: '⚠️',
            info: 'ℹ️'
        };
        
        console.log(`${emoji[type]} ${message}`, data || '');
    }
    
    function test(name, fn) {
        try {
            const result = fn();
            results.tests[name] = { status: 'pass', result };
            console.log(`✅ ${name}: PASS`, result);
            return result;
        } catch (error) {
            results.tests[name] = { status: 'fail', error: error.message };
            console.log(`❌ ${name}: FAIL`, error.message);
            log('errors', `Test "${name}" failed`, error.message);
            return null;
        }
    }
    
    // 1. DOM STRUCTURE ANALYSIS
    console.log('\n📋 1. DOM STRUCTURE ANALYSIS');
    console.log('-'.repeat(30));
    
    test('Document Ready State', () => {
        const state = document.readyState;
        if (state !== 'complete') {
            log('warnings', `Document not fully loaded: ${state}`);
        }
        return state;
    });
    
    test('HTML Element Exists', () => {
        const html = document.documentElement;
        if (!html) {
            log('errors', 'HTML element missing');
            return false;
        }
        return true;
    });
    
    test('Body Element Exists', () => {
        const body = document.body;
        if (!body) {
            log('errors', 'Body element missing');
            return false;
        }
        return true;
    });
    
    test('Critical Elements Count', () => {
        const elementCounts = {
            total: document.querySelectorAll('*').length,
            visible: document.querySelectorAll('*:not([style*="display: none"]):not([style*="visibility: hidden"])').length,
            divs: document.querySelectorAll('div').length,
            scripts: document.querySelectorAll('script').length,
            links: document.querySelectorAll('link').length,
            styles: document.querySelectorAll('style').length
        };
        
        if (elementCounts.total < 5) {
            log('warnings', 'Very few DOM elements found', elementCounts);
        }
        
        return elementCounts;
    });
    
    // 2. COMPUTED STYLES ANALYSIS
    console.log('\n🎨 2. COMPUTED STYLES ANALYSIS');
    console.log('-'.repeat(30));
    
    test('Body Computed Styles', () => {
        if (!document.body) return null;
        
        const styles = window.getComputedStyle(document.body);
        const criticalStyles = {
            display: styles.display,
            visibility: styles.visibility,
            opacity: styles.opacity,
            backgroundColor: styles.backgroundColor,
            color: styles.color,
            height: styles.height,
            width: styles.width,
            overflow: styles.overflow,
            position: styles.position,
            zIndex: styles.zIndex
        };
        
        // Check for problematic styles
        if (styles.display === 'none') {
            log('errors', 'Body element has display: none');
        }
        if (styles.visibility === 'hidden') {
            log('errors', 'Body element has visibility: hidden');
        }
        if (parseFloat(styles.opacity) === 0) {
            log('errors', 'Body element has opacity: 0');
        }
        if (styles.color === styles.backgroundColor && styles.color !== 'rgba(0, 0, 0, 0)') {
            log('warnings', 'Text color matches background color');
        }
        
        return criticalStyles;
    });
    
    test('HTML Computed Styles', () => {
        const styles = window.getComputedStyle(document.documentElement);
        const criticalStyles = {
            display: styles.display,
            visibility: styles.visibility,
            opacity: styles.opacity,
            backgroundColor: styles.backgroundColor,
            height: styles.height,
            width: styles.width
        };
        
        if (styles.display === 'none') {
            log('errors', 'HTML element has display: none');
        }
        
        return criticalStyles;
    });
    
    test('Main Content Elements', () => {
        const selectors = ['main', '#app', '#root', '.app', '.main', '[data-app]'];
        const mainElements = [];
        
        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                const styles = window.getComputedStyle(el);
                mainElements.push({
                    selector,
                    element: el.tagName.toLowerCase(),
                    id: el.id,
                    className: el.className,
                    display: styles.display,
                    visibility: styles.visibility,
                    opacity: styles.opacity,
                    height: styles.height,
                    width: styles.width,
                    hasContent: el.children.length > 0 || el.textContent.trim().length > 0
                });
                
                if (styles.display === 'none') {
                    log('warnings', `Main element ${selector} has display: none`);
                }
                if (styles.visibility === 'hidden') {
                    log('warnings', `Main element ${selector} has visibility: hidden`);
                }
                if (parseFloat(styles.opacity) === 0) {
                    log('warnings', `Main element ${selector} has opacity: 0`);
                }
            });
        });
        
        if (mainElements.length === 0) {
            log('warnings', 'No main content elements found');
        }
        
        return mainElements;
    });
    
    // 3. JAVASCRIPT ERROR TRACKING
    console.log('\n🐛 3. JAVASCRIPT ERROR TRACKING');
    console.log('-'.repeat(30));
    
    test('Console Error History', () => {
        // Can't access console history directly, but can set up listeners
        const originalError = console.error;
        const originalWarn = console.warn;
        const capturedErrors = [];
        const capturedWarnings = [];
        
        console.error = function(...args) {
            capturedErrors.push(args.join(' '));
            originalError.apply(console, args);
        };
        
        console.warn = function(...args) {
            capturedWarnings.push(args.join(' '));
            originalWarn.apply(console, args);
        };
        
        // Check for existing error indicators
        window.addEventListener('error', (e) => {
            log('errors', 'JavaScript Error Detected', {
                message: e.message,
                filename: e.filename,
                lineno: e.lineno,
                colno: e.colno,
                error: e.error ? e.error.toString() : null
            });
        });
        
        window.addEventListener('unhandledrejection', (e) => {
            log('errors', 'Unhandled Promise Rejection', {
                reason: e.reason,
                promise: e.promise
            });
        });
        
        return {
            errorListenerSet: true,
            rejectionListenerSet: true
        };
    });
    
    test('Framework Detection', () => {
        const frameworks = {
            react: !!(window.React || document.querySelector('[data-reactroot]') || document.querySelector('*[data-react*]')),
            vue: !!(window.Vue || document.querySelector('*[data-v-*]') || document.querySelector('#app[data-server-rendered]')),
            angular: !!(window.ng || window.angular || document.querySelector('*[ng-*]') || document.querySelector('app-root')),
            jquery: !!(window.jQuery || window.$),
            svelte: !!(document.querySelector('*[data-svelte*]')),
            alpine: !!(window.Alpine || document.querySelector('*[x-data*]')),
            nextjs: !!(window.__NEXT_DATA__),
            nuxt: !!(window.__NUXT__),
            gatsby: !!(window.___gatsby)
        };
        
        const detectedFrameworks = Object.entries(frameworks)
            .filter(([name, detected]) => detected)
            .map(([name]) => name);
        
        if (detectedFrameworks.length === 0) {
            log('info', 'No major frameworks detected');
        } else {
            log('info', 'Frameworks detected', detectedFrameworks);
        }
        
        return frameworks;
    });
    
    // 4. BLOCKING RESOURCES CHECK
    console.log('\n🚫 4. BLOCKING RESOURCES CHECK');
    console.log('-'.repeat(30));
    
    test('CSS Resources', () => {
        const cssLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
        const styleElements = Array.from(document.querySelectorAll('style'));
        
        const cssInfo = {
            externalStylesheets: cssLinks.length,
            inlineStyles: styleElements.length,
            stylesheets: cssLinks.map(link => ({
                href: link.href,
                media: link.media,
                disabled: link.disabled,
                loaded: link.sheet !== null
            }))
        };
        
        cssLinks.forEach((link, index) => {
            if (!link.sheet) {
                log('warnings', `CSS file may not have loaded`, link.href);
            }
        });
        
        if (cssLinks.length === 0 && styleElements.length === 0) {
            log('warnings', 'No CSS found - page may appear unstyled');
        }
        
        return cssInfo;
    });
    
    test('JavaScript Resources', () => {
        const scripts = Array.from(document.querySelectorAll('script'));
        const scriptInfo = {
            total: scripts.length,
            external: scripts.filter(s => s.src).length,
            inline: scripts.filter(s => !s.src).length,
            async: scripts.filter(s => s.async).length,
            defer: scripts.filter(s => s.defer).length,
            scripts: scripts.map(script => ({
                src: script.src || 'inline',
                async: script.async,
                defer: script.defer,
                type: script.type,
                loaded: script.src ? undefined : true // Can't easily check external script load status
            }))
        };
        
        return scriptInfo;
    });
    
    test('Image Resources', () => {
        const images = Array.from(document.querySelectorAll('img'));
        const imageInfo = {
            total: images.length,
            loaded: 0,
            failed: 0,
            loading: 0
        };
        
        images.forEach(img => {
            if (img.complete) {
                if (img.naturalWidth === 0) {
                    imageInfo.failed++;
                    log('warnings', 'Image failed to load', img.src);
                } else {
                    imageInfo.loaded++;
                }
            } else {
                imageInfo.loading++;
            }
        });
        
        return imageInfo;
    });
    
    // 5. CRITICAL DOM ELEMENTS VERIFICATION
    console.log('\n🏗️ 5. CRITICAL DOM ELEMENTS VERIFICATION');
    console.log('-'.repeat(30));
    
    test('Viewport Meta Tag', () => {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            log('warnings', 'No viewport meta tag found');
            return false;
        }
        return viewport.content;
    });
    
    test('Document Title', () => {
        const title = document.title;
        if (!title || title.trim() === '') {
            log('warnings', 'Document has no title');
        }
        return title;
    });
    
    test('Visible Text Content', () => {
        const textNodes = [];
        const walker = document.createTreeWalker(
            document.body || document,
            NodeFilter.SHOW_TEXT,
            {
                acceptNode: function(node) {
                    const text = node.textContent.trim();
                    if (text.length > 0) {
                        const parent = node.parentElement;
                        if (parent) {
                            const styles = window.getComputedStyle(parent);
                            if (styles.display !== 'none' && styles.visibility !== 'hidden' && parseFloat(styles.opacity) > 0) {
                                return NodeFilter.FILTER_ACCEPT;
                            }
                        }
                    }
                    return NodeFilter.FILTER_REJECT;
                }
            }
        );
        
        let node;
        while (node = walker.nextNode()) {
            textNodes.push(node.textContent.trim());
        }
        
        const visibleText = textNodes.join(' ').slice(0, 200);
        
        if (textNodes.length === 0) {
            log('warnings', 'No visible text content found');
        } else {
            log('info', `Found ${textNodes.length} text nodes`, visibleText);
        }
        
        return {
            textNodeCount: textNodes.length,
            sampleText: visibleText
        };
    });
    
    // 6. STORAGE AVAILABILITY
    console.log('\n💾 6. STORAGE AVAILABILITY');
    console.log('-'.repeat(30));
    
    test('localStorage Availability', () => {
        try {
            const testKey = '__test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (e) {
            log('warnings', 'localStorage not available', e.message);
            return false;
        }
    });
    
    test('sessionStorage Availability', () => {
        try {
            const testKey = '__test__';
            sessionStorage.setItem(testKey, 'test');
            sessionStorage.removeItem(testKey);
            return true;
        } catch (e) {
            log('warnings', 'sessionStorage not available', e.message);
            return false;
        }
    });
    
    test('localStorage Content', () => {
        try {
            const keys = Object.keys(localStorage);
            const content = {};
            keys.forEach(key => {
                try {
                    content[key] = localStorage.getItem(key)?.slice(0, 100) + '...';
                } catch (e) {
                    content[key] = '[Error reading]';
                }
            });
            return { keyCount: keys.length, keys, sampleContent: content };
        } catch (e) {
            return { error: e.message };
        }
    });
    
    // 7. NETWORK REQUESTS CHECK
    console.log('\n🌐 7. NETWORK REQUESTS CHECK');
    console.log('-'.repeat(30));
    
    test('Performance API Requests', () => {
        if (!window.performance || !window.performance.getEntriesByType) {
            log('warnings', 'Performance API not available');
            return null;
        }
        
        const resources = window.performance.getEntriesByType('resource');
        const navigation = window.performance.getEntriesByType('navigation')[0];
        
        const failedResources = resources.filter(resource => 
            resource.transferSize === 0 && resource.decodedBodySize === 0
        );
        
        const slowResources = resources.filter(resource => 
            resource.duration > 5000
        );
        
        if (failedResources.length > 0) {
            log('warnings', `${failedResources.length} resources may have failed to load`);
            failedResources.forEach(resource => {
                log('warnings', 'Failed resource', resource.name);
            });
        }
        
        if (slowResources.length > 0) {
            log('warnings', `${slowResources.length} resources took >5s to load`);
        }
        
        return {
            totalResources: resources.length,
            failedResources: failedResources.length,
            slowResources: slowResources.length,
            navigationTiming: navigation ? {
                domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
                totalTime: navigation.loadEventEnd - navigation.fetchStart
            } : null
        };
    });
    
    // 8. ADDITIONAL DIAGNOSTICS
    console.log('\n🔧 8. ADDITIONAL DIAGNOSTICS');
    console.log('-'.repeat(30));
    
    test('Window Dimensions', () => {
        const dimensions = {
            windowWidth: window.innerWidth,
            windowHeight: window.innerHeight,
            screenWidth: screen.width,
            screenHeight: screen.height,
            devicePixelRatio: window.devicePixelRatio,
            documentWidth: document.documentElement.scrollWidth,
            documentHeight: document.documentElement.scrollHeight
        };
        
        if (window.innerWidth === 0 || window.innerHeight === 0) {
            log('warnings', 'Window has zero dimensions');
        }
        
        return dimensions;
    });
    
    test('CSS Support', () => {
        const support = {
            flexbox: CSS.supports('display', 'flex'),
            grid: CSS.supports('display', 'grid'),
            customProperties: CSS.supports('color', 'var(--test)'),
            transforms: CSS.supports('transform', 'translateX(1px)'),
            animations: CSS.supports('animation-name', 'test'),
            calc: CSS.supports('width', 'calc(100% - 10px)')
        };
        
        const unsupported = Object.entries(support)
            .filter(([feature, supported]) => !supported)
            .map(([feature]) => feature);
        
        if (unsupported.length > 0) {
            log('warnings', 'Some CSS features not supported', unsupported);
        }
        
        return support;
    });
    
    test('User Agent', () => {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine
        };
    });
    
    // FINAL SUMMARY
    console.log('\n📊 DIAGNOSTIC SUMMARY');
    console.log('='.repeat(50));
    
    const summary = {
        timestamp: new Date().toISOString(),
        totalTests: Object.keys(results.tests).length,
        passedTests: Object.values(results.tests).filter(t => t.status === 'pass').length,
        failedTests: Object.values(results.tests).filter(t => t.status === 'fail').length,
        errors: results.errors.length,
        warnings: results.warnings.length,
        info: results.info.length
    };
    
    console.log(`✅ Tests Passed: ${summary.passedTests}/${summary.totalTests}`);
    console.log(`❌ Tests Failed: ${summary.failedTests}/${summary.totalTests}`);
    console.log(`🚨 Errors: ${summary.errors}`);
    console.log(`⚠️ Warnings: ${summary.warnings}`);
    console.log(`ℹ️ Info: ${summary.info}`);
    
    if (summary.errors > 0) {
        console.log('\n🚨 CRITICAL ISSUES:');
        results.errors.forEach(error => {
            console.log(`   • ${error.message}`);
        });
    }
    
    if (summary.warnings > 0) {
        console.log('\n⚠️ WARNINGS:');
        results.warnings.forEach(warning => {
            console.log(`   • ${warning.message}`);
        });
    }
    
    // Possible causes analysis
    console.log('\n🔍 POSSIBLE CAUSES ANALYSIS:');
    const possibleCauses = [];
    
    if (results.tests['Body Element Exists']?.status === 'fail') {
        possibleCauses.push('Missing body element - critical DOM structure issue');
    }
    
    if (results.tests['Body Computed Styles']?.result?.display === 'none') {
        possibleCauses.push('Body element hidden with display: none');
    }
    
    if (results.tests['Body Computed Styles']?.result?.visibility === 'hidden') {
        possibleCauses.push('Body element hidden with visibility: hidden');
    }
    
    if (results.tests['Body Computed Styles']?.result?.opacity === '0') {
        possibleCauses.push('Body element transparent with opacity: 0');
    }
    
    if (results.tests['CSS Resources']?.result?.externalStylesheets === 0 && 
        results.tests['CSS Resources']?.result?.inlineStyles === 0) {
        possibleCauses.push('No CSS found - page may be completely unstyled');
    }
    
    if (results.tests['Visible Text Content']?.result?.textNodeCount === 0) {
        possibleCauses.push('No visible text content found');
    }
    
    if (results.tests['Critical Elements Count']?.result?.total < 5) {
        possibleCauses.push('Very few DOM elements - page may not be rendering');
    }
    
    if (summary.failedTests > 0) {
        possibleCauses.push('Multiple diagnostic tests failed - check specific errors above');
    }
    
    if (possibleCauses.length === 0) {
        possibleCauses.push('No obvious issues detected - may be a more complex rendering problem');
    }
    
    possibleCauses.forEach((cause, index) => {
        console.log(`   ${index + 1}. ${cause}`);
    });
    
    // Export results to global scope for further inspection
    window.whitescreenDiagnostic = {
        summary,
        results,
        possibleCauses,
        runTimestamp: new Date().toISOString()
    };
    
    console.log('\n💾 Full results saved to: window.whitescreenDiagnostic');
    console.log('🔍 White Screen Diagnostic Complete!');
    
    return {
        summary,
        results,
        possibleCauses
    };
})();