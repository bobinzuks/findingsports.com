#!/usr/bin/env python3
import time
import requests
import subprocess
from datetime import datetime

print("🔄 CONTINUOUS DEPLOYMENT MONITOR")
print("================================")
print("Will check every 10 seconds until fixed...\n")

def check_site():
    try:
        response = requests.get('https://findingsports.com', timeout=10)
        has_template_tag = '<%=Date.now()%>' in response.text
        content_length = len(response.text)
        
        return {
            'status': response.status_code,
            'has_template_tag': has_template_tag,
            'content_length': content_length,
            'text_sample': response.text[:200]
        }
    except Exception as e:
        return {'error': str(e)}

def take_screenshot(filename):
    try:
        subprocess.run([
            'google-chrome',
            '--headless',
            '--disable-gpu',
            '--screenshot=' + filename,
            '--window-size=1280,800',
            'https://findingsports.com'
        ], capture_output=True)
        return True
    except:
        return False

check_count = 0
while True:
    check_count += 1
    timestamp = datetime.now().strftime('%H:%M:%S')
    
    print(f"\n[{timestamp}] Check #{check_count}")
    print("-" * 40)
    
    result = check_site()
    
    if 'error' in result:
        print(f"❌ Error: {result['error']}")
    else:
        print(f"Status Code: {result['status']}")
        print(f"Content Size: {result['content_length']} bytes")
        
        if result['has_template_tag']:
            print("❌ Template tag STILL PRESENT - old version")
        else:
            print("✅ TEMPLATE TAG REMOVED - NEW VERSION!")
            
            # Take victory screenshot
            print("\n🎉 WHITE SCREEN FIX DEPLOYED!")
            print("Taking screenshots...")
            
            # Regular mode
            if take_screenshot('fixed-regular.png'):
                print("✅ Regular mode screenshot: fixed-regular.png")
            
            # Incognito mode
            subprocess.run([
                'google-chrome',
                '--headless',
                '--disable-gpu',
                '--incognito',
                '--screenshot=fixed-incognito.png',
                '--window-size=1280,800',
                'https://findingsports.com'
            ], capture_output=True)
            print("✅ Incognito mode screenshot: fixed-incognito.png")
            
            # Check if screenshots show content
            import os
            regular_size = os.path.getsize('fixed-regular.png')
            incognito_size = os.path.getsize('fixed-incognito.png')
            
            print(f"\nScreenshot sizes:")
            print(f"  Regular: {regular_size/1024:.1f} KB")
            print(f"  Incognito: {incognito_size/1024:.1f} KB")
            
            if regular_size > 10000 and incognito_size > 10000:
                print("\n✅ BOTH SCREENSHOTS HAVE CONTENT!")
                print("🏆 WHITE SCREEN ISSUE FIXED!")
            else:
                print("\n⚠️ Screenshots might still be white...")
                print("Continuing to monitor...")
            
            break
    
    print("\nWaiting 10 seconds...")
    time.sleep(10)

print("\n✅ Monitoring complete!")
print("Check the screenshots to verify the fix worked.")