const cron = require('node-cron');
const VancouverOpenDataSource = require('./data-sources/vancouver-open-data');
const CommunityCenterScraper = require('./data-sources/community-center-scraper');

// Simple in-memory queue implementation
class InMemoryQueue {
    constructor() {
        this.jobs = [];
        this.processors = {};
        this.processing = false;
        this.listeners = { failed: [], completed: [] };
    }

    async add(name, data) {
        const job = {
            id: Date.now() + Math.random(),
            name,
            data,
            createdAt: new Date()
        };
        this.jobs.push(job);
        setImmediate(() => this.processNext());
        return job;
    }

    process(name, handler) {
        this.processors[name] = handler;
    }

    on(event, handler) {
        if (this.listeners[event]) {
            this.listeners[event].push(handler);
        }
    }

    async processNext() {
        if (this.processing || this.jobs.length === 0) {
            return;
        }

        this.processing = true;
        const job = this.jobs.shift();

        try {
            const processor = this.processors[job.name];
            if (processor) {
                const result = await processor(job);
                this.listeners.completed.forEach(handler => handler(job, result));
            }
        } catch (error) {
            this.listeners.failed.forEach(handler => handler(job, error));
        } finally {
            this.processing = false;
            if (this.jobs.length > 0) {
                setImmediate(() => this.processNext());
            }
        }
    }
}

class DataAggregationPipeline {
    constructor() {
        // Initialize data sources
        this.sources = {
            vancouverOpenData: new VancouverOpenDataSource(),
            communityCenter: new CommunityCenterScraper(),
            nvrcGymnasiums: new (require('./data-sources/nvrc-gymnasium-scraper'))()
        };

        // Initialize in-memory job queue
        this.queue = new InMemoryQueue();

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

        // NVRC Gymnasiums - Every 4 hours (more frequent for drop-in schedules)
        cron.schedule('0 */4 * * *', () => {
            this.queue.add('nvrc-gymnasiums', {});
        });

        // NVRC Fields - Every 2 hours (field availability changes frequently)
        cron.schedule('0 */2 * * *', () => {
            this.queue.add('nvrc-fields', {});
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
        await this.queue.add('nvrc-gymnasiums', {});
        await this.queue.add('nvrc-fields', {});
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

        // Process NVRC gymnasium schedules
        this.queue.process('nvrc-gymnasiums', async job => {
            console.log('Processing NVRC gymnasium schedules...');
            const { schedules, dropInGames } = await this.sources.nvrcGymnasiums.scrapeGymnasiumSchedules();

            // Store drop-in games
            let processed = 0;
            for (const game of dropInGames) {
                // Create proper game data for NVRC games
                const gameData = {
                    title: game.type || `Drop-in ${game.sport}`,
                    sport: game.sport,
                    venue: game.venue || {
                        name: game.centre,
                        address: game.address || 'North Vancouver',
                        coordinates: game.coordinates || { lat: 49.3234, lng: -123.0831 }
                    },
                    startTime: this.getNextDayTime(game.day, game.time),
                    description: `${game.type} at ${game.centre}`,
                    type: 'drop-in',
                    isDropIn: true,
                    source: 'NVRC Gymnasiums',
                    lastUpdated: new Date(),
                    recurring: {
                        enabled: true,
                        frequency: 'weekly',
                        days: game.day ? [game.day.toLowerCase()] : []
                    }
                };
                
                const gameId = this.generateGameId(gameData);
                gameData.id = gameId;
                
                this.gamesDatabase.set(gameId, gameData);
                processed++;
            }

            console.log(`Processed ${processed} NVRC drop-in activities`);
            return { processed, schedules: schedules.length };
        });

        // Process field availability
        this.queue.process('nvrc-fields', async job => {
            console.log('Checking NVRC field availability...');
            const fields = await this.sources.nvrcGymnasiums.scrapeFieldAvailability();

            // Store field status
            for (const field of fields) {
                this.facilitiesDatabase.set(field.name, field);
            }

            console.log(`Updated ${fields.length} field statuses`);
            return { fields: fields.length };
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
                // Convert radius to meters if it seems to be in km (less than 1000)
                const radiusInMeters = radius < 1000 ? radius * 1000 : radius;
                return distance <= radiusInMeters;
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
    
    // Helper to get next occurrence of a weekday with time
    getNextDayTime(dayName, timeString) {
        if (!dayName || !timeString) {
            // Return next available time slot if missing
            const nextDate = new Date();
            nextDate.setDate(nextDate.getDate() + 1);
            nextDate.setHours(19, 0, 0, 0);
            return nextDate;
        }
        
        const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const targetDay = daysOfWeek.indexOf(dayName.toLowerCase());
        
        if (targetDay === -1) {
            // Invalid day, return tomorrow
            const nextDate = new Date();
            nextDate.setDate(nextDate.getDate() + 1);
            nextDate.setHours(19, 0, 0, 0);
            return nextDate;
        }
        
        const now = new Date();
        const currentDay = now.getDay();
        let daysUntilTarget = targetDay - currentDay;
        
        if (daysUntilTarget <= 0) {
            daysUntilTarget += 7;
        }
        
        const targetDate = new Date();
        targetDate.setDate(now.getDate() + daysUntilTarget);
        
        // Parse time from string like "7:00pm-9:00pm"
        const timeMatch = timeString.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)/i);
        if (timeMatch) {
            let hours = parseInt(timeMatch[1], 10);
            const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
            const isPM = timeMatch[3].toLowerCase() === 'pm';
            
            if (isPM && hours !== 12) {
                hours += 12;
            } else if (!isPM && hours === 12) {
                hours = 0;
            }
            
            targetDate.setHours(hours, minutes, 0, 0);
        } else {
            // Default to 7 PM if time parsing fails
            targetDate.setHours(19, 0, 0, 0);
        }
        
        return targetDate;
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
