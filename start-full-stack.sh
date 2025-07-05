#!/bin/bash
# Start Finding Sports Full Stack (Backend + Frontend)

echo "🚀 Finding Sports - Full Stack Launcher"
echo "======================================="

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Kill existing processes
echo -e "${YELLOW}🔄 Cleaning up existing servers...${NC}"
pkill -f "node.*server.js" || true
pkill -f "python3 -m http.server" || true
sleep 1

# Install backend dependencies
echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
cd mockup/backend
npm install
cd ../..

# Start backend
echo -e "${GREEN}🚀 Starting backend server...${NC}"
cd mockup/backend
PORT=8080 node server.js &
BACKEND_PID=$!
cd ../..
sleep 2

# Check if backend is running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${RED}❌ Backend failed to start${NC}"
    exit 1
fi

# Find available port for frontend
find_available_port() {
    local port=$1
    while lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; do
        port=$((port + 1))
    done
    echo $port
}

FRONTEND_PORT=$(find_available_port 3000)

# Start frontend
echo -e "${GREEN}🚀 Starting frontend server on port $FRONTEND_PORT...${NC}"
cd mockup
python3 -m http.server $FRONTEND_PORT &
FRONTEND_PID=$!
cd ..

# Wait for servers to start
sleep 2

# Display status
clear
echo -e "${BLUE}"
cat << "EOF"
  _____ _           _ _              ____                  _       
 |  ___(_)_ __   __| (_)_ __   __ _ / ___| _ __   ___  _ __| |_ ___ 
 | |_  | | '_ \ / _` | | '_ \ / _` |\___ \| '_ \ / _ \| '__| __/ __|
 |  _| | | | | | (_| | | | | | (_| | ___) | |_) | (_) | |  | |_\__ \
 |_|   |_|_| |_|\\__,_|_|_| |_|\\__, ||____/| .__/ \\___/|_|   \\__|___/
                               |___/       |_|                        
EOF
echo -e "${NC}"

echo -e "${GREEN}✅ Full Stack Running!${NC}"
echo ""
echo -e "${BLUE}🔗 Access URLs:${NC}"
echo -e "   Frontend:  ${GREEN}http://localhost:$FRONTEND_PORT${NC}"
echo -e "   Backend:   ${GREEN}http://localhost:8080${NC}"
echo -e "   Login:     ${GREEN}http://localhost:$FRONTEND_PORT/login-google.html${NC}"
echo ""
echo -e "${YELLOW}📋 Environment:${NC}"
echo -e "   Google OAuth: ${RED}Not configured${NC} (add GOOGLE_CLIENT_ID)"
echo -e "   JWT Secret:   ${YELLOW}Using dev key${NC} (change in production)"
echo ""
echo -e "${BLUE}📧 Test Accounts:${NC}"
echo -e "   demo@example.com / demo123"
echo ""
echo -e "Press ${YELLOW}Ctrl+C${NC} to stop all servers"

# Open browser
URL="http://localhost:$FRONTEND_PORT/login-google.html"
if command -v xdg-open > /dev/null; then
    xdg-open $URL 2>/dev/null &
elif command -v open > /dev/null; then
    open $URL 2>/dev/null &
fi

# Handle shutdown
cleanup() {
    echo ""
    echo -e "${YELLOW}👋 Stopping servers...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}✅ Stopped!${NC}"
    exit 0
}

trap cleanup INT TERM

# Keep running
wait