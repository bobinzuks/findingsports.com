// ULTIMATE NUCLEAR FIX - This will absolutely prevent any language/help elements
(function() {
    'use strict';
    
    console.log('🚀 ULTIMATE NUCLEAR FIX ACTIVATED - v3.0 FINAL');
    
    // STEP 1: Completely override and disable ALL language/i18n services
    window.LanguageService = null;
    window.i18n = null;
    window.I18nService = null;
    window.addLanguageSelector = function() {};
    window.initializeLanguage = function() {};
    window.translatePage = function() {};
    
    // Override any object that might have these methods
    Object.defineProperty(window, 'LanguageService', {
        get: function() { return null; },
        set: function() { return null; },
        configurable: false
    });
    
    Object.defineProperty(window, 'i18n', {
        get: function() { return null; },
        set: function() { return null; },
        configurable: false
    });
    
    // STEP 2: Banned elements list
    const BANNED_TEXTS = [
        '🌐 English ▼', '🌐 English', '🌐', 'English ▼', 'English',
        '? Help', 'Help', '?', 'Online', '▼'
    ];
    
    const BANNED_CLASSES = [
        'language-selector', 'language-btn', 'language-dropdown',
        'help-btn', 'help-button', 'online-indicator', 'online-status',
        'lang-selector', 'help-icon', 'language-switch'
    ];
    
    // STEP 3: Nuclear removal function
    function nukeAllBannedElements() {
        // Remove by class
        BANNED_CLASSES.forEach(className => {
            const elements = document.querySelectorAll('.' + className);
            elements.forEach(el => {
                console.log(`🗑️ Nuking element with class: ${className}`);
                el.remove();
            });
        });
        
        // Remove by text content - more aggressive
        document.querySelectorAll('*').forEach(el => {
            if (el.children.length === 0) { // Only check leaf nodes
                const text = (el.textContent || '').trim();
                if (text && BANNED_TEXTS.includes(text)) {
                    console.log(`🗑️ Nuking element with text: ${text}`);
                    el.remove();
                }
            }
        });
        
        // Special handling for header-right
        const headerRight = document.querySelector('.header-right, .user-menu');
        if (headerRight) {
            // Get all child elements
            const children = Array.from(headerRight.children);
            children.forEach(child => {
                const text = (child.textContent || '').trim();
                // Remove anything that's not a login button
                if (!child.classList.contains('login-btn') && 
                    !child.classList.contains('auth-buttons') &&
                    !child.classList.contains('user-profile') &&
                    !child.id?.includes('login')) {
                    
                    // Check if it contains banned text
                    if (BANNED_TEXTS.some(banned => text.includes(banned))) {
                        console.log(`🗑️ Removing non-login element from header: ${text}`);
                        child.remove();
                    }
                }
            });
        }
    }
    
    // STEP 4: Override DOM manipulation methods to prevent additions
    const originalCreateElement = document.createElement;
    document.createElement = function(tagName) {
        const element = originalCreateElement.call(document, tagName);
        
        // Override methods that could add banned content
        const originalSetAttribute = element.setAttribute;
        element.setAttribute = function(name, value) {
            if (name === 'class' && BANNED_CLASSES.some(banned => value.includes(banned))) {
                console.log('❌ Blocked setAttribute with banned class:', value);
                return;
            }
            return originalSetAttribute.call(this, name, value);
        };
        
        const originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
        Object.defineProperty(element, 'innerHTML', {
            set: function(html) {
                if (BANNED_TEXTS.some(banned => html.includes(banned))) {
                    console.log('❌ Blocked innerHTML with banned text');
                    return;
                }
                originalInnerHTML.set.call(this, html);
            },
            get: originalInnerHTML.get
        });
        
        return element;
    };
    
    // STEP 5: Mutation observer with immediate response
    let observer;
    function setupObserver() {
        if (observer) observer.disconnect();
        
        observer = new MutationObserver((mutations) => {
            let foundBanned = false;
            
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const text = (node.textContent || '').trim();
                        const className = node.className || '';
                        
                        if (BANNED_TEXTS.some(banned => text.includes(banned)) ||
                            BANNED_CLASSES.some(banned => className.includes(banned))) {
                            foundBanned = true;
                            // Remove immediately
                            node.remove();
                            console.log('🔥 Instantly removed banned element');
                        }
                    }
                });
            });
            
            if (foundBanned) {
                // Do a full sweep just to be sure
                nukeAllBannedElements();
            }
        });
        
        if (document.body) {
            observer.observe(document.body, {
                childList: true,
                subtree: true,
                characterData: true,
                attributes: true,
                attributeFilter: ['class', 'onclick']
            });
            console.log('👁️ Ultimate observer active');
        }
    }
    
    // STEP 6: Run cleanup aggressively
    function runCleanup() {
        nukeAllBannedElements();
        
        // Also clear any script tags that might load language services
        document.querySelectorAll('script').forEach(script => {
            const src = script.src || '';
            if (src.includes('language-service') || src.includes('i18n-service')) {
                console.log('🗑️ Removing script:', src);
                script.remove();
            }
        });
    }
    
    // STEP 7: Initialize with multiple strategies
    
    // Run immediately
    runCleanup();
    
    // Run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            runCleanup();
            setupObserver();
        });
    } else {
        setupObserver();
    }
    
    // Run at multiple intervals
    [0, 10, 50, 100, 200, 500, 1000, 2000, 5000].forEach(delay => {
        setTimeout(runCleanup, delay);
    });
    
    // Run every 3 seconds forever
    setInterval(runCleanup, 3000);
    
    // Run on window load
    window.addEventListener('load', () => {
        runCleanup();
        setupObserver();
    });
    
    console.log('✅ Ultimate nuclear fix fully operational - NO ESCAPE!');
})();