// Integration script to add the 10-agent swarm to the main Finding Sports server
const SwarmAPIEndpoint = require('./services/sports-scraping-swarm/swarm-api-endpoint');

let swarmEndpoint = null;

// Initialize the swarm integration
async function initializeSwarmIntegration(app) {
    console.log('🏀 Initializing Sports Scraping Swarm integration...');

    try {
        // Create swarm API endpoint
        console.log('📦 Creating SwarmAPIEndpoint...');
        swarmEndpoint = new SwarmAPIEndpoint();
        console.log('✅ SwarmAPIEndpoint created successfully');

        // Mount swarm routes
        console.log('🔗 Creating swarm router...');
        const swarmRouter = swarmEndpoint.createRouter();
        console.log('✅ Swarm router created successfully');

        console.log('🔧 Mounting swarm router on /api/swarm...');
        app.use('/api/swarm', swarmRouter);
        console.log('✅ Swarm router mounted successfully');

        // Add mega search to main games endpoint
        app.get('/api/games/mega-search', async (req, res) => {
            try {
                const { lat, lng, sport, radius = 25, limit = 100 } = req.query;

                if (!lat || !lng) {
                    return res.status(400).json({
                        error: 'lat and lng query parameters are required for mega search'
                    });
                }

                // Use swarm for comprehensive search
                const sports = sport && sport !== 'any' ? [sport] : [];

                const result = await swarmEndpoint.deployment.scrapeForUser(
                    parseFloat(lat),
                    parseFloat(lng),
                    sports,
                    'normal'
                );

                // Limit results if requested
                const games = limit ? result.games.slice(0, parseInt(limit, 10)) : result.games;

                res.json({
                    games,
                    source: 'mega_swarm',
                    searchInfo: {
                        totalFound: result.games.length,
                        returned: games.length,
                        sourcesChecked: result.totalSources,
                        responseTime: result.duration,
                        swarmVersion: '1.0.0'
                    },
                    metadata: {
                        searchRadius: `${radius}km`,
                        timestamp: new Date().toISOString(),
                        agentsUsed: 10
                    }
                });
            } catch (error) {
                console.error('Mega search error:', error);

                // Fallback to regular API if swarm fails
                res.status(500).json({
                    error: 'Mega search temporarily unavailable',
                    message: 'Please try the regular search',
                    fallback: '/api/games'
                });
            }
        });

        // Enhanced regular games endpoint with swarm fallback
        const originalGamesHandler = app._router.stack.find(
            layer => layer.route && layer.route.path === '/api/games' && layer.route.methods.get
        );

        if (originalGamesHandler) {
            // Wrap the original handler to add swarm enhancement
            const originalHandler = originalGamesHandler.route.stack[0].handle;

            originalGamesHandler.route.stack[0].handle = async (req, res, next) => {
                try {
                    // Try original implementation first
                    await originalHandler(req, res, err => {
                        if (err) {
                            // If original fails, try swarm as fallback
                            return handleSwarmFallback(req, res, err);
                        }
                    });
                } catch (error) {
                    // If original fails, try swarm as fallback
                    return handleSwarmFallback(req, res, error);
                }
            };
        }

        async function handleSwarmFallback(req, res, originalError) {
            console.log('🔄 Using swarm as fallback for games API');

            try {
                const { lat, lng, sport } = req.query;

                if (lat && lng) {
                    const sports = sport && sport !== 'any' ? [sport] : [];

                    const result = await swarmEndpoint.deployment.scrapeForUser(
                        parseFloat(lat),
                        parseFloat(lng),
                        sports,
                        'urgent' // Quick fallback
                    );

                    return res.json({
                        games: result.games.slice(0, 50), // Limit for performance
                        source: 'swarm_fallback',
                        searchInfo: {
                            fallbackReason: 'Primary API unavailable',
                            swarmResults: true,
                            totalFound: result.games.length
                        }
                    });
                }

                // If no coordinates, return original error
                throw originalError;
            } catch (swarmError) {
                console.error('Swarm fallback also failed:', swarmError);
                res.status(500).json({
                    error: 'Both primary and backup systems are unavailable',
                    originalError: originalError.message,
                    swarmError: swarmError.message
                });
            }
        }

        console.log('✅ Swarm integration complete');
        console.log('📡 Available endpoints:');
        console.log('   • /api/swarm/mega-search - Comprehensive 10-agent search');
        console.log('   • /api/swarm/quick-search - Fast high-priority search');
        console.log('   • /api/swarm/status - Swarm operational status');
        console.log('   • /api/swarm/sources - Available data sources');
        console.log('   • /api/swarm/live-games/:lat/:lng - Real-time updates');
        console.log('   • /api/games/mega-search - Enhanced games search');

        // Now add the catch-all route after swarm routes are mounted
        const path = require('path');
        app.get('*', (req, res) => {
            // Don't serve index for API routes
            if (req.path.startsWith('/api/')) {
                return res.status(404).json({ error: 'Not found' });
            }

            // Serve the appropriate HTML file
            if (req.path.includes('login')) {
                res.sendFile(path.join(__dirname, '..', '..', 'login-google.html'));
            } else if (req.path.includes('onboarding')) {
                res.sendFile(path.join(__dirname, '..', '..', 'onboarding', 'index.html'));
            } else {
                res.sendFile(path.join(__dirname, '..', '..', 'index.html'));
            }
        });

        console.log('🌐 Catch-all route added after swarm routes');

        return swarmEndpoint;
    } catch (error) {
        console.error('❌ Swarm integration failed:', error);
        throw error;
    }
}

// Get swarm status
function getSwarmStatus() {
    if (!swarmEndpoint) {
        return { status: 'not_initialized' };
    }

    return swarmEndpoint.deployment.getDeploymentStatus();
}

// Shutdown swarm
async function shutdownSwarm() {
    if (swarmEndpoint) {
        console.log('🛑 Shutting down swarm...');
        await swarmEndpoint.shutdown();
        swarmEndpoint = null;
        console.log('✅ Swarm shutdown complete');
    }
}

// Test swarm with sample data
async function testSwarm() {
    if (!swarmEndpoint) {
        throw new Error('Swarm not initialized');
    }

    console.log('🧪 Testing swarm with Vancouver coordinates...');

    const testResult = await swarmEndpoint.deployment.scrapeForUser(
        49.2827, // Vancouver lat
        -123.1207, // Vancouver lng
        ['basketball', 'soccer'], // Test sports
        'demo' // Demo urgency
    );

    console.log(`✅ Test complete: ${testResult.games.length} games found`);
    return testResult;
}

module.exports = {
    initializeSwarmIntegration,
    getSwarmStatus,
    shutdownSwarm,
    testSwarm
};
