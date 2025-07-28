// Ultimate Language Element Remover - The Nuclear Option
// This script uses EVERY possible method to remove and prevent language elements

(function() {
    'use strict';
    
    console.log('[ULTIMATE REMOVER] Initializing nuclear language removal...');
    
    // Configuration
    const SELECTORS = [
        // Primary targets
        '[data-testid="LanguageSelector"]',
        '.language-selector',
        '.lang-selector',
        '.language-dropdown',
        '.language-switcher',
        '.language-picker',
        '.locale-selector',
        '.i18n-selector',
        
        // Common class patterns
        '[class*="language"]',
        '[class*="Language"]',
        '[class*="lang-"]',
        '[class*="Lang"]',
        '[class*="locale"]',
        '[class*="Locale"]',
        '[class*="i18n"]',
        '[class*="translation"]',
        
        // ID patterns
        '[id*="language"]',
        '[id*="Language"]',
        '[id*="lang"]',
        '[id*="locale"]',
        
        // Aria and data attributes
        '[aria-label*="language" i]',
        '[aria-label*="Language" i]',
        '[data-language]',
        '[data-locale]',
        '[data-i18n]',
        
        // Specific UI elements
        'select[name*="lang"]',
        'select[name*="locale"]',
        'button:has(svg[class*="globe"])',
        'button:has(svg[class*="world"])',
        'button:has(svg[class*="language"])',
        
        // Text content matching
        'button:contains("Language")',
        'button:contains("语言")',
        'button:contains("Idioma")',
        'button:contains("Langue")',
        'span:contains("Language")',
        'div:contains("Select language")',
        
        // Parent containers
        'div:has(> [data-testid="LanguageSelector"])',
        'div:has(> .language-selector)',
        'nav:has(.language-selector)',
        'header:has(.language-selector)',
        
        // Shadow DOM and custom elements
        'language-selector',
        'lang-picker',
        'locale-switcher'
    ];
    
    // Network patterns to block
    const BLOCKED_PATTERNS = [
        /language/i,
        /locale/i,
        /i18n/i,
        /translation/i,
        /lang\//i,
        /\/api\/.*lang/i,
        /\/api\/.*locale/i
    ];
    
    // Store original methods
    const originals = {
        createElement: document.createElement,
        createElementNS: document.createElementNS,
        cloneNode: Node.prototype.cloneNode,
        appendChild: Node.prototype.appendChild,
        insertBefore: Node.prototype.insertBefore,
        replaceChild: Node.prototype.replaceChild,
        setAttribute: Element.prototype.setAttribute,
        setAttributeNS: Element.prototype.setAttributeNS,
        innerHTML: Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML'),
        outerHTML: Object.getOwnPropertyDescriptor(Element.prototype, 'outerHTML'),
        insertAdjacentHTML: Element.prototype.insertAdjacentHTML,
        insertAdjacentElement: Element.prototype.insertAdjacentElement,
        XMLHttpRequest: window.XMLHttpRequest,
        fetch: window.fetch,
        setTimeout: window.setTimeout,
        setInterval: window.setInterval,
        requestAnimationFrame: window.requestAnimationFrame
    };
    
    // Helper to check if element should be blocked
    function shouldBlock(element) {
        if (!element) return false;
        
        // Check element itself
        const tag = element.tagName?.toLowerCase() || '';
        const className = element.className?.toString() || '';
        const id = element.id || '';
        const dataTestId = element.getAttribute?.('data-testid') || '';
        const ariaLabel = element.getAttribute?.('aria-label') || '';
        const textContent = element.textContent || '';
        
        // Check against all patterns
        const patterns = [tag, className, id, dataTestId, ariaLabel, textContent];
        for (const pattern of patterns) {
            if (/language|lang|locale|i18n|translation/i.test(pattern)) {
                return true;
            }
        }
        
        // Check if matches any selector
        try {
            for (const selector of SELECTORS) {
                if (element.matches && element.matches(selector)) {
                    return true;
                }
            }
        } catch (e) {
            // Some selectors might not be valid in all contexts
        }
        
        return false;
    }
    
    // Nuclear removal function
    function nukeElement(element) {
        if (!element || !element.parentNode) return;
        
        console.log('[ULTIMATE REMOVER] Nuking element:', element);
        
        try {
            // Method 1: Direct removal
            element.remove();
        } catch (e) {}
        
        try {
            // Method 2: Parent removal
            element.parentNode.removeChild(element);
        } catch (e) {}
        
        try {
            // Method 3: Replace with empty text node
            element.parentNode.replaceChild(document.createTextNode(''), element);
        } catch (e) {}
        
        try {
            // Method 4: Set display none with maximum priority
            element.style.setProperty('display', 'none', 'important');
            element.style.setProperty('visibility', 'hidden', 'important');
            element.style.setProperty('opacity', '0', 'important');
            element.style.setProperty('position', 'absolute', 'important');
            element.style.setProperty('left', '-9999px', 'important');
            element.style.setProperty('top', '-9999px', 'important');
            element.style.setProperty('width', '0', 'important');
            element.style.setProperty('height', '0', 'important');
            element.style.setProperty('overflow', 'hidden', 'important');
            element.style.setProperty('clip', 'rect(0,0,0,0)', 'important');
            element.style.setProperty('pointer-events', 'none', 'important');
            element.style.setProperty('z-index', '-9999', 'important');
        } catch (e) {}
        
        try {
            // Method 5: Clear all content
            element.innerHTML = '';
            element.textContent = '';
        } catch (e) {}
        
        try {
            // Method 6: Remove all attributes
            while (element.attributes && element.attributes.length > 0) {
                element.removeAttribute(element.attributes[0].name);
            }
        } catch (e) {}
        
        try {
            // Method 7: Disconnect from DOM events
            const newElement = element.cloneNode(false);
            element.parentNode.replaceChild(newElement, element);
        } catch (e) {}
    }
    
    // Override createElement
    document.createElement = function(tagName) {
        const element = originals.createElement.call(this, tagName);
        
        // Proxy the element to intercept property sets
        return new Proxy(element, {
            set(target, prop, value) {
                target[prop] = value;
                
                // Check after property is set
                if (shouldBlock(target)) {
                    console.log('[ULTIMATE REMOVER] Blocked createElement:', tagName, prop, value);
                    nukeElement(target);
                }
                
                return true;
            }
        });
    };
    
    // Override createElementNS
    document.createElementNS = function(namespaceURI, qualifiedName) {
        const element = originals.createElementNS.call(this, namespaceURI, qualifiedName);
        
        if (shouldBlock(element)) {
            console.log('[ULTIMATE REMOVER] Blocked createElementNS:', qualifiedName);
            return document.createTextNode('');
        }
        
        return element;
    };
    
    // Override cloneNode
    Node.prototype.cloneNode = function(deep) {
        const clone = originals.cloneNode.call(this, deep);
        
        if (shouldBlock(clone)) {
            console.log('[ULTIMATE REMOVER] Blocked cloneNode');
            return document.createTextNode('');
        }
        
        return clone;
    };
    
    // Override appendChild
    Node.prototype.appendChild = function(child) {
        if (shouldBlock(child)) {
            console.log('[ULTIMATE REMOVER] Blocked appendChild');
            return child;
        }
        
        return originals.appendChild.call(this, child);
    };
    
    // Override insertBefore
    Node.prototype.insertBefore = function(newNode, referenceNode) {
        if (shouldBlock(newNode)) {
            console.log('[ULTIMATE REMOVER] Blocked insertBefore');
            return newNode;
        }
        
        return originals.insertBefore.call(this, newNode, referenceNode);
    };
    
    // Override replaceChild
    Node.prototype.replaceChild = function(newChild, oldChild) {
        if (shouldBlock(newChild)) {
            console.log('[ULTIMATE REMOVER] Blocked replaceChild');
            return oldChild;
        }
        
        return originals.replaceChild.call(this, newChild, oldChild);
    };
    
    // Override setAttribute
    Element.prototype.setAttribute = function(name, value) {
        originals.setAttribute.call(this, name, value);
        
        if (shouldBlock(this)) {
            console.log('[ULTIMATE REMOVER] Element became language-related after setAttribute');
            nukeElement(this);
        }
    };
    
    // Override innerHTML
    Object.defineProperty(Element.prototype, 'innerHTML', {
        set: function(value) {
            originals.innerHTML.set.call(this, value);
            
            // Check all children
            setTimeout(() => {
                scanAndDestroy(this);
            }, 0);
        },
        get: originals.innerHTML.get
    });
    
    // Override outerHTML
    Object.defineProperty(Element.prototype, 'outerHTML', {
        set: function(value) {
            if (/language|lang|locale|i18n/i.test(value)) {
                console.log('[ULTIMATE REMOVER] Blocked outerHTML with language content');
                return;
            }
            
            originals.outerHTML.set.call(this, value);
        },
        get: originals.outerHTML.get
    });
    
    // Override insertAdjacentHTML
    Element.prototype.insertAdjacentHTML = function(position, text) {
        if (/language|lang|locale|i18n/i.test(text)) {
            console.log('[ULTIMATE REMOVER] Blocked insertAdjacentHTML with language content');
            return;
        }
        
        originals.insertAdjacentHTML.call(this, position, text);
        
        // Scan parent for new elements
        setTimeout(() => {
            scanAndDestroy(this.parentElement);
        }, 0);
    };
    
    // Override XMLHttpRequest
    window.XMLHttpRequest = function() {
        const xhr = new originals.XMLHttpRequest();
        
        const originalOpen = xhr.open;
        xhr.open = function(method, url, ...args) {
            if (BLOCKED_PATTERNS.some(pattern => pattern.test(url))) {
                console.log('[ULTIMATE REMOVER] Blocked XHR request:', url);
                throw new Error('Blocked by Ultimate Remover');
            }
            
            return originalOpen.call(this, method, url, ...args);
        };
        
        return xhr;
    };
    
    // Override fetch
    window.fetch = function(url, ...args) {
        if (typeof url === 'string' && BLOCKED_PATTERNS.some(pattern => pattern.test(url))) {
            console.log('[ULTIMATE REMOVER] Blocked fetch request:', url);
            return Promise.reject(new Error('Blocked by Ultimate Remover'));
        }
        
        return originals.fetch.call(this, url, ...args);
    };
    
    // Clear all timers that might recreate elements
    function clearAllTimers() {
        // Clear timeouts
        for (let i = 1; i < 10000; i++) {
            clearTimeout(i);
            clearInterval(i);
        }
    }
    
    // Override setTimeout to prevent recreation
    window.setTimeout = function(fn, delay, ...args) {
        const wrappedFn = function() {
            const result = fn.apply(this, args);
            // Scan after timeout executes
            requestAnimationFrame(() => scanAndDestroy());
            return result;
        };
        
        return originals.setTimeout.call(this, wrappedFn, delay);
    };
    
    // Override setInterval to prevent recreation
    window.setInterval = function(fn, delay, ...args) {
        const wrappedFn = function() {
            const result = fn.apply(this, args);
            // Scan after interval executes
            requestAnimationFrame(() => scanAndDestroy());
            return result;
        };
        
        return originals.setInterval.call(this, wrappedFn, delay);
    };
    
    // Main scanning function
    function scanAndDestroy(root = document.body) {
        if (!root) return;
        
        // Use every possible selector
        SELECTORS.forEach(selector => {
            try {
                const elements = root.querySelectorAll(selector);
                elements.forEach(nukeElement);
            } catch (e) {
                // Some selectors might fail
            }
        });
        
        // Also scan all elements for text content
        const allElements = root.getElementsByTagName('*');
        for (let i = allElements.length - 1; i >= 0; i--) {
            const element = allElements[i];
            if (shouldBlock(element)) {
                nukeElement(element);
            }
        }
        
        // Scan shadow DOMs
        const elementsWithShadow = root.querySelectorAll('*');
        elementsWithShadow.forEach(element => {
            if (element.shadowRoot) {
                scanAndDestroy(element.shadowRoot);
            }
        });
    }
    
    // Inject CSS to hide elements
    function injectNuclearCSS() {
        const style = document.createElement('style');
        style.textContent = `
            /* Nuclear CSS - Hide everything language-related */
            ${SELECTORS.join(',\n')} {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                position: absolute !important;
                left: -9999px !important;
                top: -9999px !important;
                width: 0 !important;
                height: 0 !important;
                max-width: 0 !important;
                max-height: 0 !important;
                overflow: hidden !important;
                clip: rect(0,0,0,0) !important;
                pointer-events: none !important;
                z-index: -9999 !important;
                transform: scale(0) !important;
                margin: 0 !important;
                padding: 0 !important;
                border: 0 !important;
            }
            
            /* Hide ::before and ::after pseudo-elements */
            ${SELECTORS.map(s => s + '::before, ' + s + '::after').join(',\n')} {
                display: none !important;
                content: '' !important;
            }
            
            /* Hide any element containing language-related text */
            *:has-text(/language|Language|语言|Idioma|Langue/i) {
                display: none !important;
            }
        `;
        
        // Add to both head and body
        document.head.appendChild(style);
        document.body.appendChild(style.cloneNode(true));
        
        // Also inject into any shadow roots
        document.querySelectorAll('*').forEach(element => {
            if (element.shadowRoot) {
                element.shadowRoot.appendChild(style.cloneNode(true));
            }
        });
    }
    
    // MutationObserver to catch any new elements
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            // Check added nodes
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1) { // Element node
                    if (shouldBlock(node)) {
                        nukeElement(node);
                    } else {
                        // Scan children
                        scanAndDestroy(node);
                    }
                }
            });
            
            // Check attribute changes
            if (mutation.type === 'attributes' && mutation.target.nodeType === 1) {
                if (shouldBlock(mutation.target)) {
                    nukeElement(mutation.target);
                }
            }
        });
    });
    
    // Hook into React if present
    function hookReact() {
        // Try to find React
        const reactRoot = document.querySelector('#root') || document.querySelector('#app');
        if (!reactRoot || !reactRoot._reactRootContainer) return;
        
        try {
            // Hook into React's render cycle
            const ReactDOM = window.ReactDOM || (reactRoot._reactRootContainer && reactRoot._reactRootContainer._internalRoot);
            if (ReactDOM) {
                console.log('[ULTIMATE REMOVER] Hooking into React');
                // Additional React-specific hooks would go here
            }
        } catch (e) {
            console.log('[ULTIMATE REMOVER] Could not hook React:', e);
        }
    }
    
    // Hook into Vue if present
    function hookVue() {
        if (window.Vue || window.__VUE__) {
            console.log('[ULTIMATE REMOVER] Hooking into Vue');
            // Vue-specific hooks would go here
        }
    }
    
    // Hook into Angular if present
    function hookAngular() {
        if (window.angular || window.ng) {
            console.log('[ULTIMATE REMOVER] Hooking into Angular');
            // Angular-specific hooks would go here
        }
    }
    
    // Continuous monitoring with requestAnimationFrame
    let frameCount = 0;
    function continuousMonitor() {
        frameCount++;
        
        // Full scan every 60 frames (~1 second at 60fps)
        if (frameCount % 60 === 0) {
            scanAndDestroy();
            injectNuclearCSS(); // Re-inject CSS in case it was removed
        }
        
        // Quick scan every 10 frames
        if (frameCount % 10 === 0) {
            // Just check for specific elements
            document.querySelectorAll('[data-testid="LanguageSelector"], .language-selector').forEach(nukeElement);
        }
        
        originals.requestAnimationFrame(continuousMonitor);
    }
    
    // Initialize everything
    function initialize() {
        console.log('[ULTIMATE REMOVER] Starting nuclear initialization...');
        
        // Clear any existing timers
        clearAllTimers();
        
        // Initial scan and destroy
        scanAndDestroy();
        
        // Inject nuclear CSS
        injectNuclearCSS();
        
        // Start observer
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'id', 'data-testid', 'aria-label', 'style']
        });
        
        // Hook into frameworks
        hookReact();
        hookVue();
        hookAngular();
        
        // Start continuous monitoring
        continuousMonitor();
        
        // Re-scan periodically
        setInterval(() => {
            scanAndDestroy();
            injectNuclearCSS();
        }, 1000);
        
        console.log('[ULTIMATE REMOVER] Nuclear removal active!');
    }
    
    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
    // Also reinitialize on various events
    window.addEventListener('load', initialize);
    window.addEventListener('pageshow', initialize);
    window.addEventListener('popstate', initialize);
    window.addEventListener('hashchange', initialize);
    
    // Expose for debugging
    window.__ultimateRemover = {
        scan: scanAndDestroy,
        nuke: nukeElement,
        clearTimers: clearAllTimers,
        selectors: SELECTORS
    };
    
})();