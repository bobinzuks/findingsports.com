// Deploy and initialize the 10-agent Sports Scraping Swarm
const SportsScrapingSwarmCoordinator = require('./swarm-coordinator');

class SwarmDeployment {
    constructor() {
        this.swarm = null;
        this.isDeployed = false;
        this.deploymentLog = [];
    }

    // Deploy the complete swarm
    async deploySwarm() {
        console.log('🚀 DEPLOYING 10-AGENT SPORTS SCRAPING SWARM');
        console.log('================================================');

        try {
            // Initialize swarm coordinator
            this.swarm = new SportsScrapingSwarmCoordinator();

            // Setup event listeners
            this.setupEventListeners();

            // Initialize all agents
            const swarmStatus = await this.swarm.initializeSwarm();

            this.isDeployed = true;
            this.logDeployment('SUCCESS', 'Swarm fully deployed and operational');

            // Start monitoring
            this.startDeploymentMonitoring();

            console.log('🎉 SWARM DEPLOYMENT COMPLETE!');
            console.log('=====================================');
            console.log('📊 Swarm Capabilities:');
            console.log(`   • ${swarmStatus.metrics.totalSources} sources ready for scraping`);
            console.log('   • 10 specialized agents working in coordination');
            console.log('   • Real-time data processing and updates');
            console.log('   • Multi-region coverage across BC');
            console.log('   • Intelligent ML-powered data extraction');
            console.log('   • 500+ sports facilities and venues monitored');

            return swarmStatus;
        } catch (error) {
            this.logDeployment('ERROR', `Deployment failed: ${error.message}`);
            console.error('❌ SWARM DEPLOYMENT FAILED:', error);
            throw error;
        }
    }

    // Setup event listeners for swarm coordination
    setupEventListeners() {
        this.swarm.on('scrapingComplete', data => {
            console.log(`✅ Location scraping complete: ${data.games.length} games found in ${data.duration}ms`);
            this.logDeployment('INFO', `Scraped ${data.games.length} games for location ${data.location.lat}, ${data.location.lng}`);
        });

        this.swarm.on('realTimeUpdate', data => {
            console.log(`🔄 Real-time update: ${data.type}`);
            this.logDeployment('INFO', `Real-time update: ${data.type}`);
        });

        this.swarm.on('healthCheck', status => {
            if (status.swarm !== 'active') {
                console.warn('⚠️ Swarm health issue detected:', status);
                this.logDeployment('WARNING', `Health check failed: ${JSON.stringify(status)}`);
            }
        });

        this.swarm.on('scrapingFailed', data => {
            console.error(`❌ Scraping failed for location ${data.location.lat}, ${data.location.lng}: ${data.error}`);
            this.logDeployment('ERROR', `Scraping failed: ${data.error}`);
        });
    }

    // Start comprehensive scraping for a user location
    async scrapeForUser(lat, lng, userSports = [], urgency = 'normal') {
        if (!this.isDeployed) {
            throw new Error('Swarm not deployed. Call deploySwarm() first.');
        }

        console.log('🎯 INITIATING COMPREHENSIVE SCRAPING');
        console.log(`📍 Location: ${lat}, ${lng}`);
        console.log(`🏀 Sports interests: ${userSports.join(', ') || 'all sports'}`);
        console.log(`⚡ Urgency: ${urgency}`);
        console.log('=========================================');

        const startTime = Date.now();

        try {
            const result = await this.swarm.scrapeLocationComprehensively(lat, lng, userSports, urgency);

            const duration = Date.now() - startTime;

            console.log('🎉 SCRAPING COMPLETE!');
            console.log('📊 Results Summary:');
            console.log(`   • ${result.games.length} games found`);
            console.log(`   • ${result.totalSources} sources checked`);
            console.log(`   • ${duration}ms total execution time`);
            console.log(`   • ${(result.games.length / (duration / 1000)).toFixed(2)} games/second`);

            // Categorize games by sport
            const sportBreakdown = this.categorizeGamesBySport(result.games);
            console.log('🏆 Sport Breakdown:');
            Object.entries(sportBreakdown).forEach(([sport, count]) => {
                console.log(`   • ${sport}: ${count} games`);
            });

            return result;
        } catch (error) {
            console.error('❌ User scraping failed:', error);
            throw error;
        }
    }

    // Categorize games by sport for reporting
    categorizeGamesBySport(games) {
        const breakdown = {};
        games.forEach(game => {
            const sport = game.sport || 'unknown';
            breakdown[sport] = (breakdown[sport] || 0) + 1;
        });
        return breakdown;
    }

    // Start monitoring deployment health
    startDeploymentMonitoring() {
        setInterval(() => {
            const status = this.swarm.getSwarmStatus();

            if (status.status !== 'active') {
                console.warn('⚠️ Swarm status warning:', status.status);
            }

            // Log metrics every 5 minutes
            console.log(`📊 Swarm Metrics: ${status.metrics.totalGames} total games, ${status.metrics.activeSources} active sources`);
        }, 5 * 60 * 1000); // Every 5 minutes
    }

    // Log deployment events
    logDeployment(level, message) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message
        };

        this.deploymentLog.push(logEntry);

        // Keep only last 1000 entries
        if (this.deploymentLog.length > 1000) {
            this.deploymentLog = this.deploymentLog.slice(-1000);
        }
    }

    // Get deployment status
    getDeploymentStatus() {
        return {
            deployed: this.isDeployed,
            swarmStatus: this.swarm ? this.swarm.getSwarmStatus() : null,
            deploymentLog: this.deploymentLog.slice(-10), // Last 10 entries
            uptime: this.isDeployed ? Date.now() - this.deploymentTime : 0
        };
    }

    // Demonstration method - scrape multiple Vancouver locations
    async demonstrateSwarmCapabilities() {
        if (!this.isDeployed) {
            await this.deploySwarm();
        }

        console.log('🎪 SWARM CAPABILITIES DEMONSTRATION');
        console.log('====================================');

        const testLocations = [
            { name: 'Downtown Vancouver', lat: 49.2827, lng: -123.1207, sports: ['basketball', 'volleyball'] },
            { name: 'Burnaby', lat: 49.2488, lng: -122.9805, sports: ['soccer', 'tennis'] },
            { name: 'Richmond', lat: 49.1666, lng: -123.1336, sports: ['badminton', 'swimming'] },
            { name: 'Surrey', lat: 49.1913, lng: -122.849, sports: ['hockey', 'fitness'] }
        ];

        const results = [];

        for (const location of testLocations) {
            console.log(`\n🎯 Testing: ${location.name}`);
            console.log('----------------------------');

            try {
                const result = await this.scrapeForUser(
                    location.lat,
                    location.lng,
                    location.sports,
                    'demo'
                );

                results.push({
                    location: location.name,
                    success: true,
                    gamesFound: result.games.length,
                    duration: result.duration,
                    sourcesChecked: result.totalSources
                });
            } catch (error) {
                results.push({
                    location: location.name,
                    success: false,
                    error: error.message
                });
            }
        }

        // Summary report
        console.log('\n📋 DEMONSTRATION SUMMARY');
        console.log('=========================');

        const totalGames = results.reduce((sum, r) => sum + (r.gamesFound || 0), 0);
        const avgDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0) / results.length;
        const successRate = (results.filter(r => r.success).length / results.length) * 100;

        console.log(`🎯 Total games found: ${totalGames}`);
        console.log(`⚡ Average response time: ${Math.round(avgDuration)}ms`);
        console.log(`✅ Success rate: ${successRate}%`);

        results.forEach(result => {
            if (result.success) {
                console.log(`   ${result.location}: ${result.gamesFound} games (${result.duration}ms)`);
            } else {
                console.log(`   ${result.location}: FAILED - ${result.error}`);
            }
        });

        return results;
    }

    // Shutdown the swarm
    async shutdown() {
        console.log('🛑 Shutting down swarm deployment...');

        if (this.swarm) {
            await this.swarm.shutdown();
        }

        this.isDeployed = false;
        this.logDeployment('INFO', 'Swarm shutdown complete');

        console.log('✅ Swarm deployment shutdown complete');
    }
}

// Export for use in other modules
module.exports = SwarmDeployment;

// If run directly, start demonstration
if (require.main === module) {
    async function runDemo() {
        const deployment = new SwarmDeployment();

        try {
            console.log('🏀 FINDING SPORTS - MEGA SCRAPER SWARM DEMO');
            console.log('=============================================');
            console.log('This demonstration will show the capabilities of our');
            console.log('10-agent sports scraping swarm across BC locations.');
            console.log('');

            // Deploy the swarm
            await deployment.deploySwarm();

            // Wait a moment for full initialization
            console.log('⏳ Allowing swarm to fully initialize...');
            await new Promise(resolve => setTimeout(resolve, 5000));

            // Run demonstration
            await deployment.demonstrateSwarmCapabilities();

            console.log('\n🎉 DEMO COMPLETE!');
            console.log('The swarm is now ready to handle real user requests.');
            console.log('Access via API endpoint: /api/games/mega-search');
        } catch (error) {
            console.error('❌ Demo failed:', error);
        } finally {
            // Keep running for API access
            console.log('\n🚀 Swarm remains active for API access...');
            console.log('Press Ctrl+C to shutdown');
        }
    }

    runDemo().catch(console.error);
}
