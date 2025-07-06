// API endpoint to integrate the 10-agent swarm with the Finding Sports backend
const express = require('express');
const SwarmDeployment = require('./deploy-swarm');

class SwarmAPIEndpoint {
    constructor() {
        this.deployment = new SwarmDeployment();
        this.isInitialized = false;
        this.initializationPromise = null;
    }

    // Initialize the swarm (lazy loading)
    async initializeSwarm() {
        if (this.isInitialized) {
            return;
        }

        if (this.initializationPromise) {
            return this.initializationPromise;
        }

        this.initializationPromise = this.deployment.deploySwarm();
        await this.initializationPromise;
        this.isInitialized = true;

        console.log('🏀 Swarm API endpoint ready!');
    }

    // Create Express router with swarm endpoints
    createRouter() {
        const router = express.Router();

        // Mega search endpoint - comprehensive scraping
        router.post('/mega-search', async (req, res) => {
            try {
                const { lat, lng, sports = [], urgency = 'normal', radius = 25 } = req.body;

                if (!lat || !lng) {
                    return res.status(400).json({
                        error: 'Latitude and longitude are required',
                        example: { lat: 49.2827, lng: -123.1207 }
                    });
                }

                // Initialize swarm if needed
                await this.initializeSwarm();

                console.log(`🎯 Mega search request: ${lat}, ${lng} - Sports: ${sports.join(',') || 'all'}`);

                // Execute comprehensive scraping
                const result = await this.deployment.scrapeForUser(lat, lng, sports, urgency);

                res.json({
                    success: true,
                    location: { lat, lng, radius },
                    results: {
                        games: result.games,
                        totalGames: result.games.length,
                        sourcesChecked: result.totalSources,
                        responseTime: result.duration,
                        sportBreakdown: this.generateSportBreakdown(result.games),
                        venueBreakdown: this.generateVenueBreakdown(result.games)
                    },
                    metadata: {
                        searchTime: new Date().toISOString(),
                        swarmVersion: '1.0.0',
                        agentsUsed: 10,
                        coverage: `${radius}km radius`
                    }
                });
            } catch (error) {
                console.error('❌ Mega search failed:', error);
                res.status(500).json({
                    error: 'Mega search failed',
                    message: error.message,
                    timestamp: new Date().toISOString()
                });
            }
        });

        // Quick search endpoint - faster, fewer sources
        router.get('/quick-search', async (req, res) => {
            try {
                const { lat, lng, sport, limit = 20 } = req.query;

                if (!lat || !lng) {
                    return res.status(400).json({
                        error: 'Latitude and longitude query parameters are required'
                    });
                }

                // Initialize swarm if needed
                await this.initializeSwarm();

                // Quick search uses only high-priority sources
                const sports = sport ? [sport] : [];
                const result = await this.deployment.scrapeForUser(
                    parseFloat(lat),
                    parseFloat(lng),
                    sports,
                    'urgent'
                );

                // Limit results for quick response
                const limitedGames = result.games.slice(0, parseInt(limit, 10));

                res.json({
                    success: true,
                    games: limitedGames,
                    totalFound: result.games.length,
                    returned: limitedGames.length,
                    responseTime: result.duration,
                    quickSearch: true
                });
            } catch (error) {
                console.error('❌ Quick search failed:', error);
                res.status(500).json({
                    error: 'Quick search failed',
                    message: error.message
                });
            }
        });

        // Swarm status endpoint
        router.get('/status', async (req, res) => {
            try {
                const deploymentStatus = this.deployment.getDeploymentStatus();

                res.json({
                    swarm: {
                        deployed: deploymentStatus.deployed,
                        uptime: deploymentStatus.uptime,
                        status: deploymentStatus.swarmStatus?.status || 'not_deployed'
                    },
                    agents: deploymentStatus.swarmStatus?.agents || {},
                    metrics: deploymentStatus.swarmStatus?.metrics || {},
                    capabilities: deploymentStatus.swarmStatus?.capabilities || {},
                    recentLogs: deploymentStatus.deploymentLog || []
                });
            } catch (error) {
                res.status(500).json({
                    error: 'Failed to get swarm status',
                    message: error.message
                });
            }
        });

        // Real-time games endpoint with location streaming
        router.get('/live-games/:lat/:lng', async (req, res) => {
            try {
                const { lat, lng } = req.params;
                const { sports } = req.query;

                // Set up Server-Sent Events
                res.setHeader('Content-Type', 'text/event-stream');
                res.setHeader('Cache-Control', 'no-cache');
                res.setHeader('Connection', 'keep-alive');

                // Initialize swarm if needed
                await this.initializeSwarm();

                // Set up real-time updates
                const updateHandler = data => {
                    if (this.isLocationRelevant(data.location, parseFloat(lat), parseFloat(lng))) {
                        res.write(`data: ${JSON.stringify(data)}\n\n`);
                    }
                };

                this.deployment.swarm.on('scrapingComplete', updateHandler);
                this.deployment.swarm.on('realTimeUpdate', updateHandler);

                // Send initial data
                const initialResult = await this.deployment.scrapeForUser(
                    parseFloat(lat),
                    parseFloat(lng),
                    sports ? sports.split(',') : []
                );

                res.write(`data: ${JSON.stringify({
                    type: 'initial',
                    games: initialResult.games,
                    timestamp: new Date().toISOString()
                })}\n\n`);

                // Clean up on client disconnect
                req.on('close', () => {
                    this.deployment.swarm.off('scrapingComplete', updateHandler);
                    this.deployment.swarm.off('realTimeUpdate', updateHandler);
                });
            } catch (error) {
                console.error('❌ Live games failed:', error);
                res.status(500).json({
                    error: 'Live games failed',
                    message: error.message
                });
            }
        });

        // Sports sources endpoint - list all available sources
        router.get('/sources', async (req, res) => {
            try {
                await this.initializeSwarm();

                const sources = this.deployment.swarm.agents.sportsExpert.getAllSources();
                const integrations = this.deployment.swarm.agents.integrationEngineer.getIntegrationStatus();

                res.json({
                    totalSources: sources.length,
                    sourceBreakdown: this.categorizeSourcesByType(sources),
                    integrations,
                    coverage: {
                        regions: [...new Set(sources.map(s => s.region))],
                        types: [...new Set(sources.map(s => s.type))],
                        sports: [...new Set(sources.flatMap(s => s.specialties || []))]
                    }
                });
            } catch (error) {
                res.status(500).json({
                    error: 'Failed to get sources',
                    message: error.message
                });
            }
        });

        // Health check endpoint
        router.get('/health', async (req, res) => {
            try {
                if (!this.isInitialized) {
                    return res.json({
                        status: 'initializing',
                        swarm: 'not_deployed'
                    });
                }

                const health = this.deployment.swarm.performHealthCheck();

                res.json({
                    status: 'healthy',
                    swarm: health.swarm,
                    agents: health.webScraper ? 'active' : 'inactive',
                    timestamp: health.timestamp
                });
            } catch (error) {
                res.status(503).json({
                    status: 'unhealthy',
                    error: error.message
                });
            }
        });

        return router;
    }

    // Utility methods
    generateSportBreakdown(games) {
        const breakdown = {};
        games.forEach(game => {
            const sport = game.sport || 'unknown';
            breakdown[sport] = (breakdown[sport] || 0) + 1;
        });
        return breakdown;
    }

    generateVenueBreakdown(games) {
        const breakdown = {};
        games.forEach(game => {
            const venue = game.venue?.name || 'Unknown Venue';
            breakdown[venue] = (breakdown[venue] || 0) + 1;
        });

        // Return top 10 venues
        return Object.entries(breakdown)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .reduce((obj, [venue, count]) => {
                obj[venue] = count;
                return obj;
            }, {});
    }

    categorizeSourcesByType(sources) {
        const breakdown = {};
        sources.forEach(source => {
            const type = source.type || 'unknown';
            breakdown[type] = (breakdown[type] || 0) + 1;
        });
        return breakdown;
    }

    isLocationRelevant(updateLocation, userLat, userLng, radiusKm = 25) {
        if (!updateLocation) { return true; }

        const distance = this.calculateDistance(
            userLat, userLng,
            updateLocation.lat, updateLocation.lng
        );

        return distance <= radiusKm;
    }

    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    // Shutdown
    async shutdown() {
        if (this.deployment) {
            await this.deployment.shutdown();
        }
    }
}

module.exports = SwarmAPIEndpoint;
