#!/usr/bin/env python3
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.common.keys import Keys
import time
import json

print("🔍 AUTOMATED F12 DEVELOPER TOOLS CAPTURE")
print("========================================")
print()

# Setup Firefox with DevTools
options = Options()
options.set_preference("devtools.console.stdout.content", True)
options.set_preference("devtools.toolbox.host", "bottom")

driver = webdriver.Firefox(options=options)

try:
    # Load the site
    print("1. Loading https://findingsports.com...")
    driver.get("https://findingsports.com")
    driver.set_window_size(1280, 1024)
    time.sleep(3)
    
    # Open Developer Tools
    print("2. Opening Developer Tools...")
    driver.find_element(By.TAG_NAME, 'body').send_keys(Keys.F12)
    time.sleep(2)
    
    # Get console logs
    print("3. Capturing browser logs...")
    logs = driver.get_log('browser')
    
    # Execute JavaScript to check page state
    print("4. Analyzing page state...")
    page_state = driver.execute_script("""
        const body = document.body;
        const bodyStyle = window.getComputedStyle(body);
        
        // Find all errors in console
        const errors = [];
        
        // Check what's hidden
        const hiddenElements = [];
        document.querySelectorAll('*').forEach(el => {
            const style = window.getComputedStyle(el);
            if (style.display === 'none' && el.id) {
                hiddenElements.push({
                    id: el.id,
                    class: el.className,
                    tag: el.tagName
                });
            }
        });
        
        // Check for specific issues
        return {
            bodyDisplay: bodyStyle.display,
            bodyVisibility: bodyStyle.visibility,
            bodyOpacity: bodyStyle.opacity,
            bodyBackground: bodyStyle.backgroundColor,
            pageTitle: document.title,
            hasContent: body.children.length > 0,
            visibleText: body.innerText.substring(0, 200),
            hiddenCount: hiddenElements.length,
            hiddenElements: hiddenElements.slice(0, 5),
            hasLanguageSelector: document.body.innerHTML.includes('🌐 English'),
            hasHelpButton: document.body.innerHTML.includes('? Help'),
            nuclearFixLoaded: document.querySelector('script[src*="nuclear-fix"]') !== null,
            incognitoFixLoaded: document.querySelector('script[src*="incognito-fix"]') !== null
        };
    """)
    
    # Take screenshots
    print("5. Taking screenshots...")
    driver.save_screenshot("selenium-f12-full-page.png")
    
    # Try to get console errors via JavaScript
    console_errors = driver.execute_script("""
        // Inject error catcher
        const errors = [];
        const oldError = window.onerror;
        window.onerror = function(msg, url, line, col, error) {
            errors.push({msg, url, line, col});
            if (oldError) oldError.apply(this, arguments);
        };
        
        // Return any caught errors
        return window.__consoleErrors || [];
    """)
    
    # Generate report
    print("\n" + "="*50)
    print("📊 F12 DIAGNOSTIC REPORT")
    print("="*50)
    
    print("\n🎨 PAGE STYLING:")
    print(f"  Body Display: {page_state['bodyDisplay']}")
    print(f"  Body Visibility: {page_state['bodyVisibility']}")
    print(f"  Body Opacity: {page_state['bodyOpacity']}")
    print(f"  Background: {page_state['bodyBackground']}")
    
    print("\n📄 CONTENT STATUS:")
    print(f"  Has DOM Content: {page_state['hasContent']}")
    print(f"  Page Title: {page_state['pageTitle']}")
    print(f"  Visible Text Length: {len(page_state.get('visibleText', ''))}")
    if page_state.get('visibleText'):
        print(f"  Text Sample: {page_state['visibleText'][:50]}...")
    
    print("\n🚫 HIDDEN ELEMENTS:")
    print(f"  Total Hidden: {page_state['hiddenCount']}")
    if page_state['hiddenElements']:
        for el in page_state['hiddenElements']:
            print(f"  - <{el['tag']}> {el.get('id', '')} {el.get('class', '')}")
    
    print("\n✅ FIXES STATUS:")
    print(f"  Nuclear Fix Loaded: {'Yes' if page_state['nuclearFixLoaded'] else 'No'}")
    print(f"  Incognito Fix Loaded: {'Yes' if page_state['incognitoFixLoaded'] else 'No'}")
    print(f"  Language Selector Present: {'Yes ❌' if page_state['hasLanguageSelector'] else 'No ✅'}")
    print(f"  Help Button Present: {'Yes ❌' if page_state['hasHelpButton'] else 'No ✅'}")
    
    print("\n🔴 BROWSER CONSOLE LOGS:")
    if logs:
        for log in logs:
            if log['level'] == 'SEVERE':
                print(f"  ❌ ERROR: {log['message']}")
            else:
                print(f"  ⚠️  {log['level']}: {log['message']}")
    else:
        print("  No console logs captured")
    
    # Save detailed report
    report = {
        'timestamp': time.time(),
        'page_state': page_state,
        'console_logs': logs,
        'console_errors': console_errors
    }
    
    with open('f12-diagnostic-report.json', 'w') as f:
        json.dump(report, f, indent=2)
    
    print("\n💾 Detailed report saved to: f12-diagnostic-report.json")
    print("📸 Screenshot saved to: selenium-f12-full-page.png")
    
    # Diagnosis
    print("\n🔍 DIAGNOSIS:")
    if page_state['bodyDisplay'] == 'none':
        print("  ❌ BODY IS HIDDEN! (display: none)")
    elif len(page_state.get('visibleText', '')) == 0:
        print("  ❌ NO VISIBLE TEXT! All content is hidden.")
    elif not page_state['hasContent']:
        print("  ❌ NO DOM CONTENT! Page is empty.")
    else:
        print("  ✅ Page structure appears normal")
    
    time.sleep(5)  # Keep browser open briefly
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    print("\nMake sure you have:")
    print("  - selenium installed (pip install selenium)")
    print("  - geckodriver installed (for Firefox)")
    driver.save_screenshot("error-screenshot.png")
finally:
    driver.quit()
    print("\n✅ Test complete!")