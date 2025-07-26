#!/bin/sh
# Railway startup script with automatic directory detection
echo "Starting Railway deployment..."
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la

# Check if we're in the right directory
if [ -f "absolute-failsafe-server.js" ]; then
    echo "✅ Found server file in current directory"
    node absolute-failsafe-server.js
elif [ -f "mockup/backend/absolute-failsafe-server.js" ]; then
    echo "📁 Moving to mockup/backend directory"
    cd mockup/backend
    node absolute-failsafe-server.js
elif [ -f "backend/absolute-failsafe-server.js" ]; then
    echo "📁 Moving to backend directory"
    cd backend
    node absolute-failsafe-server.js
else
    echo "❌ Cannot find absolute-failsafe-server.js!"
    echo "Searching for server files..."
    find . -name "*.js" -type f | head -20
    exit 1
fi