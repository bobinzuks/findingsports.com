#!/bin/bash

echo "🚀 FORCE RAILWAY DEPLOYMENT SCRIPT"
echo "================================="

# Method 1: Create significant changes to force deployment
echo "📝 Making significant changes to force deployment..."

# Update server.js with timestamp comment
echo -e "\n// Deployment forced at $(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)" >> mockup/backend/server.js

# Update Dockerfile with build arg
echo -e "\n# Build timestamp: $(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)" >> Dockerfile

# Create a new deployment marker file
echo "Deployment requested at $(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)" > FORCE_DEPLOYMENT_NOW.txt

# Commit and push all changes
git add -A
git commit -m "🚨 CRITICAL: Force Railway deployment - serve HTML not JSON API"
git push origin main

echo "✅ Changes pushed to GitHub"

# Method 2: Try railway CLI with different approaches
echo -e "\n🚂 Attempting Railway CLI deployment..."

# Try railway up
railway up 2>/dev/null || echo "❌ Railway CLI not authenticated"

# Try railway link and deploy
railway link 2>/dev/null && railway up 2>/dev/null || echo "❌ Railway link failed"

# Method 3: Create webhook trigger file
echo -e "\n📡 Creating webhook trigger..."
curl -X POST https://api.railway.app/webhooks/deploy 2>/dev/null || echo "❌ Webhook not configured"

echo -e "\n📊 Checking deployment status..."
curl -s https://findingsports.com | head -20

echo -e "\n💡 If still showing JSON, please:"
echo "1. Go to https://railway.app/dashboard"
echo "2. Click on your project"  
echo "3. Click 'Redeploy' or 'Deploy'"
echo "4. Or check Settings > GitHub to ensure auto-deploy is enabled"