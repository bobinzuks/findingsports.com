#!/bin/bash
# Start Finding Sports on an available port automatically

echo "🚀 Finding Sports - Auto Port Launcher"
echo "====================================="

# Function to find an available port
find_available_port() {
    local port=$1
    local max_port=$(($1 + 20))
    
    while [ $port -le $max_port ]; do
        if ! lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo $port
            return 0
        fi
        port=$((port + 1))
    done
    
    echo "0"
    return 1
}

# Kill any existing Python servers
echo "🔄 Cleaning up existing servers..."
pkill -f "python3 -m http.server" || true
sleep 1

# Find available port starting from 3000
PORT=$(find_available_port 3000)

if [ "$PORT" = "0" ]; then
    echo "❌ No available ports found between 3000-3020"
    exit 1
fi

echo "✅ Found available port: $PORT"

# Navigate to mockup directory
cd mockup

# Start the server
echo "🌐 Starting Finding Sports on port $PORT..."
python3 -m http.server $PORT &
SERVER_PID=$!

# Wait a moment for server to start
sleep 2

# Display access information
echo ""
echo "✨ ========================================= ✨"
echo "   Finding Sports is running!"
echo "✨ ========================================= ✨"
echo ""
echo "🔗 Access URLs:"
echo "   Main App:  http://localhost:$PORT"
echo "   Login:     http://localhost:$PORT/login.html"
echo ""
echo "📧 Demo Credentials:"
echo "   Email:     demo@example.com"
echo "   Password:  demo123"
echo ""
echo "🛑 To stop: Press Ctrl+C or run: kill $SERVER_PID"
echo ""
echo "✨ ========================================= ✨"

# Try to open in browser
URL="http://localhost:$PORT"
echo ""
echo "🌐 Opening $URL in your browser..."

if command -v xdg-open > /dev/null; then
    xdg-open $URL 2>/dev/null
elif command -v open > /dev/null; then
    open $URL 2>/dev/null
elif command -v start > /dev/null; then
    start $URL 2>/dev/null
else
    echo "👉 Please open $URL in your browser"
fi

# Keep the script running
trap "echo ''; echo '👋 Stopping server...'; kill $SERVER_PID 2>/dev/null; exit" INT TERM
wait $SERVER_PID