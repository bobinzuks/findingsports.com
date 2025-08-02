// ULTIMATE NUCLEAR FIX v6.0 - ULTRA PERSISTENT ELEMENT DESTROYER
(function() {
    'use strict';
    
    console.log('🚀 NUCLEAR FIX v6.0 ACTIVATED - PERSISTENT DESTROYER MODE');
    
    // Extended list of banned patterns
    const bannedPatterns = [
        // Text content patterns
        /🌐/g, /English/gi, /Language/gi, /\?\s*Help/gi, /Help\s*\?/gi,
        /Online/gi, /Status/gi, /Translate/gi, /Locale/gi,
        /English.*▼/gi, /▼.*English/gi, /Select.*Language/gi,
        /Choose.*Language/gi, /Language.*Selector/gi,
        // Common language codes
        /\ben\b/i, /\bes\b/i, /\bfr\b/i, /\bde\b/i, /\bzh\b/i,
        /\bja\b/i, /\bko\b/i, /\bpt\b/i, /\bit\b/i, /\bru\b/i
    ];
    
    // Extended class/id patterns
    const bannedAttributes = [
        'language', 'lang', 'locale', 'i18n', 'translate', 'translation',
        'help', 'support', 'assist', 'online', 'status', 'indicator',
        'selector', 'picker', 'chooser', 'switcher', 'toggle', 'dropdown',
        'menu-language', 'menu-lang', 'lang-menu', 'language-menu'
    ];
    
    // Track destroyed elements to prevent recreation
    const destroyedElements = new WeakSet();
    const destroyedSelectors = new Set();
    
    // Ultra aggressive element destroyer
    function destroyElement(el) {
        if (!el || destroyedElements.has(el)) return;
        
        // Mark as destroyed
        destroyedElements.add(el);
        
        // Save selector for future blocking
        if (el.className) {
            el.className.split(' ').forEach(cls => {
                if (cls) destroyedSelectors.add('.' + cls);
            });
        }
        if (el.id) {
            destroyedSelectors.add('#' + el.id);
        }
        
        // Multiple destruction methods
        try {
            // Method 1: Remove from DOM
            el.remove();
        } catch (e) {}
        
        try {
            // Method 2: Hide completely
            el.style.cssText = 'display: none !important; visibility: hidden !important; opacity: 0 !important; pointer-events: none !important; position: absolute !important; left: -99999px !important; top: -99999px !important; width: 0 !important; height: 0 !important; overflow: hidden !important;';
        } catch (e) {}
        
        try {
            // Method 3: Clear content
            el.innerHTML = '';
            el.textContent = '';
        } catch (e) {}
        
        try {
            // Method 4: Remove from parent
            if (el.parentNode) {
                el.parentNode.removeChild(el);
            }
        } catch (e) {}
    }
    
    // Check if element should be destroyed
    function shouldDestroy(el) {
        if (!el || el.nodeType !== 1) return false;
        if (destroyedElements.has(el)) return false;
        
        // Check tag name
        const tagName = el.tagName.toLowerCase();
        if (tagName === 'script' || tagName === 'style' || tagName === 'head') return false;
        
        // Check text content
        const text = (el.textContent || '').trim();
        const innerText = (el.innerText || '').trim();
        
        for (let pattern of bannedPatterns) {
            if (pattern.test(text) || pattern.test(innerText)) {
                return true;
            }
        }
        
        // Check attributes
        for (let attr of bannedAttributes) {
            // Check class
            if (el.className && typeof el.className === 'string') {
                if (el.className.toLowerCase().includes(attr)) return true;
            }
            
            // Check id
            if (el.id && el.id.toLowerCase().includes(attr)) return true;
            
            // Check all attributes
            for (let attrNode of el.attributes || []) {
                if (attrNode.name.toLowerCase().includes(attr) || 
                    attrNode.value.toLowerCase().includes(attr)) {
                    return true;
                }
            }
        }
        
        // Check specific selectors
        const specificSelectors = [
            '[class*="language"]', '[id*="language"]',
            '[class*="lang"]', '[id*="lang"]',
            '[class*="help"]', '[id*="help"]',
            '[class*="i18n"]', '[id*="i18n"]',
            '[class*="locale"]', '[id*="locale"]',
            '[class*="translate"]', '[id*="translate"]'
        ];
        
        for (let selector of specificSelectors) {
            try {
                if (el.matches(selector)) return true;
            } catch (e) {}
        }
        
        return false;
    }
    
    // Main cleaning function
    function cleanDOM() {
        // Destroy all elements with banned content
        document.querySelectorAll('*').forEach(el => {
            if (shouldDestroy(el)) {
                destroyElement(el);
            }
        });
        
        // Re-check previously destroyed selectors
        destroyedSelectors.forEach(selector => {
            try {
                document.querySelectorAll(selector).forEach(destroyElement);
            } catch (e) {}
        });
        
        // Ensure login button exists
        const headerRight = document.querySelector('.header-right, .user-menu');
        if (headerRight && !headerRight.querySelector('.login-btn')) {
            headerRight.innerHTML = '<button class="login-btn" style="padding: 12px 24px; background: #ff6b35; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: bold;" onclick="window.location.href=\'/login.html\'">Login</button>';
        }
    }
    
    // Intercept element creation
    const originalCreateElement = document.createElement;
    document.createElement = function(tagName) {
        const element = originalCreateElement.call(document, tagName);
        
        // Monitor the element
        setTimeout(() => {
            if (shouldDestroy(element)) {
                destroyElement(element);
            }
        }, 0);
        
        return element;
    };
    
    // Intercept appendChild
    const originalAppendChild = Node.prototype.appendChild;
    Node.prototype.appendChild = function(child) {
        if (child && shouldDestroy(child)) {
            destroyElement(child);
            return child;
        }
        return originalAppendChild.call(this, child);
    };
    
    // Intercept insertBefore
    const originalInsertBefore = Node.prototype.insertBefore;
    Node.prototype.insertBefore = function(newNode, referenceNode) {
        if (newNode && shouldDestroy(newNode)) {
            destroyElement(newNode);
            return newNode;
        }
        return originalInsertBefore.call(this, newNode, referenceNode);
    };
    
    // Intercept innerHTML
    const originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
    Object.defineProperty(Element.prototype, 'innerHTML', {
        set: function(value) {
            originalInnerHTML.set.call(this, value);
            // Clean after setting
            setTimeout(cleanDOM, 0);
        },
        get: originalInnerHTML.get
    });
    
    // Block dangerous window properties
    const dangerousProps = ['LanguageService', 'i18n', 'i18next', 'translate', 'localize'];
    dangerousProps.forEach(prop => {
        try {
            Object.defineProperty(window, prop, {
                value: null,
                writable: false,
                configurable: false
            });
        } catch (e) {}
    });
    
    // Ultra aggressive continuous monitoring
    let cleanCount = 0;
    function aggressiveClean() {
        cleanDOM();
        cleanCount++;
        
        // Variable interval - more aggressive at start
        let interval = 10; // Start with 10ms
        if (cleanCount > 100) interval = 25;
        if (cleanCount > 500) interval = 50;
        if (cleanCount > 1000) interval = 100;
        
        setTimeout(aggressiveClean, interval);
    }
    
    // Start multiple cleaning strategies
    
    // Strategy 1: Immediate and continuous
    cleanDOM();
    aggressiveClean();
    
    // Strategy 2: MutationObserver with immediate response
    if (window.MutationObserver) {
        const observer = new MutationObserver((mutations) => {
            // Immediate check on each mutation
            mutations.forEach(mutation => {
                // Check added nodes
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1 && shouldDestroy(node)) {
                        destroyElement(node);
                    }
                    // Check children
                    if (node.querySelectorAll) {
                        node.querySelectorAll('*').forEach(child => {
                            if (shouldDestroy(child)) {
                                destroyElement(child);
                            }
                        });
                    }
                });
                
                // Check modified attributes
                if (mutation.type === 'attributes' && shouldDestroy(mutation.target)) {
                    destroyElement(mutation.target);
                }
            });
            
            // Full clean after mutations
            cleanDOM();
        });
        
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            characterData: true,
            attributeOldValue: true
        });
    }
    
    // Strategy 3: Event interception
    ['DOMContentLoaded', 'load', 'resize', 'scroll', 'click', 'focus', 'blur'].forEach(eventName => {
        window.addEventListener(eventName, cleanDOM, true);
        document.addEventListener(eventName, cleanDOM, true);
    });
    
    // Strategy 4: Animation frame monitoring
    function animationFrameClean() {
        cleanDOM();
        requestAnimationFrame(animationFrameClean);
    }
    requestAnimationFrame(animationFrameClean);
    
    // Strategy 5: Periodic deep clean
    setInterval(() => {
        console.log('🔥 Nuclear Fix v6: Deep clean cycle');
        // Force re-check everything
        destroyedSelectors.clear();
        cleanDOM();
    }, 5000); // Every 5 seconds
    
    console.log('✅ Nuclear Fix v6.0 fully armed and operational');
})();