const Bull = require('bull');
const cron = require('node-cron');
const VancouverOpenDataSource = require('./data-sources/vancouver-open-data');
const CommunityCenterScraper = require('./data-sources/community-center-scraper');

class DataAggregationPipeline {
    constructor() {
        // Initialize data sources
        this.sources = {
            vancouverOpenData: new VancouverOpenDataSource(),
            communityCenter: new CommunityCenterScraper()
        };

        // Initialize job queue
        this.queue = new Bull('data-aggregation', {
            redis: {
                port: process.env.REDIS_PORT || 6379,
                host: process.env.REDIS_HOST || 'localhost'
            }
        });

        // In-memory storage for demo (replace with database)
        this.gamesDatabase = new Map();
        this.facilitiesDatabase = new Map();

        this.setupQueueProcessors();
    }

    // Start the pipeline
    start() {
        console.log('Starting data aggregation pipeline...');

        // Schedule jobs
        this.scheduleJobs();

        // Run initial data collection
        this.runInitialCollection();
    }

    scheduleJobs() {
        // Vancouver Open Data - Daily at 3 AM
        cron.schedule('0 3 * * *', () => {
            this.queue.add('vancouver-facilities', {});
        });

        // Community Centers - Every 6 hours
        cron.schedule('0 */6 * * *', () => {
            this.queue.add('community-centers', {});
        });

        // Data cleanup - Daily at 2 AM
        cron.schedule('0 2 * * *', () => {
            this.queue.add('cleanup-old-data', {});
        });

        console.log('Scheduled jobs configured');
    }

    async runInitialCollection() {
        console.log('Running initial data collection...');

        // Queue immediate jobs
        await this.queue.add('vancouver-facilities', {});
        await this.queue.add('community-centers', {});
    }

    setupQueueProcessors() {
        // Process Vancouver facilities
        this.queue.process('vancouver-facilities', async job => {
            console.log('Processing Vancouver facilities...');
            try {
                const facilities = await this.sources.vancouverOpenData.getSportsVenues();

                // Store facilities
                for (const facility of facilities) {
                    if (facility.venue?.id) {
                        this.facilitiesDatabase.set(facility.venue.id, facility);
                    }
                }

                console.log(`Stored ${facilities.length} facilities`);
                return { processed: facilities.length };
            } catch (error) {
                console.error('Error processing Vancouver facilities:', error);
                throw error;
            }
        });

        // Process community center schedules
        this.queue.process('community-centers', async job => {
            console.log('Processing community center schedules...');
            try {
                const games = await this.sources.communityCenter.scrapeAllCenters();

                // Process and store games
                const processed = await this.processGames(games);

                console.log(`Processed ${processed} games from community centers`);
                return { processed };
            } catch (error) {
                console.error('Error processing community centers:', error);
                throw error;
            }
        });

        // Clean up old data
        this.queue.process('cleanup-old-data', async job => {
            console.log('Cleaning up old data...');
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - 1); // Remove games older than 1 day

            let removed = 0;
            for (const [id, game] of this.gamesDatabase.entries()) {
                if (new Date(game.startTime) < cutoffDate && !game.recurring?.enabled) {
                    this.gamesDatabase.delete(id);
                    removed++;
                }
            }

            console.log(`Removed ${removed} old games`);
            return { removed };
        });

        // Queue error handling
        this.queue.on('failed', (job, err) => {
            console.error(`Job ${job.name} failed:`, err);
        });

        this.queue.on('completed', (job, result) => {
            console.log(`Job ${job.name} completed:`, result);
        });
    }

    async processGames(games) {
        let processed = 0;

        for (const game of games) {
            try {
                // Validate game data
                if (!this.validateGame(game)) {
                    continue;
                }

                // Generate unique ID
                const gameId = this.generateGameId(game);

                // Check for duplicates
                if (!this.isDuplicate(gameId, game)) {
                    // Calculate reliability score
                    game.reliability = this.calculateReliability(game);

                    // Store game
                    this.gamesDatabase.set(gameId, {
                        ...game,
                        id: gameId,
                        lastUpdated: new Date()
                    });

                    processed++;
                }
            } catch (error) {
                console.error('Error processing game:', error);
            }
        }

        return processed;
    }

    validateGame(game) {
        // Basic validation
        if (!game.title || !game.sport || !game.venue || !game.startTime) {
            return false;
        }

        // Validate time
        if (new Date(game.startTime) < new Date()) {
            // Only skip if it's not recurring
            if (!game.recurring?.enabled) {
                return false;
            }
        }

        // Check if it's a drop-in game (not a league)
        const gameText = `${game.title} ${game.description || ''} ${game.requirements?.join(' ') || ''}`;
        const baseSource = this.sources.communityCenter; // Use base source for validation

        if (!baseSource.isDropIn(gameText)) {
            console.log(`Filtered out non-drop-in game: ${game.title}`);
            return false;
        }

        return true;
    }

    generateGameId(game) {
        // Create unique ID based on venue, sport, and time
        const venueId = game.venue.name.toLowerCase().replace(/\s+/g, '-');
        const sport = game.sport.toLowerCase();
        const timeStr = new Date(game.startTime).toISOString().split('T')[0];
        const hourStr = new Date(game.startTime).getHours();

        return `${venueId}-${sport}-${timeStr}-${hourStr}`;
    }

    isDuplicate(gameId, game) {
        const existing = this.gamesDatabase.get(gameId);
        if (!existing) {
            return false;
        }

        // Check if this is an update
        if (game.source?.lastUpdated > existing.lastUpdated) {
            // It's an update, not a duplicate
            return false;
        }

        return true;
    }

    calculateReliability(game) {
        let score = 0.8; // Base score

        // Adjust based on source type
        if (game.source?.type === 'api') {
            score += 0.1;
        } else if (game.source?.type === 'user') {
            score -= 0.2;
        }

        // Adjust based on data completeness
        if (game.endTime) {
            score += 0.05;
        }
        if (game.capacity?.max) {
            score += 0.05;
        }
        if (game.venue?.coordinates) {
            score += 0.05;
        }
        if (game.organizer?.name) {
            score += 0.05;
        }

        return Math.min(1, Math.max(0, score));
    }

    // Public API for querying games
    async searchGames(filters = {}) {
        const {
            sport,
            location,
            date,
            lat,
            lng,
            radius = 5000 // meters
        } = filters;

        let games = Array.from(this.gamesDatabase.values());

        // Filter by sport
        if (sport && sport !== 'any') {
            games = games.filter(g => g.sport === sport);
        }

        // Filter by location/radius
        if (lat && lng) {
            games = games.filter(g => {
                if (!g.venue?.coordinates) {
                    return false;
                }
                const distance = this.calculateDistance(lat, lng, g.venue.coordinates.lat, g.venue.coordinates.lng);
                return distance <= radius;
            });
        }

        // Filter by date
        if (date) {
            const targetDate = new Date(date);
            games = games.filter(g => {
                const gameDate = new Date(g.startTime);
                return gameDate.toDateString() === targetDate.toDateString();
            });
        }

        // Sort by start time
        games.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

        return games;
    }

    // Calculate distance between two coordinates (Haversine formula)
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = (lat1 * Math.PI) / 180;
        const φ2 = (lat2 * Math.PI) / 180;
        const Δφ = ((lat2 - lat1) * Math.PI) / 180;
        const Δλ = ((lon2 - lon1) * Math.PI) / 180;

        const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    // Get statistics
    getStats() {
        return {
            totalGames: this.gamesDatabase.size,
            totalFacilities: this.facilitiesDatabase.size,
            sources: Object.keys(this.sources).map(name => ({
                name,
                lastUpdate: this.sources[name].lastUpdate,
                type: this.sources[name].type
            })),
            sportBreakdown: this.getSportBreakdown()
        };
    }

    getSportBreakdown() {
        const breakdown = {};
        for (const game of this.gamesDatabase.values()) {
            breakdown[game.sport] = (breakdown[game.sport] || 0) + 1;
        }
        return breakdown;
    }
}

// Singleton instance
let instance;

module.exports = {
    getInstance: () => {
        if (!instance) {
            instance = new DataAggregationPipeline();
        }
        return instance;
    },
    DataAggregationPipeline
};
