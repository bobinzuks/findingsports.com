const http = require('http');
const PORT = process.env.PORT || 8080;

console.log('Starting ultra-simple server on port', PORT);

const server = http.createServer((req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Content-Type', 'application/json');
    
    console.log('Request:', req.method, req.url);
    
    if (req.url === '/api/health') {
        res.writeHead(200);
        res.end(JSON.stringify({ status: 'ok', server: 'ultra-simple' }));
    } else if (req.url.startsWith('/api/play-now')) {
        res.writeHead(200);
        res.end(JSON.stringify({
            activities: {
                happeningNow: [{
                    id: '1',
                    sport: 'basketball',
                    venue: 'Hillcrest Community Centre',
                    address: '4575 Clancy Loranger Way, Vancouver',
                    lat: 49.2435,
                    lng: -123.1089,
                    coordinates: { lat: 49.2435, lng: -123.1089 },
                    time: '7:00 PM - 9:00 PM',
                    distance: '2.5 km',
                    isRealData: true
                }],
                startingSoon: [],
                laterToday: [],
                openCourts: [],
                pickupGames: []
            },
            summary: { totalActivities: 1, happeningNow: 1 }
        }));
    } else if (req.url === '/' || req.url === '/index.html') {
        // Serve the index.html file
        const fs = require('fs');
        const path = require('path');
        try {
            const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(html);
        } catch (err) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end('<html><body><h1>Finding Sports</h1><p>Server is running!</p></body></html>');
        }
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}/`);
});

// Keep process alive
process.on('SIGTERM', () => {
    console.log('SIGTERM received');
    server.close(() => {
        console.log('Server closed');
    });
});