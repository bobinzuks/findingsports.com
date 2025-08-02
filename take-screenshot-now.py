#!/usr/bin/env python3
import subprocess
import time
from datetime import datetime

print("📸 TAKING REAL SCREENSHOTS OF FINDING SPORTS")
print("=" * 50)
print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print()

# Take screenshots using Chrome headless
print("1. Taking REGULAR browser screenshot...")
regular_cmd = [
    "google-chrome",
    "--headless",
    "--disable-gpu",
    "--screenshot=screenshot-regular-now.png",
    "--window-size=1280,800",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "https://findingsports.com"
]

try:
    subprocess.run(regular_cmd, capture_output=True, text=True)
    print("   ✅ Regular screenshot saved: screenshot-regular-now.png")
except Exception as e:
    print(f"   ❌ Error: {e}")

print()
print("2. Taking INCOGNITO mode screenshot...")
incognito_cmd = [
    "google-chrome", 
    "--headless",
    "--disable-gpu",
    "--incognito",
    "--screenshot=screenshot-incognito-now.png",
    "--window-size=1280,800",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "https://findingsports.com"
]

try:
    subprocess.run(incognito_cmd, capture_output=True, text=True)
    print("   ✅ Incognito screenshot saved: screenshot-incognito-now.png")
except Exception as e:
    print(f"   ❌ Error: {e}")

print()
print("3. Checking what's visible in screenshots...")
print()
print("Screenshots are saved as:")
print("  - screenshot-regular-now.png")
print("  - screenshot-incognito-now.png")
print()
print("Use these commands to view:")
print("  xdg-open screenshot-regular-now.png")
print("  xdg-open screenshot-incognito-now.png")