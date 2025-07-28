#!/bin/bash

echo "🚨 EMERGENCY FIX: Removing language service scripts from HTML"
echo "=================================================="

# Check git status
echo "📊 Current git status:"
git status --short

# Add the HTML changes
echo -e "\n📝 Adding HTML changes..."
git add mockup/index.html

# Commit with emergency message
echo -e "\n💾 Committing emergency fix..."
git commit -m "🚨 EMERGENCY FIX: Remove language-service.js and i18n scripts from HTML

The enhanced-nuclear-fix.js was deployed but not working because:
- language-service.js was still being loaded AFTER the nuclear fix
- i18n-service.js was also potentially adding language elements

This commit removes these script tags from index.html to ensure
the nuclear fix can properly clean the UI without interference.

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push to main
echo -e "\n🚀 Pushing to main branch..."
git push origin main

echo -e "\n✅ Emergency fix deployed!"
echo "⏱️  Railway will auto-deploy within 1-2 minutes"
echo "🔍 Monitor at: https://findingsports.com/"