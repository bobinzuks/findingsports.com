#!/bin/bash

echo "🧪 Testing Emergency Server Locally"
echo "=================================="

# Save current directory
ORIGINAL_DIR=$(pwd)

# Go to backend directory
cd mockup/backend

# Copy minimal package.json
echo "📦 Setting up minimal package..."
cp package-minimal.json package.json

# Install production dependencies only
echo "📥 Installing production dependencies..."
npm install --production --no-audit --no-fund

# Start server in background
echo "🚀 Starting emergency server..."
PORT=3333 node server-emergency.js &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Test server endpoints
echo -e "\n🔍 Testing endpoints..."

# Health check
echo "Testing /health endpoint..."
curl -s http://localhost:3333/health | jq '.' || echo "Health check failed"

# Games API
echo -e "\nTesting /api/games endpoint..."
curl -s http://localhost:3333/api/games | jq '.' || echo "Games API failed"

# Kill server
echo -e "\n🛑 Stopping server..."
kill $SERVER_PID 2>/dev/null

# Restore original package.json
echo "♻️  Restoring original package.json..."
git checkout package.json 2>/dev/null || cp ../../mockup/backend/package.json ./package.json

# Return to original directory
cd "$ORIGINAL_DIR"

echo -e "\n✅ Test complete!"