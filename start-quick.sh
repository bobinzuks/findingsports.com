#!/bin/bash
# Quick start with random port

# Colors for pretty output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Get a random available port between 3000-9000
PORT=$(python3 -c 'import socket; s=socket.socket(); s.bind(("", 0)); print(s.getsockname()[1]); s.close()')

# Kill any existing servers
pkill -f "python3 -m http.server" 2>/dev/null

# Start server
cd mockup
python3 -m http.server $PORT > /dev/null 2>&1 &
PID=$!

# Quick display
clear
echo -e "${BLUE}"
cat << "EOF"
  _____ _           _ _              ____                  _       
 |  ___(_)_ __   __| (_)_ __   __ _ / ___| _ __   ___  _ __| |_ ___ 
 | |_  | | '_ \ / _` | | '_ \ / _` |\___ \| '_ \ / _ \| '__| __/ __|
 |  _| | | | | | (_| | | | | | (_| | ___) | |_) | (_) | |  | |_\__ \
 |_|   |_|_| |_|\__,_|_|_| |_|\__, ||____/| .__/ \___/|_|   \__|___/
                               |___/       |_|                        
EOF
echo -e "${NC}"

echo -e "${GREEN}✅ Running on port: ${YELLOW}$PORT${NC}"
echo ""
echo -e "${BLUE}🔗 Open in browser:${NC}"
echo -e "   ${GREEN}http://localhost:$PORT${NC}"
echo ""
echo -e "${YELLOW}📋 Quick copy:${NC} http://localhost:$PORT"
echo ""
echo -e "Press ${YELLOW}Ctrl+C${NC} to stop"

# Auto-open browser
if command -v xdg-open > /dev/null; then
    xdg-open http://localhost:$PORT 2>/dev/null &
fi

# Handle shutdown
trap "kill $PID 2>/dev/null; echo ''; echo 'Stopped! 👋'; exit" INT
wait