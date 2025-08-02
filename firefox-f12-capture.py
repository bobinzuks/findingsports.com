#!/usr/bin/env python3
import subprocess
import time
import pyautogui
import os
from datetime import datetime

print("🦊 FIREFOX F12 AUTOMATED CAPTURE")
print("================================")
print(f"Time: {datetime.now()}")
print()

# Ensure we have a display
os.environ['DISPLAY'] = ':0'

try:
    # 1. Launch Firefox with the site
    print("1. Launching Firefox...")
    firefox = subprocess.Popen(['firefox', '--new-window', 'https://findingsports.com'])
    time.sleep(5)  # Wait for Firefox to load
    
    # 2. Press F12 to open Developer Tools
    print("2. Opening Developer Tools (F12)...")
    pyautogui.press('f12')
    time.sleep(2)  # Wait for dev tools to open
    
    # 3. Click on Console tab (usually it's already selected)
    print("3. Ensuring Console tab is active...")
    # Try to click on Console tab area (adjust coordinates if needed)
    pyautogui.moveTo(150, 600)  # Approximate Console tab location
    pyautogui.click()
    time.sleep(1)
    
    # 4. Take screenshot of entire screen
    print("4. Taking screenshot with F12 open...")
    screenshot_path = f'firefox-f12-console-{int(time.time())}.png'
    pyautogui.screenshot(screenshot_path)
    print(f"   ✅ Screenshot saved: {screenshot_path}")
    
    # 5. Try to select and copy console text
    print("5. Attempting to copy console output...")
    # Click in console area
    pyautogui.moveTo(400, 700)  # Approximate console output area
    pyautogui.click()
    time.sleep(0.5)
    
    # Select all and copy
    pyautogui.hotkey('ctrl', 'a')
    time.sleep(0.5)
    pyautogui.hotkey('ctrl', 'c')
    time.sleep(1)
    
    # 6. Open Network tab
    print("6. Switching to Network tab...")
    pyautogui.moveTo(250, 600)  # Approximate Network tab location
    pyautogui.click()
    time.sleep(2)
    
    # 7. Refresh page to capture network requests
    print("7. Refreshing page to capture network activity...")
    pyautogui.press('f5')
    time.sleep(3)
    
    # 8. Take screenshot of Network tab
    print("8. Taking Network tab screenshot...")
    network_screenshot = f'firefox-f12-network-{int(time.time())}.png'
    pyautogui.screenshot(network_screenshot)
    print(f"   ✅ Screenshot saved: {network_screenshot}")
    
    # 9. Switch to Elements/Inspector tab
    print("9. Switching to Elements tab...")
    pyautogui.moveTo(50, 600)  # Approximate Elements tab location
    pyautogui.click()
    time.sleep(2)
    
    # 10. Take screenshot of Elements
    print("10. Taking Elements tab screenshot...")
    elements_screenshot = f'firefox-f12-elements-{int(time.time())}.png'
    pyautogui.screenshot(elements_screenshot)
    print(f"   ✅ Screenshot saved: {elements_screenshot}")
    
    print()
    print("✅ CAPTURE COMPLETE!")
    print()
    print("Screenshots saved:")
    print(f"  - Console: {screenshot_path}")
    print(f"  - Network: {network_screenshot}")
    print(f"  - Elements: {elements_screenshot}")
    print()
    print("Check these images to see:")
    print("  - Console errors (red text)")
    print("  - Network failures (red rows)")
    print("  - Hidden elements (CSS issues)")
    
    # Keep Firefox open for manual inspection
    print()
    print("Firefox is still open. Press Ctrl+C to close.")
    time.sleep(60)
    
except Exception as e:
    print(f"❌ Error: {e}")
    print("Make sure you have:")
    print("  - pyautogui installed (pip install pyautogui)")
    print("  - X11 display available")
    print("  - Firefox installed")
finally:
    # Close Firefox
    try:
        firefox.terminate()
    except:
        pass