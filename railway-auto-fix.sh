#!/bin/bash

# Railway Auto Fix Script - Non-interactive version
# This will attempt to fix your deployment automatically

echo "🚂 Railway Auto Fix Script"
echo "========================="

# Install Railway CLI if needed
if ! command -v railway &> /dev/null; then
    echo "Installing Railway CLI..."
    npm install -g @railway/cli 2>/dev/null || curl -fsSL https://railway.app/install.sh | sh
fi

# Check if already logged in
if ! railway whoami &> /dev/null; then
    echo "❌ Not logged into Railway!"
    echo "Please run: railway login"
    echo "Then run this script again"
    exit 1
fi

echo "✅ Logged in as: $(railway whoami)"

# Function to set variables
set_railway_vars() {
    echo "Setting environment variables..."
    
    # Generate secure JWT secret
    JWT_SECRET="jwt-secret-$(date +%s)-$(openssl rand -hex 16 2>/dev/null || echo 'fallback-secret-123')"
    
    railway variables set JWT_SECRET="$JWT_SECRET" 2>/dev/null
    railway variables set NODE_ENV="production" 2>/dev/null
    railway variables set PORT="8080" 2>/dev/null
    railway variables set CORS_ORIGIN="https://findingsports.com" 2>/dev/null
    
    echo "✅ Variables set (or already exist)"
}

# Function to check deployment health
check_deployment() {
    local max_attempts=10
    local attempt=1
    
    echo "Checking deployment health..."
    
    while [ $attempt -le $max_attempts ]; do
        echo "Attempt $attempt/$max_attempts..."
        
        # Check if service is running
        if railway status 2>/dev/null | grep -q "running"; then
            echo "✅ Service is running!"
            return 0
        fi
        
        # Check logs for specific errors
        local logs=$(railway logs --lines 20 2>/dev/null)
        
        if echo "$logs" | grep -q "JWT_SECRET not set"; then
            echo "⚠️  JWT_SECRET error detected, setting variables..."
            set_railway_vars
            railway restart 2>/dev/null
        elif echo "$logs" | grep -q "Build timed out"; then
            echo "⚠️  Build timeout detected, redeploying..."
            railway up --detach 2>/dev/null
        elif echo "$logs" | grep -q "Server running on port"; then
            echo "✅ Server is running!"
            return 0
        fi
        
        sleep 10
        ((attempt++))
    done
    
    return 1
}

# Main fix loop
main() {
    echo "Starting automated fix process..."
    
    # Step 1: Set variables first
    set_railway_vars
    
    # Step 2: Deploy
    echo "Deploying application..."
    railway up --detach 2>/dev/null
    
    # Step 3: Wait and check
    sleep 30
    
    # Step 4: Check deployment health
    if check_deployment; then
        echo "✅ Deployment successful!"
        
        # Show final status
        echo ""
        echo "=== Deployment Status ==="
        railway status
        echo ""
        echo "=== Environment Variables ==="
        railway variables
        echo ""
        echo "🎉 Your app should be running!"
    else
        echo "❌ Deployment issues persist"
        echo ""
        echo "Recent logs:"
        railway logs --lines 30
        echo ""
        echo "Try running: ./railway-fix-loop.sh for interactive fixes"
    fi
}

# Run main function
main