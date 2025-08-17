#!/usr/bin/env python3
import subprocess
import time
import os
from datetime import datetime

print("📸 GETTING REAL SCREENSHOT PROOF")
print("================================")
print(f"Time: {datetime.now()}")
print()

# Function to take screenshot
def take_screenshot(mode="regular"):
    timestamp = int(time.time())
    filename = f"proof-{mode}-{timestamp}.png"
    
    cmd = [
        "google-chrome",
        "--headless",
        "--disable-gpu",
        "--ignore-certificate-errors",
        "--disable-web-security",
        "--window-size=1280,800",
        f"--screenshot={filename}"
    ]
    
    if mode == "incognito":
        cmd.insert(3, "--incognito")
    
    cmd.append("https://findingsports.com")
    
    print(f"Taking {mode} mode screenshot...")
    result = subprocess.run(cmd, capture_output=True, text=True)
    
    if os.path.exists(filename):
        size = os.path.getsize(filename)
        print(f"✅ Screenshot saved: {filename} ({size/1024:.1f} KB)")
        
        # Check if it's likely a white screen (small file size)
        if size < 10000:  # Less than 10KB usually means white/blank
            print(f"⚠️  Small file size - might be white screen")
        else:
            print(f"✅ File size indicates content present")
        
        return filename
    else:
        print(f"❌ Failed to capture screenshot")
        return None

# Take screenshots
print("1. REGULAR BROWSER MODE:")
regular_file = take_screenshot("regular")

print()
print("2. INCOGNITO MODE:")
incognito_file = take_screenshot("incognito")

print()
print("3. Checking page content...")
# Get the actual HTML to verify
html = subprocess.run(
    ["curl", "-s", "https://findingsports.com"],
    capture_output=True,
    text=True
).stdout

# Check for key indicators
has_version = "deployment-version.js" in html
has_content = "Finding Sports" in html
has_language = "🌐 English" in html
has_help = "? Help" in html
content_size = len(html)

print(f"   Version indicator: {'✅ Present' if has_version else '❌ Missing'}")
print(f"   Content present: {'✅ Yes' if has_content else '❌ No'}")
print(f"   Language selector: {'❌ Still there' if has_language else '✅ Removed'}")
print(f"   Help button: {'❌ Still there' if has_help else '✅ Removed'}")
print(f"   HTML size: {content_size} bytes")

print()
print("=" * 50)
print("SCREENSHOT FILES CREATED:")
if regular_file:
    print(f"  Regular: {regular_file}")
if incognito_file:
    print(f"  Incognito: {incognito_file}")

print()
print("To view these screenshots:")
print(f"  xdg-open {regular_file}")
print(f"  xdg-open {incognito_file}")
print()
print("Or check them in the file browser")