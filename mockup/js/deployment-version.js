// DEPLOYMENT VERSION INDICATOR
// This file proves the deployment is current and not cached
(function() {
    'use strict';
    
    // Unique deployment identifier
    const DEPLOYMENT_VERSION = {
        hash: 'DEPLOY_2025-08-17T20:41:00Z',
        timestamp: '2025-08-17T20:41:00Z',
        commit: 'white-screen-fix-complete',
        features: [
            'template-tags-removed',
            'js-files-serving-correctly',
            'incognito-mode-compatible',
            'no-language-selector',
            'no-help-button'
        ]
    };
    
    // Store in window for easy access
    window.DEPLOYMENT_VERSION = DEPLOYMENT_VERSION;
    
    // Add visible indicator to page
    function addVersionIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'deployment-version-indicator';
        indicator.style.cssText = `
            position: fixed;
            bottom: 5px;
            right: 5px;
            background: rgba(0, 128, 0, 0.9);
            color: white;
            padding: 5px 10px;
            border-radius: 5px;
            font-family: monospace;
            font-size: 10px;
            z-index: 999999;
            cursor: pointer;
        `;
        indicator.innerHTML = `v:${DEPLOYMENT_VERSION.hash}`;
        indicator.title = `Deployment: ${DEPLOYMENT_VERSION.timestamp}\nClick to see details`;
        
        indicator.onclick = function() {
            console.log('🚀 DEPLOYMENT VERSION:', DEPLOYMENT_VERSION);
            alert(`Finding Sports Deployment\n\nVersion: ${DEPLOYMENT_VERSION.hash}\nTime: ${DEPLOYMENT_VERSION.timestamp}\nFeatures: ${DEPLOYMENT_VERSION.features.join(', ')}`);
        };
        
        document.body.appendChild(indicator);
    }
    
    // Add indicator when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addVersionIndicator);
    } else {
        addVersionIndicator();
    }
    
    // Log version to console
    console.log('✅ DEPLOYMENT VERSION:', DEPLOYMENT_VERSION.hash);
    console.log('📅 Deployed at:', DEPLOYMENT_VERSION.timestamp);
    console.log('🎯 This proves the site is updated and not cached!');
})();