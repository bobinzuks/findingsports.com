// Test script to verify login button functionality
// Run this in browser console on the Finding Sports site

console.log('=== LOGIN BUTTON FIX VERIFICATION ===');

// Check if LoginManager is available
console.log('1. LoginManager availability:');
console.log('   window.LoginManager:', typeof window.LoginManager);
console.log('   window.loginManager:', typeof window.loginManager);

// Check if login button exists
console.log('\n2. Login button elements:');
const headerRight = document.querySelector('.header-right');
const loginBtn = document.querySelector('.login-btn');
const authSection = document.querySelector('.auth-section');

console.log('   .header-right:', headerRight ? 'found' : 'not found');
console.log('   .login-btn:', loginBtn ? 'found' : 'not found');
console.log('   .auth-section:', authSection ? 'found' : 'not found');

if (loginBtn) {
    console.log('   Login button onclick:', loginBtn.getAttribute('onclick'));
    console.log('   Login button text:', loginBtn.textContent.trim());
}

// Check if showLoginModal function exists
console.log('\n3. Modal function availability:');
if (window.loginManager) {
    console.log('   showLoginModal:', typeof window.loginManager.showLoginModal);
    console.log('   LoginManager isLoggedIn:', window.loginManager.isLoggedIn);
} else {
    console.log('   LoginManager not available');
}

// Test clicking the login button
console.log('\n4. Testing login button click:');
if (loginBtn) {
    try {
        // Create a test click event
        console.log('   Simulating click...');
        loginBtn.click();
        
        // Check if modal appeared
        setTimeout(() => {
            const modal = document.querySelector('.login-modal-overlay');
            console.log('   Modal after click:', modal ? 'appeared' : 'not found');
            
            if (modal) {
                console.log('   ✅ LOGIN BUTTON WORKS! Modal appeared successfully');
                // Close the modal
                modal.remove();
            } else {
                console.log('   ❌ LOGIN BUTTON FAILED - No modal appeared');
            }
        }, 100);
        
    } catch (error) {
        console.log('   ❌ Error clicking login button:', error.message);
    }
} else {
    console.log('   ❌ No login button found to test');
}

// Summary
console.log('\n=== SUMMARY ===');
const hasLoginManager = !!window.loginManager;
const hasLoginButton = !!loginBtn;
const hasShowModal = hasLoginManager && typeof window.loginManager.showLoginModal === 'function';

if (hasLoginManager && hasLoginButton && hasShowModal) {
    console.log('✅ All components available - login should work');
} else {
    console.log('❌ Missing components:');
    if (!hasLoginManager) console.log('   - LoginManager instance');
    if (!hasLoginButton) console.log('   - Login button element');
    if (!hasShowModal) console.log('   - showLoginModal function');
}