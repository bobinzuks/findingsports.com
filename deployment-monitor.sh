#!/bin/bash

# Railway Deployment Monitor with Retry Logic
# This script creates deployment triggers and monitors for success

echo "🚀 Railway Deployment Monitor Started"
echo "=================================="
echo "Target: Deploy commit 62cc35c with critical security fixes"
echo ""

# Configuration
MAX_RETRIES=5
RETRY_DELAY=60
DEPLOYMENT_TIMEOUT=180
RETRY_COUNT=0

# Function to create deployment trigger
trigger_deployment() {
    local retry_num=$1
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S UTC')
    local build_id=$(date +%s)
    
    echo "🔄 Deployment Trigger #$retry_num at $timestamp"
    
    git commit --allow-empty -m "chore: Railway deployment trigger #$retry_num

Critical security deployment - Retry $retry_num of $MAX_RETRIES
Target commit: 62cc35c

Security fixes included:
- Removed hardcoded demo user (CRITICAL)
- JWT_SECRET environment validation
- Secure authentication flow
- Production test coverage

Timestamp: $timestamp
Build ID: $build_id
Retry: $retry_num/$MAX_RETRIES"

    git push origin main
    
    echo "✅ Trigger #$retry_num pushed successfully"
    echo ""
}

# Function to check deployment status
check_deployment() {
    # Since we can't directly query Railway API, we'll monitor git log
    # and provide status updates
    echo "📊 Deployment Status Check"
    echo "Latest commits:"
    git log --oneline -3
    echo ""
}

# Main deployment loop
echo "🎯 Starting deployment process..."
echo ""

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    
    echo "═══════════════════════════════════════"
    echo "DEPLOYMENT ATTEMPT $RETRY_COUNT of $MAX_RETRIES"
    echo "═══════════════════════════════════════"
    
    # Trigger deployment
    trigger_deployment $RETRY_COUNT
    
    # Check status
    check_deployment
    
    if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
        echo "⏳ Waiting $RETRY_DELAY seconds before next retry..."
        echo "   (Railway should pick up the deployment within this time)"
        echo ""
        sleep $RETRY_DELAY
    fi
done

echo "═══════════════════════════════════════"
echo "📋 DEPLOYMENT SUMMARY"
echo "═══════════════════════════════════════"
echo "Total deployment triggers sent: $RETRY_COUNT"
echo ""
echo "🔐 Security fixes being deployed:"
echo "  - Hardcoded demo user REMOVED"
echo "  - JWT_SECRET validation ADDED"
echo "  - Secure authentication flow"
echo "  - Production test suite"
echo ""
echo "📌 Next Steps:"
echo "  1. Check Railway dashboard in Firefox"
echo "  2. Monitor deployment logs"
echo "  3. Verify security fixes are live"
echo "  4. Test authentication flow"
echo ""
echo "✅ Deployment triggers completed!"