#!/usr/bin/env python3
"""
Screenshot capture tool for Finding Sports testing
Saves screenshots to Downloads folder with timestamp
"""

import os
import time
import subprocess
from datetime import datetime
from pathlib import Path

def take_screenshot(url, test_name):
    """Take a screenshot of the given URL and save to Downloads"""
    
    # Get Downloads folder
    downloads_dir = Path.home() / "Downloads"
    
    # Create filename with timestamp
    timestamp = datetime.now().strftime("%Y-%m-%d at %H-%M-%S")
    filename = f"Screenshot {timestamp} {test_name}.png"
    filepath = downloads_dir / filename
    
    print(f"📸 Taking screenshot of {url}")
    print(f"📁 Saving to: {filepath}")
    
    # Try different screenshot methods
    
    # Method 1: Using gnome-screenshot (if available)
    try:
        subprocess.run(["gnome-screenshot", "-w", "-f", str(filepath)], check=True)
        print(f"✅ Screenshot saved: {filename}")
        return filepath
    except:
        pass
    
    # Method 2: Using scrot (if available)
    try:
        subprocess.run(["scrot", "-s", str(filepath)], check=True)
        print(f"✅ Screenshot saved: {filename}")
        return filepath
    except:
        pass
    
    # Method 3: Using import (ImageMagick)
    try:
        subprocess.run(["import", str(filepath)], check=True)
        print(f"✅ Screenshot saved: {filename}")
        return filepath
    except:
        pass
    
    print("❌ No screenshot tool available. Please install gnome-screenshot, scrot, or imagemagick")
    return None

def open_browser_and_screenshot(url, test_name):
    """Open URL in Firefox and take screenshot"""
    
    print(f"\n🌐 Opening {url} in Firefox...")
    
    # Open Firefox with the URL
    subprocess.Popen(["firefox", url])
    
    # Wait for page to load
    print("⏳ Waiting 5 seconds for page to load...")
    time.sleep(5)
    
    # Take screenshot
    screenshot_path = take_screenshot(url, test_name)
    
    return screenshot_path

def main():
    """Main test execution"""
    
    print("🧪 Finding Sports Screenshot Testing Tool")
    print("=" * 50)
    
    base_url = "https://findingsports.com"
    
    # Test cases
    tests = [
        ("Homepage", base_url),
        ("Play Now", f"{base_url}/#play-now"),
        ("Login Page", f"{base_url}/login.html"),
        ("Social Feed", f"{base_url}/#social"),
    ]
    
    screenshots = []
    
    for test_name, url in tests:
        print(f"\n📋 Test: {test_name}")
        screenshot = open_browser_and_screenshot(url, test_name.replace(" ", "-"))
        if screenshot:
            screenshots.append((test_name, screenshot))
        
        # Wait between tests
        time.sleep(3)
    
    print("\n" + "=" * 50)
    print("📊 Test Summary")
    print("=" * 50)
    
    for test_name, path in screenshots:
        print(f"✅ {test_name}: {path.name}")
    
    print(f"\n📁 All screenshots saved to: {Path.home() / 'Downloads'}")

if __name__ == "__main__":
    main()