#!/bin/bash

echo "🚂 AUTOMATED RAILWAY DEPLOYMENT"
echo "=============================="

cd /home/terry/Desktop/finding-sports

# Method 1: Try to create .railway config directly
echo "📝 Creating Railway project configuration..."
mkdir -p .railway
cat > .railway/config.json << EOF
{
  "projectId": "adequate-vibrancy",
  "environmentId": "production"
}
EOF

# Method 2: Try using expect if available
if command -v expect &> /dev/null; then
    echo "🤖 Using expect to automate linking..."
    expect << 'EOF'
    set timeout 10
    spawn railway link
    expect "Select a project"
    send "\r"
    expect eof
EOF
else
    echo "⚠️  'expect' not installed, trying alternative method..."
fi

# Method 3: Try railway up with environment detection
echo -e "\n📦 Attempting deployment..."

# First, let's see if we can get Railway to recognize the project
export RAILWAY_TOKEN=$(cat ~/.railway/config.json | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# Try deploying with explicit service detection
railway up --ci 2>&1 | tee deployment.log || {
    echo "❌ Direct deployment failed, trying alternative..."
    
    # Method 4: Use railway variables to check if we're connected
    railway variables 2>&1 | grep -q "No linked project" && {
        echo "❌ Project not linked. Trying workaround..."
        
        # Create a temporary script that uses yes to auto-select
        cat > temp_link.sh << 'SCRIPT'
#!/bin/bash
# Auto-select first option (workspace)
echo "" | railway link 2>&1 | grep -A5 "Select"
# Then try to deploy
railway up
SCRIPT
        
        chmod +x temp_link.sh
        ./temp_link.sh
        rm temp_link.sh
    } || {
        echo "✅ Project appears to be linked, deploying..."
        railway up
    }
}

echo -e "\n📊 Checking deployment status..."
sleep 5

# Check if deployment succeeded
curl -s https://findingsports.com | head -20 | grep -q "<!doctype" && {
    echo "✅ SUCCESS! Site is now serving HTML!"
    echo "🎉 Deployment completed successfully!"
} || {
    echo "⏳ Deployment may still be in progress..."
    echo "Check https://railway.app/dashboard for status"
}