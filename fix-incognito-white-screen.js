// Fix for Incognito White Screen Issue
// This script removes overly aggressive CSS rules that might hide legitimate content

(function() {
    'use strict';
    
    console.log('🔧 Applying Incognito white screen fix...');
    
    // Function to fix aggressive CSS rules
    function fixAggressiveCSS() {
        // Find all style elements
        const styles = document.querySelectorAll('style');
        
        styles.forEach(style => {
            let css = style.innerHTML;
            const originalCSS = css;
            
            // Remove overly broad selectors that might hide legitimate content
            // Keep specific language/help selectors but remove generic ones
            css = css.replace(/\[data-i18n\][^{]*{[^}]*display:\s*none[^}]*}/gi, '');
            css = css.replace(/\[aria-label\*="language"[^\]]*\][^{]*{[^}]*display:\s*none[^}]*}/gi, '');
            css = css.replace(/\[aria-label\*="help"[^\]]*\][^{]*{[^}]*display:\s*none[^}]*}/gi, '');
            
            // Only update if changes were made
            if (css !== originalCSS) {
                style.innerHTML = css;
                console.log('✅ Fixed aggressive CSS rules');
            }
        });
        
        // Ensure body is visible
        document.body.style.display = '';
        document.body.style.visibility = '';
        document.body.style.opacity = '';
        
        // Ensure main content containers are visible
        const containers = ['#app', '#root', '#main', '.main-content', '[role="main"]'];
        containers.forEach(selector => {
            const el = document.querySelector(selector);
            if (el) {
                el.style.display = '';
                el.style.visibility = '';
                el.style.opacity = '';
            }
        });
    }
    
    // Apply fix on DOM ready and after delays
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fixAggressiveCSS);
    } else {
        fixAggressiveCSS();
    }
    
    // Reapply after delays in case nuclear fix runs later
    setTimeout(fixAggressiveCSS, 100);
    setTimeout(fixAggressiveCSS, 500);
    setTimeout(fixAggressiveCSS, 1000);
    
    console.log('✅ Incognito fix applied');
})();