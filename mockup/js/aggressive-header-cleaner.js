// Aggressive Header Cleaner - Nuclear Option
// This will forcefully remove any unwanted elements

(function() {
    'use strict';
    
    // List of text patterns to remove
    const BANNED_TEXTS = ['Online', 'Help', '?', 'English', '🌐', 'Trip'];
    
    // List of class patterns to remove
    const BANNED_CLASSES = [
        'online', 'help', 'language', 'lang', 'trip', 
        'status', 'indicator', 'globe', 'question'
    ];
    
    function nukeElements() {
        // Method 1: Remove by text content
        const allElements = document.querySelectorAll('*');
        allElements.forEach(el => {
            // Skip script and style tags
            if (el.tagName === 'SCRIPT' || el.tagName === 'STYLE') return;
            
            // Check text content
            const text = el.textContent.trim();
            for (const banned of BANNED_TEXTS) {
                if (text === banned || (text.length < 20 && text.includes(banned))) {
                    console.log('Removing element with text:', text);
                    el.remove();
                    return;
                }
            }
            
            // Check classes
            if (el.classList) {
                const classes = Array.from(el.classList);
                for (const cls of classes) {
                    for (const banned of BANNED_CLASSES) {
                        if (cls.toLowerCase().includes(banned)) {
                            console.log('Removing element with class:', cls);
                            el.remove();
                            return;
                        }
                    }
                }
            }
        });
        
        // Method 2: Clean header specifically
        const headers = document.querySelectorAll('header, .header, .header-right, .user-menu');
        headers.forEach(header => {
            // Remove all children that aren't login button
            const children = Array.from(header.children);
            children.forEach(child => {
                const text = child.textContent.toLowerCase();
                if (!text.includes('login') && !text.includes('sign') && 
                    !child.classList.contains('logo-section')) {
                    child.remove();
                }
            });
        });
        
        // Method 3: Ensure login button exists
        const headerRight = document.querySelector('.header-right, .user-menu');
        if (headerRight && !headerRight.querySelector('.login-btn')) {
            // Clear it completely
            headerRight.innerHTML = '';
            
            // Add login button
            const loginBtn = document.createElement('button');
            loginBtn.className = 'login-btn';
            loginBtn.style.cssText = `
                padding: 10px 20px;
                background: #ff6b35;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-weight: bold;
                font-size: 16px;
            `;
            loginBtn.textContent = 'Login';
            loginBtn.onclick = () => window.location.href = '/login.html';
            
            headerRight.appendChild(loginBtn);
        }
    }
    
    // Run aggressively
    nukeElements();
    
    // Keep running to catch dynamic content
    const observer = new MutationObserver(() => {
        nukeElements();
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
    });
    
    // Also run on intervals
    setInterval(nukeElements, 1000);
})();