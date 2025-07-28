// Header UI Fix - Remove unwanted elements and add login
(function() {
    'use strict';

    // Remove these elements from header
    function removeUnwantedElements() {
        // Remove language selector
        const langSelectors = document.querySelectorAll('[class*="language"], [class*="lang"], .globe-icon, [data-lang]');
        langSelectors.forEach(el => el.remove());
        
        // Remove online indicator
        const onlineIndicators = document.querySelectorAll('[class*="online"], [class*="status"], .connection-status');
        onlineIndicators.forEach(el => el.remove());
        
        // Remove help button
        const helpButtons = document.querySelectorAll('[class*="help"], .help-btn, [data-help]');
        helpButtons.forEach(el => el.remove());
        
        // Remove any text nodes containing these
        const headerRight = document.querySelector('.header-right, .user-menu');
        if (headerRight) {
            // Clear all content first
            headerRight.innerHTML = '';
            
            // Add login button
            const loginBtn = document.createElement('button');
            loginBtn.className = 'login-btn';
            loginBtn.textContent = 'Login';
            loginBtn.onclick = () => window.location.href = '/login.html';
            headerRight.appendChild(loginBtn);
        }
    }

    // Run on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', removeUnwantedElements);
    } else {
        removeUnwantedElements();
    }

    // Also run after a delay to catch dynamically added elements
    setTimeout(removeUnwantedElements, 100);
    setTimeout(removeUnwantedElements, 500);
})();