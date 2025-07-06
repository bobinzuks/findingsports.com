#!/bin/bash

# Finding Sports Backend Server Startup Script

echo "🏀 Starting Finding Sports Backend Server..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "Creating .env file with placeholder values..."
    
    cat > .env << EOF
# Google OAuth Configuration
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com

# JWT Secret for authentication
JWT_SECRET=dev-secret-key-change-in-production

# CORS Origin
CORS_ORIGIN=http://localhost:8080

# Port
PORT=8080

# Node Environment
NODE_ENV=development
EOF
    
    echo "✅ Created .env file. Please update it with your actual Google Client ID!"
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Kill any existing process on port 8080
echo "🔍 Checking for existing processes on port 8080..."
lsof -ti:8080 | xargs kill -9 2>/dev/null || true

# Start the server
echo "🚀 Starting server on port 8080..."
echo "📍 Access the app at: http://localhost:8080"
echo "📊 API endpoint: http://localhost:8080/api/games"
echo ""

# Run the server with nodemon for auto-restart on changes
if command -v nodemon &> /dev/null; then
    nodemon server.js
else
    # Fallback to regular node if nodemon not installed
    node server.js
fi