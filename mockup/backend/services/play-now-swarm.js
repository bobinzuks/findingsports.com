const EventEmitter = require('events');
const { getInstance: getDataSwarm } = require('./data-aggregation-swarm');
const { localSportsSources } = require('./local-sports-sources');

/**
 * Play Now Swarm - Multi-agent system for real-time sports data
 * Coordinates specialized agents to find games happening now
 */
class PlayNowSwarm extends EventEmitter {
    constructor() {
        super();
        this.agents = new Map();
        this.results = new Map();
        this.cache = new Map();
        this.dataSwarm = getDataSwarm();
        
        // Initialize specialized agents
        this.initializeAgents();
        
        // Performance metrics
        this.metrics = {
            agentExecutions: {},
            cacheHits: 0,
            cacheMisses: 0,
            avgResponseTime: 0,
            totalRequests: 0
        };
    }

    /**
     * Initialize all specialized agents
     */
    initializeAgents() {
        // Location Scout Agent - Finds nearby facilities
        this.createAgent('LocationScoutAgent', {
            role: 'Find nearby sports facilities and venues',
            priority: 1,
            parallel: true,
            cacheTTL: 86400000, // 24 hours for venue data
            execute: this.locationScoutExecutor.bind(this)
        });

        // Schedule Agent - Checks facility schedules
        this.createAgent('ScheduleAgent', {
            role: 'Check drop-in schedules and times',
            priority: 2,
            parallel: true,
            cacheTTL: 3600000, // 1 hour for schedules
            execute: this.scheduleAgentExecutor.bind(this)
        });

        // Availability Agent - Real-time availability
        this.createAgent('AvailabilityAgent', {
            role: 'Monitor real-time court/field availability',
            priority: 3,
            parallel: true,
            cacheTTL: 300000, // 5 minutes for availability
            execute: this.availabilityAgentExecutor.bind(this)
        });

        // Weather Agent - Weather conditions for outdoor venues
        this.createAgent('WeatherAgent', {
            role: 'Check weather conditions for outdoor games',
            priority: 4,
            parallel: true,
            cacheTTL: 1800000, // 30 minutes for weather
            execute: this.weatherAgentExecutor.bind(this)
        });

        // Coordinator Agent - Aggregates and ranks results
        this.createAgent('CoordinatorAgent', {
            role: 'Aggregate data and rank best options',
            priority: 5,
            parallel: false,
            cacheTTL: 0, // Always fresh
            execute: this.coordinatorAgentExecutor.bind(this)
        });

        console.log(`🐝 Initialized ${this.agents.size} Play Now agents`);
    }

    /**
     * Create an agent with configuration
     */
    createAgent(name, config) {
        this.agents.set(name, {
            name,
            ...config,
            status: 'idle',
            lastRun: null,
            executionTime: 0,
            errorCount: 0
        });
    }

    /**
     * Execute swarm to find games happening now
     */
    async findGamesNow(userLocation, options = {}) {
        const startTime = Date.now();
        console.log(`🚀 Play Now Swarm starting for location: ${userLocation.lat}, ${userLocation.lng}`);

        const {
            radiusKm = 10,
            sports = [],
            includeOpenCourts = true,
            includePickupGames = true,
            maxResults = 50
        } = options;

        // Clear previous results
        this.results.clear();

        // Execute agents in parallel based on priority groups
        const priorityGroups = this.groupAgentsByPriority();
        
        for (const [priority, agents] of priorityGroups) {
            console.log(`📊 Executing priority ${priority} agents: ${agents.map(a => a.name).join(', ')}`);
            
            // Execute agents in parallel within same priority
            await Promise.all(
                agents.map(agent => this.executeAgent(agent, {
                    userLocation,
                    radiusKm,
                    sports,
                    includeOpenCourts,
                    includePickupGames
                }))
            );
        }

        // Get aggregated results from coordinator
        const coordinatorResults = this.results.get('CoordinatorAgent');
        
        // Update metrics
        this.updateMetrics(startTime);

        return {
            activities: coordinatorResults || {},
            metadata: {
                executionTime: Date.now() - startTime,
                agentsExecuted: this.agents.size,
                cacheUtilization: this.getCacheUtilization(),
                location: userLocation,
                radius: radiusKm,
                timestamp: new Date().toISOString()
            }
        };
    }

    /**
     * Execute a single agent
     */
    async executeAgent(agent, context) {
        const cacheKey = this.getAgentCacheKey(agent.name, context);
        
        // Check cache first
        const cached = this.checkCache(cacheKey, agent.cacheTTL);
        if (cached) {
            this.results.set(agent.name, cached);
            this.metrics.cacheHits++;
            console.log(`✅ ${agent.name} returned cached results`);
            return cached;
        }

        this.metrics.cacheMisses++;
        agent.status = 'running';
        const startTime = Date.now();

        try {
            // Execute agent's custom logic
            const result = await agent.execute(context);
            
            // Store results
            this.results.set(agent.name, result);
            
            // Cache if TTL > 0
            if (agent.cacheTTL > 0) {
                this.cache.set(cacheKey, {
                    data: result,
                    timestamp: Date.now()
                });
            }

            // Update agent metrics
            agent.status = 'completed';
            agent.lastRun = new Date();
            agent.executionTime = Date.now() - startTime;
            
            console.log(`✅ ${agent.name} completed in ${agent.executionTime}ms`);
            
            return result;

        } catch (error) {
            console.error(`❌ ${agent.name} failed:`, error.message);
            agent.status = 'failed';
            agent.errorCount++;
            agent.lastError = error.message;
            
            return null;
        }
    }

    /**
     * Location Scout Agent - Finds nearby venues
     */
    async locationScoutExecutor(context) {
        const { userLocation, radiusKm, sports } = context;
        const venues = [];

        // Get venues from multiple sources
        const sources = localSportsSources.filter(source => 
            source.gameType === 'drop-in' || 
            source.gameType === 'open-field' ||
            source.gameType === 'open-court'
        );

        // Vancouver-specific venues
        const vancouverVenues = [
            // Community Centers
            { name: 'Hillcrest Community Centre', lat: 49.2435, lng: -123.1089, type: 'community-center', sports: ['basketball', 'volleyball', 'badminton'] },
            { name: 'Kerrisdale Community Centre', lat: 49.2344, lng: -123.1597, type: 'community-center', sports: ['basketball', 'badminton'] },
            { name: 'Killarney Community Centre', lat: 49.2292, lng: -123.0465, type: 'community-center', sports: ['basketball', 'soccer'] },
            { name: 'Britannia Community Centre', lat: 49.2751, lng: -123.0715, type: 'community-center', sports: ['basketball', 'volleyball'] },
            { name: 'Sunset Community Centre', lat: 49.2187, lng: -123.1043, type: 'community-center', sports: ['basketball', 'volleyball'] },
            { name: 'Trout Lake Community Centre', lat: 49.2558, lng: -123.0655, type: 'community-center', sports: ['basketball', 'hockey'] },
            { name: 'Mount Pleasant Community Centre', lat: 49.2579, lng: -123.1079, type: 'community-center', sports: ['basketball', 'volleyball'] },
            { name: 'Dunbar Community Centre', lat: 49.2433, lng: -123.1885, type: 'community-center', sports: ['basketball', 'badminton'] },
            
            // Outdoor Courts
            { name: 'David Lam Park', lat: 49.2729, lng: -123.1267, type: 'outdoor-court', sports: ['basketball'] },
            { name: 'Queen Elizabeth Park', lat: 49.2418, lng: -123.1126, type: 'outdoor-court', sports: ['tennis'] },
            { name: 'Stanley Park Tennis Courts', lat: 49.3043, lng: -123.1443, type: 'outdoor-court', sports: ['tennis'] },
            { name: 'Kitsilano Beach', lat: 49.2743, lng: -123.1551, type: 'outdoor-court', sports: ['volleyball', 'basketball'] },
            { name: 'English Bay Beach', lat: 49.2863, lng: -123.1434, type: 'outdoor-court', sports: ['volleyball'] },
            { name: 'Jericho Beach', lat: 49.2719, lng: -123.1961, type: 'outdoor-court', sports: ['volleyball', 'tennis'] },
            
            // University Facilities
            { name: 'UBC War Memorial Gym', lat: 49.2668, lng: -123.2497, type: 'university', sports: ['basketball', 'volleyball', 'badminton'] },
            { name: 'UBC Student Rec Centre', lat: 49.2693, lng: -123.2492, type: 'university', sports: ['basketball', 'squash'] },
            { name: 'SFU Lorne Davies Complex', lat: 49.2781, lng: -122.9199, type: 'university', sports: ['basketball', 'volleyball'] },
            
            // Private Facilities
            { name: 'YMCA Robert Lee', lat: 49.2834, lng: -123.1207, type: 'private', sports: ['basketball', 'swimming'] },
            { name: 'JCC Sports Centre', lat: 49.2385, lng: -123.1274, type: 'private', sports: ['basketball', 'volleyball'] },
            { name: 'Steve Nash Fitness World', lat: 49.2633, lng: -123.1141, type: 'private', sports: ['basketball', 'squash'] },
            
            // Ice Rinks
            { name: 'Killarney Ice Rink', lat: 49.2292, lng: -123.0465, type: 'ice-rink', sports: ['hockey', 'skating'] },
            { name: 'Britannia Ice Rink', lat: 49.2751, lng: -123.0715, type: 'ice-rink', sports: ['hockey', 'skating'] },
            { name: 'Hillcrest Ice Rink', lat: 49.2435, lng: -123.1089, type: 'ice-rink', sports: ['hockey', 'skating'] }
        ];

        // Filter by distance and sports
        const nearbyVenues = vancouverVenues.filter(venue => {
            const distance = this.calculateDistance(
                userLocation.lat, userLocation.lng,
                venue.lat, venue.lng
            );
            
            if (distance > radiusKm) return false;
            
            if (sports.length > 0) {
                return venue.sports.some(sport => sports.includes(sport));
            }
            
            return true;
        }).map(venue => ({
            ...venue,
            distance: this.calculateDistance(
                userLocation.lat, userLocation.lng,
                venue.lat, venue.lng
            )
        }));

        return {
            venues: nearbyVenues.sort((a, b) => a.distance - b.distance),
            totalFound: nearbyVenues.length,
            searchRadius: radiusKm
        };
    }

    /**
     * Schedule Agent - Checks drop-in schedules
     */
    async scheduleAgentExecutor(context) {
        const venues = this.results.get('LocationScoutAgent')?.venues || [];
        const now = new Date();
        const dayOfWeek = now.getDay();
        const currentHour = now.getHours() + now.getMinutes() / 60;
        
        const schedules = [];

        // Get schedules from data swarm for known venues
        try {
            const swarmData = await this.dataSwarm.collectFromAllSources({
                sports: context.sports,
                location: context.userLocation
            });

            // Process swarm data into schedules
            if (swarmData.games) {
                swarmData.games.forEach(game => {
                    schedules.push({
                        venue: game.venue?.name || 'Unknown',
                        sport: game.sport,
                        startTime: game.startTime,
                        endTime: game.endTime,
                        type: game.gameType || 'drop-in',
                        cost: game.cost,
                        source: game.source
                    });
                });
            }
        } catch (error) {
            console.error('Schedule agent swarm error:', error);
        }

        // Add known drop-in schedules for Vancouver venues
        const knownSchedules = {
            'Hillcrest Community Centre': [
                { sport: 'basketball', days: [1, 3], startHour: 19, endHour: 21, cost: 5.50 },
                { sport: 'volleyball', days: [2, 4], startHour: 19, endHour: 21, cost: 5.50 }
            ],
            'Kerrisdale Community Centre': [
                { sport: 'badminton', days: [5], startHour: 10, endHour: 12, cost: 4.50 },
                { sport: 'badminton', days: [5], startHour: 19, endHour: 21, cost: 4.50 }
            ],
            'Killarney Community Centre': [
                { sport: 'basketball', days: [6], startHour: 14, endHour: 16, cost: 3.50 },
                { sport: 'soccer', days: [0], startHour: 10, endHour: 12, cost: 5.50 }
            ],
            'UBC War Memorial Gym': [
                { sport: 'volleyball', days: [1, 3, 5], startHour: 18, endHour: 20, cost: 8.00 }
            ],
            'Britannia Community Centre': [
                { sport: 'basketball', days: [1, 2, 3, 4, 5], startHour: 21, endHour: 23, cost: 5.50 }
            ]
        };

        // Check current and upcoming schedules
        venues.forEach(venue => {
            const venueSchedules = knownSchedules[venue.name] || [];
            
            venueSchedules.forEach(schedule => {
                if (schedule.days.includes(dayOfWeek)) {
                    const status = this.getScheduleStatus(schedule, currentHour);
                    if (status) {
                        schedules.push({
                            venue: venue.name,
                            venueType: venue.type,
                            distance: venue.distance,
                            sport: schedule.sport,
                            ...schedule,
                            ...status
                        });
                    }
                }
            });
        });

        return {
            schedules: schedules.sort((a, b) => {
                // Sort by status priority then distance
                const statusPriority = { 'happening-now': 0, 'starting-soon': 1, 'later-today': 2 };
                const aPriority = statusPriority[a.status] || 3;
                const bPriority = statusPriority[b.status] || 3;
                
                if (aPriority !== bPriority) return aPriority - bPriority;
                return a.distance - b.distance;
            }),
            currentTime: now.toISOString()
        };
    }

    /**
     * Availability Agent - Real-time availability checker
     */
    async availabilityAgentExecutor(context) {
        const venues = this.results.get('LocationScoutAgent')?.venues || [];
        const availability = [];

        // Simulate real-time availability data
        // In production, this would check actual APIs or scrape real-time data
        venues.forEach(venue => {
            if (venue.type === 'outdoor-court') {
                // Outdoor courts are generally first-come-first-served
                availability.push({
                    venue: venue.name,
                    type: venue.type,
                    status: 'open',
                    availability: 'First come, first served',
                    estimatedWait: Math.random() < 0.3 ? '10-15 min' : 'No wait',
                    currentPlayers: Math.floor(Math.random() * 20),
                    busyLevel: Math.random() < 0.5 ? 'moderate' : 'busy',
                    lastUpdated: new Date().toISOString()
                });
            } else if (venue.type === 'community-center') {
                // Community centers have capacity limits
                const capacity = 30;
                const current = Math.floor(Math.random() * capacity);
                availability.push({
                    venue: venue.name,
                    type: venue.type,
                    status: current < capacity * 0.9 ? 'open' : 'nearly-full',
                    availability: `${current}/${capacity} players`,
                    spotsLeft: capacity - current,
                    estimatedWait: current > capacity * 0.8 ? '15-30 min' : 'No wait',
                    lastUpdated: new Date().toISOString()
                });
            }
        });

        // Check field conditions for outdoor venues
        const outdoorVenues = venues.filter(v => v.type === 'outdoor-court');
        if (outdoorVenues.length > 0) {
            const weather = this.results.get('WeatherAgent');
            if (weather?.current?.isRaining) {
                outdoorVenues.forEach(venue => {
                    const venueAvail = availability.find(a => a.venue === venue.name);
                    if (venueAvail) {
                        venueAvail.status = 'weather-affected';
                        venueAvail.availability = 'Check conditions';
                        venueAvail.note = 'Wet courts - use caution';
                    }
                });
            }
        }

        return {
            availability,
            lastChecked: new Date().toISOString()
        };
    }

    /**
     * Weather Agent - Weather conditions checker
     */
    async weatherAgentExecutor(context) {
        const { userLocation } = context;
        
        // Simulate weather data for Vancouver
        // In production, use a real weather API
        const vancouverWeather = {
            current: {
                temp: 12 + Math.random() * 8, // 12-20°C typical Vancouver
                condition: Math.random() < 0.3 ? 'rainy' : (Math.random() < 0.5 ? 'cloudy' : 'sunny'),
                windSpeed: Math.floor(Math.random() * 20),
                humidity: 60 + Math.random() * 20,
                isRaining: Math.random() < 0.3, // 30% chance of rain in Vancouver!
                lastUpdated: new Date().toISOString()
            },
            forecast: {
                next2Hours: Math.random() < 0.4 ? 'rain-likely' : 'dry',
                sunset: '19:45'
            },
            outdoorConditions: {
                basketball: 'good',
                tennis: 'good',
                soccer: 'fair',
                volleyball: 'good'
            }
        };

        // Adjust outdoor conditions based on weather
        if (vancouverWeather.current.isRaining) {
            vancouverWeather.outdoorConditions = {
                basketball: 'poor',
                tennis: 'unplayable',
                soccer: 'poor',
                volleyball: 'poor'
            };
        }

        return vancouverWeather;
    }

    /**
     * Coordinator Agent - Aggregates all data
     */
    async coordinatorAgentExecutor(context) {
        // Gather all agent results
        const venues = this.results.get('LocationScoutAgent')?.venues || [];
        const schedules = this.results.get('ScheduleAgent')?.schedules || [];
        const availability = this.results.get('AvailabilityAgent')?.availability || [];
        const weather = this.results.get('WeatherAgent');

        // Aggregate into final format
        const activities = {
            happeningNow: [],
            startingSoon: [],
            laterToday: [],
            openCourts: [],
            pickupGames: []
        };

        // Process scheduled activities
        schedules.forEach(schedule => {
            const venue = venues.find(v => v.name === schedule.venue);
            const avail = availability.find(a => a.venue === schedule.venue);
            
            const activity = {
                id: `${schedule.venue}-${schedule.sport}-${schedule.startHour}`,
                sport: schedule.sport,
                venue: schedule.venue,
                venueType: schedule.venueType,
                distance: `${(schedule.distance || 0).toFixed(1)} km`,
                distanceValue: schedule.distance || 0,
                cost: schedule.cost,
                status: schedule.status,
                timeString: schedule.timeString,
                startsIn: schedule.startsIn,
                endsIn: schedule.endsIn,
                availability: avail?.availability,
                spotsLeft: avail?.spotsLeft,
                currentPlayers: avail?.currentPlayers,
                coordinates: venue ? { lat: venue.lat, lng: venue.lng } : null
            };

            if (schedule.status === 'happening-now') {
                activities.happeningNow.push(activity);
            } else if (schedule.status === 'starting-soon') {
                activities.startingSoon.push(activity);
            } else if (schedule.status === 'later-today') {
                activities.laterToday.push(activity);
            }
        });

        // Process open courts
        if (context.includeOpenCourts) {
            const outdoorVenues = venues.filter(v => v.type === 'outdoor-court');
            outdoorVenues.forEach(venue => {
                const avail = availability.find(a => a.venue === venue.name);
                const isPlayable = !weather?.current?.isRaining || venue.sports.includes('basketball');
                
                activities.openCourts.push({
                    id: `open-${venue.name}`,
                    venue: venue.name,
                    type: venue.sports.join(', '),
                    distance: `${venue.distance.toFixed(1)} km`,
                    distanceValue: venue.distance,
                    status: isPlayable ? 'open' : 'weather-affected',
                    availability: avail?.availability || 'First come, first served',
                    currentPlayers: avail?.currentPlayers,
                    busyLevel: avail?.busyLevel,
                    coordinates: { lat: venue.lat, lng: venue.lng },
                    condition: weather?.current?.isRaining ? 'Wet courts' : 'Good condition'
                });
            });
        }

        // Add mock pickup games
        if (context.includePickupGames) {
            activities.pickupGames = [
                {
                    id: 'pickup-1',
                    sport: 'soccer',
                    organizer: 'Vancouver Pickup Soccer',
                    venue: 'Andy Livingstone Park',
                    distance: '2.5 km',
                    distanceValue: 2.5,
                    time: '6:00 PM',
                    playersNeeded: 3,
                    skillLevel: 'Casual',
                    platform: 'Facebook Group'
                },
                {
                    id: 'pickup-2',
                    sport: 'basketball',
                    organizer: 'OpenSports App',
                    venue: 'David Lam Park',
                    distance: '1.8 km',
                    distanceValue: 1.8,
                    time: '7:30 PM',
                    spotsLeft: 2,
                    skillLevel: 'Intermediate',
                    platform: 'OpenSports'
                }
            ];
        }

        // Sort all by distance
        Object.keys(activities).forEach(key => {
            if (Array.isArray(activities[key])) {
                activities[key].sort((a, b) => (a.distanceValue || 0) - (b.distanceValue || 0));
            }
        });

        return activities;
    }

    /**
     * Helper methods
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    getScheduleStatus(schedule, currentHour) {
        const { startHour, endHour } = schedule;
        
        if (currentHour >= startHour && currentHour < endHour) {
            return {
                status: 'happening-now',
                timeString: `${this.formatHour(startHour)} - ${this.formatHour(endHour)}`,
                endsIn: this.getTimeUntil(endHour, currentHour)
            };
        }
        
        if (currentHour < startHour && startHour - currentHour <= 2) {
            return {
                status: 'starting-soon',
                timeString: `${this.formatHour(startHour)} - ${this.formatHour(endHour)}`,
                startsIn: this.getTimeUntil(startHour, currentHour)
            };
        }
        
        if (currentHour < startHour) {
            return {
                status: 'later-today',
                timeString: `${this.formatHour(startHour)} - ${this.formatHour(endHour)}`,
                startsIn: this.getTimeUntil(startHour, currentHour)
            };
        }
        
        return null;
    }

    formatHour(hour) {
        const h = Math.floor(hour);
        const m = Math.round((hour - h) * 60);
        const period = h >= 12 ? 'PM' : 'AM';
        const displayHour = h > 12 ? h - 12 : (h === 0 ? 12 : h);
        return m > 0 ? `${displayHour}:${m.toString().padStart(2, '0')} ${period}` : `${displayHour}:00 ${period}`;
    }

    getTimeUntil(targetHour, currentHour) {
        const diff = targetHour - currentHour;
        const hours = Math.floor(diff);
        const mins = Math.round((diff - hours) * 60);
        
        if (hours > 0 && mins > 0) {
            return `${hours}h ${mins}m`;
        } else if (hours > 0) {
            return `${hours} hour${hours > 1 ? 's' : ''}`;
        } else {
            return `${mins} minutes`;
        }
    }

    groupAgentsByPriority() {
        const groups = new Map();
        
        this.agents.forEach(agent => {
            if (!groups.has(agent.priority)) {
                groups.set(agent.priority, []);
            }
            groups.get(agent.priority).push(agent);
        });
        
        return new Map([...groups.entries()].sort((a, b) => a[0] - b[0]));
    }

    getAgentCacheKey(agentName, context) {
        return `${agentName}:${context.userLocation.lat},${context.userLocation.lng}:${context.radiusKm}:${context.sports.join(',')}`;
    }

    checkCache(key, ttl) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        const age = Date.now() - cached.timestamp;
        if (age > ttl) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }

    updateMetrics(startTime) {
        this.metrics.totalRequests++;
        const executionTime = Date.now() - startTime;
        
        // Update average response time
        this.metrics.avgResponseTime = 
            (this.metrics.avgResponseTime * (this.metrics.totalRequests - 1) + executionTime) / 
            this.metrics.totalRequests;
        
        // Update agent execution counts
        this.agents.forEach(agent => {
            if (!this.metrics.agentExecutions[agent.name]) {
                this.metrics.agentExecutions[agent.name] = 0;
            }
            if (agent.status === 'completed') {
                this.metrics.agentExecutions[agent.name]++;
            }
        });
    }

    getCacheUtilization() {
        const total = this.metrics.cacheHits + this.metrics.cacheMisses;
        if (total === 0) return 0;
        return (this.metrics.cacheHits / total * 100).toFixed(1) + '%';
    }

    /**
     * Get swarm status and metrics
     */
    getStatus() {
        const agentStatuses = [];
        
        this.agents.forEach(agent => {
            agentStatuses.push({
                name: agent.name,
                role: agent.role,
                status: agent.status,
                lastRun: agent.lastRun,
                executionTime: agent.executionTime,
                errorCount: agent.errorCount,
                cacheTTL: agent.cacheTTL
            });
        });

        return {
            agents: agentStatuses,
            metrics: this.metrics,
            cacheSize: this.cache.size,
            resultsAvailable: this.results.size
        };
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        console.log('🧹 Play Now Swarm cache cleared');
    }
}

// Singleton instance
let instance;

module.exports = {
    getInstance: () => {
        if (!instance) {
            instance = new PlayNowSwarm();
        }
        return instance;
    },
    PlayNowSwarm
};