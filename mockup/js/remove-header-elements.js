// Aggressive removal of header elements
(function() {
    'use strict';

    function removeHeaderElements() {
        // Get header area
        const header = document.querySelector('header');
        if (!header) return;

        // Find all elements in header
        const allElements = header.querySelectorAll('*');
        
        allElements.forEach(element => {
            const text = element.textContent || '';
            const innerHTML = element.innerHTML || '';
            
            // Remove if contains these patterns
            if (text.includes('🌐') || 
                text.includes('English') || 
                text.includes('Online') || 
                text.includes('Help') ||
                text.includes('?') ||
                innerHTML.includes('🌐') ||
                innerHTML.includes('English') ||
                innerHTML.includes('Online') ||
                innerHTML.includes('Help')) {
                
                // If it's a direct text node, remove parent
                if (element.childNodes.length === 1 && element.childNodes[0].nodeType === 3) {
                    element.remove();
                }
            }
        });

        // Clean up header-right area
        const headerRight = document.querySelector('.header-right, .user-menu');
        if (headerRight) {
            // Remove all children first
            while (headerRight.firstChild) {
                headerRight.removeChild(headerRight.firstChild);
            }
            
            // Add login button
            const loginBtn = document.createElement('button');
            loginBtn.className = 'login-btn primary';
            loginBtn.innerHTML = '<i class="fas fa-user"></i> Login';
            loginBtn.style.padding = '8px 16px';
            loginBtn.style.backgroundColor = '#ff6b35';
            loginBtn.style.color = 'white';
            loginBtn.style.border = 'none';
            loginBtn.style.borderRadius = '4px';
            loginBtn.style.cursor = 'pointer';
            loginBtn.onclick = () => window.location.href = '/login.html';
            
            headerRight.appendChild(loginBtn);
        }
    }

    // Run multiple times to catch dynamic content
    document.addEventListener('DOMContentLoaded', removeHeaderElements);
    setTimeout(removeHeaderElements, 100);
    setTimeout(removeHeaderElements, 500);
    setTimeout(removeHeaderElements, 1000);
    
    // Also run immediately
    removeHeaderElements();
})();