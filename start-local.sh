#!/bin/bash
# Start Finding Sports locally

echo "🚀 Starting Finding Sports Local Preview"
echo "======================================"

# Kill any existing servers
echo "🔄 Stopping any existing servers..."
pkill -f "python3 -m http.server" || true

# Navigate to mockup directory
cd mockup

# Start the server
echo "🌐 Starting web server on http://localhost:3000"
python3 -m http.server 3000 &
SERVER_PID=$!

echo ""
echo "✅ Finding Sports is running!"
echo "=============================="
echo ""
echo "🔗 Access the app at:"
echo "   Main App:  http://localhost:3000"
echo "   Login:     http://localhost:3000/login.html"
echo ""
echo "📧 Demo Credentials:"
echo "   Email:     demo@example.com"
echo "   Password:  demo123"
echo ""
echo "⚡ Other test accounts:"
echo "   john@example.com / password123"
echo "   sarah@example.com / password123"
echo ""
echo "🛑 To stop the server: kill $SERVER_PID"
echo ""

# Open in browser (works on most systems)
if command -v xdg-open > /dev/null; then
    xdg-open http://localhost:3000/login.html
elif command -v open > /dev/null; then
    open http://localhost:3000/login.html
else
    echo "Please open http://localhost:3000/login.html in your browser"
fi

# Keep script running
wait $SERVER_PID