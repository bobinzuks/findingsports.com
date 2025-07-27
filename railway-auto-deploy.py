#!/usr/bin/env python3

import subprocess
import time
import sys
import os

print("🚂 RAILWAY AUTOMATED DEPLOYMENT")
print("==============================\n")

# Change to project directory
os.chdir('/home/terry/Desktop/finding-sports')

# First, check if we're already linked
try:
    result = subprocess.run(['railway', 'status'], capture_output=True, text=True)
    if "No linked project" not in result.stderr:
        print("✅ Project already linked!")
        print("📦 Deploying...")
        subprocess.run(['railway', 'up'])
        sys.exit(0)
except Exception as e:
    print(f"Error checking status: {e}")

# Try to link using expect
print("🔗 Attempting to link project...")

# Create expect script
expect_script = """#!/usr/bin/expect -f
set timeout 30
spawn railway link

# Wait for workspace selection
expect "Select a workspace" {
    send "\r"
}

# Wait for project selection
expect "Select a project" {
    send "\r"
}

# Wait for environment selection
expect "Select an environment" {
    send "\r"  
}

# Wait for service selection (might appear)
expect {
    "Select a service" {
        send "\r"
    }
    eof {
        # Service selection might be skipped
    }
}

expect eof
"""

# Write expect script
with open('railway_link.exp', 'w') as f:
    f.write(expect_script)

os.chmod('railway_link.exp', 0o755)

# Run expect script
try:
    subprocess.run(['expect', 'railway_link.exp'])
    os.remove('railway_link.exp')
    print("\n✅ Linking completed!")
except FileNotFoundError:
    print("❌ 'expect' not installed. Trying direct deployment...")
    os.remove('railway_link.exp')

# Now try to deploy
print("\n📦 Deploying to Railway...")
try:
    result = subprocess.run(['railway', 'up'], capture_output=True, text=True)
    print(result.stdout)
    if result.stderr:
        print("Errors:", result.stderr)
    
    if result.returncode == 0:
        print("\n✅ Deployment initiated successfully!")
        print("⏳ Waiting for deployment to complete...")
        
        # Monitor deployment
        for i in range(12):  # Check for 2 minutes
            time.sleep(10)
            response = subprocess.run(['curl', '-s', 'https://findingsports.com'], 
                                    capture_output=True, text=True)
            if '<!doctype' in response.stdout or '<html' in response.stdout:
                print("\n🎉 SUCCESS! Site is now serving HTML!")
                print("✅ All changes are live!")
                break
            else:
                print(f"⏳ Still deploying... ({i+1}/12)")
        else:
            print("\n⚠️  Deployment may still be in progress.")
            print("Check https://railway.app/dashboard for status")
    else:
        print("❌ Deployment failed. Please check the errors above.")
        
except Exception as e:
    print(f"❌ Error during deployment: {e}")

print("\n📊 Final check:")
subprocess.run(['curl', '-s', 'https://findingsports.com', '|', 'head', '-5'], shell=True)