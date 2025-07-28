// ENHANCED NUCLEAR FIX - This WILL work against dynamic additions
(function() {
    'use strict';
    
    console.log('🚀 ENHANCED NUCLEAR FIX ACTIVATED - v2.0');
    
    // STEP 1: Immediately override LanguageService to prevent initialization
    window.LanguageService = {
        initialize: function() {
            console.log('❌ LanguageService initialization BLOCKED by nuclear fix');
        },
        addLanguageSelector: function() {
            console.log('❌ Language selector addition BLOCKED by nuclear fix');
        },
        toggleLanguageDropdown: function() {},
        changeLanguage: function() {},
        translatePage: function() {}
    };
    
    // Also block any i18n service
    window.i18n = {
        init: function() {
            console.log('❌ i18n initialization BLOCKED by nuclear fix');
        }
    };
    
    // STEP 2: Create list of banned text patterns
    const BANNED_TEXTS = [
        '🌐 English ▼',
        '🌐 English',
        '🌐',
        'English ▼',
        'English',
        '? Help',
        'Help',
        '?',
        'Online',
        '▼' // Dropdown arrow
    ];
    
    // STEP 3: Aggressive element removal function
    function nukeElements() {
        // Remove by class names
        const bannedClasses = ['language-selector', 'language-btn', 'language-dropdown', 
                              'help-btn', 'help-button', 'online-indicator', 'online-status'];
        
        bannedClasses.forEach(className => {
            document.querySelectorAll('.' + className).forEach(el => {
                console.log(`🗑️ Removing element with class: ${className}`);
                el.remove();
            });
        });
        
        // Remove by text content
        document.querySelectorAll('*').forEach(el => {
            const text = (el.textContent || '').trim();
            const innerText = (el.innerText || '').trim();
            
            // Check if element contains only banned text
            if (BANNED_TEXTS.includes(text) || BANNED_TEXTS.includes(innerText)) {
                console.log(`🗑️ Removing element with text: ${text}`);
                el.remove();
                return;
            }
            
            // Check for language/help related attributes
            if (el.getAttribute('onclick') && 
                (el.getAttribute('onclick').includes('Language') || 
                 el.getAttribute('onclick').includes('language') ||
                 el.getAttribute('onclick').includes('Help'))) {
                console.log(`🗑️ Removing element with language/help onclick`);
                el.remove();
                return;
            }
        });
        
        // Specific targeting of header-right
        const headerRight = document.querySelector('.header-right, .user-menu');
        if (headerRight) {
            // Remove all children except login button
            Array.from(headerRight.children).forEach(child => {
                if (!child.classList.contains('login-btn') && 
                    !child.classList.contains('auth-buttons') &&
                    !child.classList.contains('user-profile')) {
                    console.log(`🗑️ Removing non-login element from header`);
                    child.remove();
                }
            });
            
            // Clean up text nodes
            Array.from(headerRight.childNodes).forEach(node => {
                if (node.nodeType === Node.TEXT_NODE) {
                    const text = node.textContent.trim();
                    if (text && BANNED_TEXTS.some(banned => text.includes(banned))) {
                        console.log(`🗑️ Removing text node: ${text}`);
                        node.remove();
                    }
                }
            });
        }
    }
    
    // STEP 4: Setup MutationObserver for continuous monitoring
    let observer;
    function setupObserver() {
        if (observer) observer.disconnect();
        
        observer = new MutationObserver((mutations) => {
            let shouldNuke = false;
            
            mutations.forEach(mutation => {
                // Check added nodes
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        const text = (node.textContent || '').trim();
                        const className = node.className || '';
                        
                        if (BANNED_TEXTS.some(banned => text.includes(banned)) ||
                            className.includes('language') || 
                            className.includes('help')) {
                            shouldNuke = true;
                        }
                    } else if (node.nodeType === Node.TEXT_NODE) {
                        const text = (node.textContent || '').trim();
                        if (text && BANNED_TEXTS.some(banned => text.includes(banned))) {
                            shouldNuke = true;
                        }
                    }
                });
            });
            
            if (shouldNuke) {
                console.log('🔥 Banned element detected - nuking...');
                nukeElements();
            }
        });
        
        // Start observing when body is available
        if (document.body) {
            observer.observe(document.body, {
                childList: true,
                subtree: true,
                characterData: true,
                attributes: true,
                attributeFilter: ['class', 'onclick']
            });
            console.log('👁️ MutationObserver active and monitoring');
        }
    }
    
    // STEP 5: Override critical functions to prevent dynamic additions
    const originalAppendChild = Element.prototype.appendChild;
    Element.prototype.appendChild = function(child) {
        if (child && child.nodeType === Node.ELEMENT_NODE) {
            const text = (child.textContent || '').trim();
            const className = child.className || '';
            
            if (BANNED_TEXTS.some(banned => text.includes(banned)) ||
                className.includes('language') || 
                className.includes('help')) {
                console.log('❌ Blocked appendChild of banned element');
                return child; // Return child without adding
            }
        }
        return originalAppendChild.call(this, child);
    };
    
    const originalInsertBefore = Element.prototype.insertBefore;
    Element.prototype.insertBefore = function(newNode, referenceNode) {
        if (newNode && newNode.nodeType === Node.ELEMENT_NODE) {
            const text = (newNode.textContent || '').trim();
            const className = newNode.className || '';
            
            if (BANNED_TEXTS.some(banned => text.includes(banned)) ||
                className.includes('language') || 
                className.includes('help')) {
                console.log('❌ Blocked insertBefore of banned element');
                return newNode; // Return node without adding
            }
        }
        return originalInsertBefore.call(this, newNode, referenceNode);
    };
    
    // STEP 6: Run aggressive cleanup on multiple schedules
    function runCleanupCycle() {
        console.log('🧹 Running cleanup cycle');
        nukeElements();
    }
    
    // Initial cleanup
    runCleanupCycle();
    
    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            runCleanupCycle();
            setupObserver();
        });
    } else {
        setupObserver();
    }
    
    // Run multiple times to catch any delayed additions
    const intervals = [50, 100, 200, 500, 1000, 2000, 3000, 5000, 10000];
    intervals.forEach(interval => {
        setTimeout(runCleanupCycle, interval);
    });
    
    // Run every 5 seconds indefinitely
    setInterval(runCleanupCycle, 5000);
    
    // Also run on window load
    window.addEventListener('load', () => {
        runCleanupCycle();
        setupObserver();
    });
    
    console.log('✅ Enhanced nuclear fix fully armed and operational');
})();