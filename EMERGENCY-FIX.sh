#!/bin/bash

# EMERGENCY FIX - Site is DOWN
# Revert to working configuration

echo "🚨 EMERGENCY FIX - Site is DOWN!"
echo "================================"

# Check current state
echo "Current Procfile:"
cat Procfile

echo -e "\nCurrent server files:"
ls -la mockup/backend/server*.js

# Create emergency fix
echo -e "\n🔧 Creating emergency fix..."

# Restore working Procfile
echo "web: cd mockup/backend && node server.js" > Procfile

# Commit and push emergency fix
echo -e "\n📦 Pushing emergency fix..."
git add Procfile
git commit -m "🚨 EMERGENCY FIX: Site is DOWN - Restore working configuration

The site is returning 404 for everything including homepage.
Reverting to basic working configuration.

URGENT: Deploy this immediately to restore service!"

git push origin main --force

echo -e "\n✅ Emergency fix pushed!"
echo "⚠️  URGENT: Go to Railway and:"
echo "1. Deploy this emergency fix immediately"
echo "2. Check build logs for errors"
echo "3. Make sure the deployment completes"
echo ""
echo "The site is currently DOWN and needs immediate attention!"