// ULTIMATE NUCLEAR FIX - This WILL work
(function() {
    'use strict';
    
    console.log('🚀 ULTIMATE NUCLEAR FIX ACTIVATED');
    
    // Nuclear option - remove EVERYTHING and rebuild
    function nukeAndRebuild() {
        // Find ALL elements in header that shouldn't be there
        const headerRight = document.querySelector('.header-right, .user-menu');
        if (headerRight) {
            // Get all children
            const children = Array.from(headerRight.children);
            children.forEach(child => {
                // Remove EVERYTHING except login button
                if (!child.classList.contains('login-btn')) {
                    child.remove();
                }
            });
            
            // Also check text nodes
            const walker = document.createTreeWalker(
                headerRight,
                NodeFilter.SHOW_ALL,
                null,
                false
            );
            
            const nodesToRemove = [];
            let node;
            while (node = walker.nextNode()) {
                if (node.nodeType === Node.TEXT_NODE) {
                    const text = node.textContent.trim();
                    if (text && (text.includes('English') || text.includes('🌐') || 
                        text.includes('Online') || text.includes('Help') || text === '?')) {
                        nodesToRemove.push(node);
                    }
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                    const text = node.textContent.trim();
                    if (text === 'English' || text === '🌐 English ▼' || text === 'Online' || 
                        text === 'Help' || text === '?' || text === '🌐') {
                        nodesToRemove.push(node);
                    }
                }
            }
            
            // Remove all bad nodes
            nodesToRemove.forEach(node => {
                if (node.parentNode) {
                    node.parentNode.removeChild(node);
                }
            });
            
            // If no login button exists, create one
            if (!headerRight.querySelector('.login-btn')) {
                headerRight.innerHTML = ''; // Clear everything
                const loginBtn = document.createElement('button');
                loginBtn.className = 'login-btn';
                loginBtn.style.cssText = `
                    padding: 12px 24px;
                    background: #ff6b35;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: bold;
                    font-size: 16px;
                    transition: all 0.3s;
                `;
                loginBtn.textContent = 'Login';
                loginBtn.onmouseover = () => loginBtn.style.background = '#e55a2b';
                loginBtn.onmouseout = () => loginBtn.style.background = '#ff6b35';
                loginBtn.onclick = () => window.location.href = '/login.html';
                headerRight.appendChild(loginBtn);
            }
        }
        
        // Also nuke any floating elements
        document.querySelectorAll('*').forEach(el => {
            if (el.textContent === '🌐 English ▼' || el.textContent === '? Help') {
                el.remove();
            }
        });
    }
    
    // Run immediately
    nukeAndRebuild();
    
    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', nukeAndRebuild);
    }
    
    // Run multiple times to catch everything
    const intervals = [100, 200, 500, 1000, 2000, 3000, 5000];
    intervals.forEach(interval => {
        setTimeout(nukeAndRebuild, interval);
    });
    
    // Watch for any new additions
    const observer = new MutationObserver(() => {
        nukeAndRebuild();
    });
    
    // Start observing when body is available
    function startObserving() {
        if (document.body) {
            observer.observe(document.body, {
                childList: true,
                subtree: true,
                characterData: true
            });
        } else {
            setTimeout(startObserving, 100);
        }
    }
    
    startObserving();
    
    // Also intercept any dynamic additions
    const originalAppendChild = Element.prototype.appendChild;
    Element.prototype.appendChild = function(child) {
        const result = originalAppendChild.call(this, child);
        if (child.textContent && (child.textContent.includes('English') || 
            child.textContent.includes('🌐') || child.textContent.includes('Help'))) {
            setTimeout(() => nukeAndRebuild(), 10);
        }
        return result;
    };
})();