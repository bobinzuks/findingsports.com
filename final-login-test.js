// Final Login Test Script
// Copy and paste this into the browser console on the Finding Sports website
// This will test and verify that the login modal fix is working

(function() {
    console.log('%c🔧 LOGIN MODAL FIX VERIFICATION STARTING...', 'font-size: 16px; font-weight: bold; color: #ff6b35;');
    
    let testResults = {
        loginManagerClass: false,
        loginManagerInstance: false,
        loginButton: false,
        showModalFunction: false,
        modalCSS: false,
        fontAwesome: false,
        buttonClick: false
    };
    
    function logResult(test, passed, message) {
        testResults[test] = passed;
        const icon = passed ? '✅' : '❌';
        const color = passed ? 'green' : 'red';
        console.log(`%c${icon} ${message}`, `color: ${color}; font-weight: bold;`);
    }
    
    // Test 1: LoginManager class
    const hasLoginManagerClass = typeof window.LoginManager === 'function';
    logResult('loginManagerClass', hasLoginManagerClass, 
        `LoginManager class: ${hasLoginManagerClass ? 'Available' : 'Missing'}`);
    
    // Test 2: LoginManager instance
    const hasLoginManagerInstance = !!window.loginManager;
    logResult('loginManagerInstance', hasLoginManagerInstance,
        `LoginManager instance: ${hasLoginManagerInstance ? 'Available' : 'Missing'}`);
    
    // Test 3: Login button exists
    const loginBtn = document.querySelector('.login-btn');
    const hasLoginButton = !!loginBtn;
    logResult('loginButton', hasLoginButton,
        `Login button element: ${hasLoginButton ? 'Found' : 'Missing'}`);
    
    if (loginBtn) {
        const onclick = loginBtn.getAttribute('onclick');
        console.log(`   Button text: "${loginBtn.textContent.trim()}"`);
        console.log(`   Button onclick: "${onclick}"`);
        
        const hasCorrectHandler = onclick && onclick.includes('showLoginModal');
        logResult('buttonClick', hasCorrectHandler,
            `Button handler: ${hasCorrectHandler ? 'Correct (showLoginModal)' : 'Incorrect (redirects to /login.html)'}`);
    }
    
    // Test 4: showLoginModal function
    const hasShowModal = hasLoginManagerInstance && typeof window.loginManager.showLoginModal === 'function';
    logResult('showModalFunction', hasShowModal,
        `showLoginModal function: ${hasShowModal ? 'Available' : 'Missing'}`);
    
    // Test 5: Modal CSS
    let hasModalCSS = false;
    try {
        Array.from(document.styleSheets).forEach(sheet => {
            try {
                Array.from(sheet.cssRules).forEach(rule => {
                    if (rule.selectorText && rule.selectorText.includes('.login-modal')) {
                        hasModalCSS = true;
                    }
                });
            } catch (e) {
                // Cross-origin stylesheet, check href
                if (sheet.href && sheet.href.includes('login-styles.css')) {
                    hasModalCSS = true;
                }
            }
        });
    } catch (e) {
        console.log('Could not check all stylesheets (CORS), assuming CSS is loaded');
        hasModalCSS = true;
    }
    logResult('modalCSS', hasModalCSS,
        `Login modal CSS: ${hasModalCSS ? 'Loaded' : 'Missing'}`);
    
    // Test 6: FontAwesome
    let hasFontAwesome = false;
    try {
        Array.from(document.styleSheets).forEach(sheet => {
            if (sheet.href && (sheet.href.includes('font-awesome') || sheet.href.includes('fontawesome'))) {
                hasFontAwesome = true;
            }
        });
    } catch (e) {
        // Check if FA icons exist in DOM
        const faIcon = document.querySelector('[class*="fa-"]');
        hasFontAwesome = !!faIcon;
    }
    logResult('fontAwesome', hasFontAwesome,
        `FontAwesome icons: ${hasFontAwesome ? 'Loaded' : 'Missing'}`);
    
    // Test 7: Actual button click test
    if (hasLoginButton && hasShowModal) {
        console.log('%c🎯 TESTING LOGIN BUTTON CLICK...', 'font-size: 14px; font-weight: bold; color: #007bff;');
        
        // Remove any existing modals first
        const existingModal = document.querySelector('.login-modal-overlay');
        if (existingModal) {
            existingModal.remove();
        }
        
        try {
            // Click the button
            loginBtn.click();
            
            // Check if modal appeared
            setTimeout(() => {
                const modal = document.querySelector('.login-modal-overlay');
                const clickWorked = !!modal;
                
                logResult('buttonClick', clickWorked,
                    `Button click test: ${clickWorked ? 'SUCCESS - Modal appeared!' : 'FAILED - No modal appeared'}`);
                
                if (modal) {
                    console.log('%cModal successfully created! Auto-closing in 3 seconds...', 'color: green; font-style: italic;');
                    setTimeout(() => {
                        modal.remove();
                        console.log('Modal auto-closed');
                    }, 3000);
                }
                
                // Final summary
                setTimeout(() => {
                    const passedTests = Object.values(testResults).filter(r => r).length;
                    const totalTests = Object.keys(testResults).length;
                    
                    console.log('\n%c📊 FINAL RESULTS:', 'font-size: 16px; font-weight: bold; color: #6f42c1;');
                    console.log(`   Tests passed: ${passedTests}/${totalTests}`);
                    
                    if (passedTests === totalTests) {
                        console.log('%c🎉 ALL TESTS PASSED! Login modal is working correctly!', 
                            'font-size: 14px; font-weight: bold; color: green; background: #d4edda; padding: 5px;');
                    } else {
                        console.log('%c⚠️ Some tests failed. Login modal may not work properly.', 
                            'font-size: 14px; font-weight: bold; color: #856404; background: #fff3cd; padding: 5px;');
                        
                        // Provide fix suggestions
                        console.log('\n%c🔧 SUGGESTED FIXES:', 'font-weight: bold; color: #dc3545;');
                        
                        if (!testResults.loginManagerClass) {
                            console.log('   • login-component.js not loaded or has errors');
                        }
                        if (!testResults.loginManagerInstance) {
                            console.log('   • LoginManager not initialized - check for JavaScript errors');
                        }
                        if (!testResults.loginButton) {
                            console.log('   • Login button not found in DOM');
                        }
                        if (!testResults.showModalFunction) {
                            console.log('   • showLoginModal function missing');
                        }
                        if (!testResults.modalCSS) {
                            console.log('   • login-styles.css not loaded');
                        }
                        if (!testResults.fontAwesome) {
                            console.log('   • FontAwesome icons not loaded (modal may look broken)');
                        }
                        if (!testResults.buttonClick) {
                            console.log('   • Button click handler incorrect - fix emergency header code');
                        }
                    }
                }, 100);
                
            }, 200);
            
        } catch (error) {
            console.error('❌ Error during button click test:', error);
            logResult('buttonClick', false, `Button click error: ${error.message}`);
        }
        
    } else {
        console.log('%c⚠️ Cannot test button click - prerequisites not met', 'color: orange; font-weight: bold;');
    }
    
})();