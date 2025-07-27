#!/bin/sh
# Railway startup script with automatic directory detection
echo "Starting Railway deployment..."
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la

# Check if we're in the right directory
if [ -f "server.js" ]; then
    echo "✅ Found server file in current directory"
    node server.js
elif [ -f "mockup/backend/server.js" ]; then
    echo "📁 Moving to mockup/backend directory"
    cd mockup/backend
    node server.js
elif [ -f "backend/server.js" ]; then
    echo "📁 Moving to backend directory"
    cd backend
    node server.js
else
    echo "❌ Cannot find server.js!"
    echo "Searching for server files..."
    find . -name "*.js" -type f | head -20
    exit 1
fi