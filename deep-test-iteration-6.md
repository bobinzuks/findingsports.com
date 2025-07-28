# Deep Test Iteration 6: Login System Investigation

## Key Finding:
Login appears to use a modal popup, not a separate page!

## Evidence:
1. Login button calls `loginManager.showLoginModal()`
2. /login.html request times out
3. This suggests login is handled in-page via modal

## Need to verify:
- Is there a login modal in the main page?
- Are demo credentials hardcoded?
- Does admin functionality exist?