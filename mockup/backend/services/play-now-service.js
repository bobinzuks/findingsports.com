const EventEmitter = require('events');
const { getInstance: getDataPipeline } = require('./data-aggregation-pipeline');
const { getInstance: getDataSwarm } = require('./data-aggregation-swarm');
const { getInstance: getPlayNowSwarm } = require('./play-now-swarm');
const { localSportsSources } = require('./local-sports-sources');
const fs = require('fs').promises;
const path = require('path');

/**
 * Play Now Service
 * Provides real-time information about games happening now or soon
 */
class PlayNowService extends EventEmitter {
    constructor() {
        super();
        this.dataPipeline = getDataPipeline();
        this.dataSwarm = getDataSwarm();
        this.playNowSwarm = getPlayNowSwarm();
        
        // Real data from North Vancouver Recreation Centers
        this.realSchedules = new Map();
        this.loadRealData();
        
        // Mock data as fallback
        this.mockSchedules = this.initializeMockSchedules();
        
        // Configuration
        this.config = {
            useRealData: true, // Use real data by default
            useSwarm: true, // Enable swarm for additional sources
            fallbackToMock: true, // Use mock data if all else fails
            swarmTimeout: 5000 // 5 second timeout for swarm
        };
    }

    /**
     * Initialize mock schedules for demo
     */
    initializeMockSchedules() {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const hour = now.getHours();
        
        return {
            'hillcrest-community-centre': {
                name: 'Hillcrest Community Centre',
                address: '4575 Clancy Loranger Way, Vancouver',
                coordinates: { lat: 49.2435, lng: -123.1089 },
                activities: [
                    {
                        sport: 'basketball',
                        type: 'drop-in',
                        schedule: { 
                            days: [1, 3], // Monday, Wednesday
                            startHour: 19, 
                            endHour: 21 
                        },
                        cost: 5.50,
                        ageGroup: 'Adult (19+)',
                        capacity: 30
                    },
                    {
                        sport: 'volleyball',
                        type: 'drop-in',
                        schedule: { 
                            days: [2, 4], // Tuesday, Thursday
                            startHour: 19, 
                            endHour: 21 
                        },
                        cost: 5.50,
                        ageGroup: 'Adult (19+)',
                        capacity: 24
                    }
                ]
            },
            'kerrisdale-community-centre': {
                name: 'Kerrisdale Community Centre',
                address: '5851 West Boulevard, Vancouver',
                coordinates: { lat: 49.2344, lng: -123.1597 },
                activities: [
                    {
                        sport: 'badminton',
                        type: 'drop-in',
                        schedule: { 
                            days: [5], // Friday
                            startHour: 10, 
                            endHour: 12 
                        },
                        cost: 4.50,
                        ageGroup: 'All Ages',
                        capacity: 20
                    },
                    {
                        sport: 'badminton',
                        type: 'drop-in',
                        schedule: { 
                            days: [5], // Friday
                            startHour: 19, 
                            endHour: 21 
                        },
                        cost: 4.50,
                        ageGroup: 'All Ages',
                        capacity: 20
                    }
                ]
            },
            'killarney-community-centre': {
                name: 'Killarney Community Centre',
                address: '6260 Killarney Street, Vancouver',
                coordinates: { lat: 49.2292, lng: -123.0465 },
                activities: [
                    {
                        sport: 'basketball',
                        type: 'drop-in',
                        schedule: { 
                            days: [6], // Saturday
                            startHour: 14, 
                            endHour: 16 
                        },
                        cost: 3.50,
                        ageGroup: 'Youth (13-18)',
                        capacity: 30
                    },
                    {
                        sport: 'soccer',
                        type: 'drop-in indoor',
                        schedule: { 
                            days: [0], // Sunday
                            startHour: 10, 
                            endHour: 12 
                        },
                        cost: 5.50,
                        ageGroup: 'Adult (19+)',
                        capacity: 40
                    }
                ]
            },
            'ubc-war-memorial': {
                name: 'UBC War Memorial Gym',
                address: '6081 University Blvd, Vancouver',
                coordinates: { lat: 49.2668, lng: -123.2497 },
                activities: [
                    {
                        sport: 'volleyball',
                        type: 'drop-in',
                        schedule: { 
                            days: [1, 3, 5], // Mon, Wed, Fri
                            startHour: 18, 
                            endHour: 20 
                        },
                        cost: 8.00,
                        skillLevel: 'Intermediate/Advanced',
                        capacity: 60,
                        courts: 3
                    }
                ]
            },
            'britannia-community-centre': {
                name: 'Britannia Community Centre',
                address: '1661 Napier St, Vancouver',
                coordinates: { lat: 49.2751, lng: -123.0715 },
                activities: [
                    {
                        sport: 'basketball',
                        type: 'drop-in',
                        schedule: { 
                            days: [1, 2, 3, 4, 5], // Weekdays
                            startHour: 21, 
                            endHour: 23 
                        },
                        cost: 5.50,
                        ageGroup: 'Adult (19+)',
                        note: 'Late night basketball',
                        capacity: 30
                    }
                ]
            },
            'killarney-ice-rink': {
                name: 'Killarney Ice Rink',
                address: '6260 Killarney St, Vancouver',
                coordinates: { lat: 49.2292, lng: -123.0465 },
                activities: [
                    {
                        sport: 'hockey',
                        type: 'shinny',
                        schedule: { 
                            days: [5], // Friday
                            startHour: 21, 
                            endHour: 22.5 
                        },
                        cost: 8.00,
                        note: 'Full equipment required',
                        capacity: 40
                    },
                    {
                        sport: 'skating',
                        type: 'public skate',
                        schedule: { 
                            days: [6], // Saturday
                            startHour: 14, 
                            endHour: 16 
                        },
                        cost: 5.50,
                        costChild: 3.75,
                        capacity: 150
                    }
                ]
            }
        };
    }

    /**
     * Load real data from JSON files and other sources
     */
    async loadRealData() {
        try {
            // Load North Vancouver Recreation drop-in games
            const nvrcPath = path.join(__dirname, '..', 'data', 'nvrc-dropin-games.json');
            const nvrcData = await fs.readFile(nvrcPath, 'utf8');
            const nvrcGames = JSON.parse(nvrcData);
            
            // Convert to our format and store
            nvrcGames.forEach(game => {
                const venueId = game.venue.name.toLowerCase().replace(/\s+/g, '-');
                
                if (!this.realSchedules.has(venueId)) {
                    this.realSchedules.set(venueId, {
                        name: game.venue.name,
                        address: game.venue.address,
                        coordinates: game.venue.coordinates,
                        activities: []
                    });
                }
                
                // Parse time (e.g., "7:00pm-9:00pm")
                const [startTime, endTime] = game.time.split('-');
                const startHour = this.parseTimeToHour(startTime);
                const endHour = this.parseTimeToHour(endTime);
                const dayNumber = this.getDayNumber(game.day);
                
                this.realSchedules.get(venueId).activities.push({
                    sport: game.sport,
                    type: 'drop-in',
                    schedule: {
                        days: [dayNumber],
                        startHour,
                        endHour
                    },
                    cost: 8.50, // Standard NVRC drop-in rate
                    ageGroup: game.type.includes('Adult') ? 'Adult (19+)' : 'All Ages',
                    capacity: 30, // Default capacity
                    source: 'North Vancouver Recreation',
                    realData: true
                });
            });
            
            console.log(`✅ Loaded ${this.realSchedules.size} real venues with ${nvrcGames.length} activities`);
            
        } catch (error) {
            console.error('Error loading real data:', error);
        }
    }
    
    /**
     * Parse time string to hour number
     */
    parseTimeToHour(timeStr) {
        const time = timeStr.trim();
        const isPM = time.toLowerCase().includes('pm');
        const isAM = time.toLowerCase().includes('am');
        
        let [hours, minutes] = time.replace(/[amp]/gi, '').trim().split(':');
        hours = parseInt(hours);
        minutes = minutes ? parseInt(minutes) : 0;
        
        if (isPM && hours !== 12) hours += 12;
        if (isAM && hours === 12) hours = 0;
        
        return hours + (minutes / 60);
    }
    
    /**
     * Get day number from day name
     */
    getDayNumber(dayName) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days.indexOf(dayName);
    }

    /**
     * Get activities happening now or soon
     */
    async getPlayNowActivities(userLocation, options = {}) {
        const {
            radiusKm = 10,
            timeWindowHours = 2,
            includeFuture = true,
            includeOpenCourts = true,
            includePickupGames = true,
            sports = []
        } = options;

        // Try to use real data first
        if (this.config.useRealData && this.realSchedules.size > 0) {
            try {
                console.log('📊 Using real data from North Vancouver Recreation...');
                const realActivities = await this.getRealActivities(userLocation, options);
                
                if (realActivities && Object.values(realActivities).some(arr => arr.length > 0)) {
                    console.log('✅ Found real activities');
                    this.emit('data:source', { source: 'real-data', success: true });
                    
                    // Enhance with swarm data if available
                    if (this.config.useSwarm) {
                        try {
                            const swarmActivities = await this.getSwarmActivities(userLocation, options);
                            return this.mergeActivities(realActivities, swarmActivities);
                        } catch (error) {
                            console.log('⚠️ Swarm enhancement failed, using real data only');
                        }
                    }
                    
                    return realActivities;
                }
            } catch (error) {
                console.error('⚠️ Real data error:', error.message);
                this.emit('data:source', { source: 'real-data', success: false, error: error.message });
            }
        }
        
        // Try to use swarm for real-time data
        if (this.config.useSwarm) {
            try {
                console.log('🐝 Using Play Now Swarm for real-time data...');
                
                // Create timeout promise
                const timeoutPromise = new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Swarm timeout')), this.config.swarmTimeout)
                );
                
                // Race between swarm and timeout
                const swarmResult = await Promise.race([
                    this.playNowSwarm.findGamesNow(userLocation, {
                        radiusKm,
                        sports,
                        includeOpenCourts,
                        includePickupGames
                    }),
                    timeoutPromise
                ]);
                
                if (swarmResult && swarmResult.activities) {
                    console.log('✅ Swarm returned real-time data');
                    this.emit('data:source', { source: 'swarm', success: true });
                    return swarmResult.activities;
                }
            } catch (error) {
                console.error('⚠️ Swarm error, falling back to mock data:', error.message);
                this.emit('data:source', { source: 'swarm', success: false, error: error.message });
            }
        }

        // Fallback to mock data
        if (this.config.fallbackToMock) {
            console.log('📋 Using mock data');
            return this.getMockActivities(userLocation, options);
        }

        // If no fallback, return empty activities
        return {
            happeningNow: [],
            startingSoon: [],
            laterToday: [],
            openCourts: [],
            pickupGames: []
        };
    }

    /**
     * Get real activities from loaded data
     */
    async getRealActivities(userLocation, options = {}) {
        const {
            radiusKm = 10,
            includeOpenCourts = true,
            includePickupGames = true
        } = options;

        const now = new Date();
        const activities = {
            happeningNow: [],
            startingSoon: [],
            laterToday: [],
            openCourts: [],
            pickupGames: []
        };

        // Get activities from real schedules
        for (const [venueId, venue] of this.realSchedules) {
            const distance = this.calculateDistance(
                userLocation.lat, 
                userLocation.lng,
                venue.coordinates.lat,
                venue.coordinates.lng
            );

            if (distance <= radiusKm) {
                venue.activities.forEach(activity => {
                    const activityStatus = this.getActivityStatus(activity, now);
                    
                    if (activityStatus) {
                        const activityData = {
                            id: `${venueId}-${activity.sport}-${activityStatus.startTime}`,
                            sport: activity.sport,
                            type: activity.type,
                            venue: venue.name,
                            address: venue.address,
                            coordinates: venue.coordinates,
                            lat: venue.coordinates.lat,
                            lng: venue.coordinates.lng,
                            distance: `${distance.toFixed(1)} km`,
                            distanceValue: distance,
                            cost: activity.cost,
                            ageGroup: activity.ageGroup,
                            capacity: activity.capacity,
                            source: activity.source,
                            isRealData: true,
                            ...activityStatus
                        };

                        if (activityStatus.status === 'happening-now') {
                            activities.happeningNow.push(activityData);
                        } else if (activityStatus.status === 'starting-soon') {
                            activities.startingSoon.push(activityData);
                        } else if (activityStatus.status === 'later-today') {
                            activities.laterToday.push(activityData);
                        }
                    }
                });
            }
        }

        // Add open courts (combine real venue data with availability)
        if (includeOpenCourts) {
            activities.openCourts = await this.getRealOpenCourts(userLocation, radiusKm);
        }

        // Add pickup games from various sources
        if (includePickupGames) {
            activities.pickupGames = await this.getRealPickupGames(userLocation, radiusKm);
        }

        // Sort by distance
        ['happeningNow', 'startingSoon', 'laterToday'].forEach(category => {
            activities[category].sort((a, b) => a.distanceValue - b.distanceValue);
        });

        return activities;
    }
    
    /**
     * Get swarm activities
     */
    async getSwarmActivities(userLocation, options) {
        try {
            console.log('🐝 Fetching additional data from swarm...');
            
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Swarm timeout')), this.config.swarmTimeout)
            );
            
            const swarmResult = await Promise.race([
                this.playNowSwarm.findGamesNow(userLocation, options),
                timeoutPromise
            ]);
            
            return swarmResult?.activities || {};
        } catch (error) {
            console.error('⚠️ Swarm error:', error.message);
            return {};
        }
    }
    
    /**
     * Merge activities from multiple sources
     */
    mergeActivities(primary, secondary) {
        const merged = { ...primary };
        
        Object.keys(secondary).forEach(category => {
            if (Array.isArray(secondary[category]) && Array.isArray(merged[category])) {
                // Add unique activities from secondary
                secondary[category].forEach(activity => {
                    const isDuplicate = merged[category].some(existing => 
                        existing.venue === activity.venue && 
                        existing.sport === activity.sport &&
                        existing.startTime === activity.startTime
                    );
                    
                    if (!isDuplicate) {
                        merged[category].push(activity);
                    }
                });
                
                // Re-sort by distance
                merged[category].sort((a, b) => (a.distanceValue || 0) - (b.distanceValue || 0));
            }
        });
        
        return merged;
    }
    
    /**
     * Get real open courts based on venue data
     */
    async getRealOpenCourts(userLocation, radiusKm) {
        // This would integrate with real facility availability data
        // For now, return known outdoor courts that are typically available
        const courts = [
            {
                id: 'mahon-park-tennis',
                type: 'tennis',
                venue: 'Mahon Park',
                address: '1600 Block Jones Ave, North Vancouver',
                coordinates: { lat: 49.3230, lng: -123.0802 },
                status: 'open',
                courts: 4,
                surface: 'hard court',
                lights: 'No',
                source: 'North Vancouver Parks'
            },
            {
                id: 'boulevard-park-basketball',
                type: 'basketball',
                venue: 'Boulevard Park',
                address: 'Grand Boulevard & 17th St, North Vancouver',
                coordinates: { lat: 49.3251, lng: -123.0584 },
                status: 'open',
                courts: 2,
                surface: 'outdoor',
                lights: 'Until dusk',
                source: 'North Vancouver Parks'
            }
        ];
        
        return courts
            .map(court => {
                const distance = this.calculateDistance(
                    userLocation.lat,
                    userLocation.lng,
                    court.coordinates.lat,
                    court.coordinates.lng
                );
                return {
                    ...court,
                    lat: court.coordinates.lat,
                    lng: court.coordinates.lng,
                    distance: `${distance.toFixed(1)} km`,
                    distanceValue: distance,
                    isRealData: true
                };
            })
            .filter(court => court.distanceValue <= radiusKm)
            .sort((a, b) => a.distanceValue - b.distanceValue);
    }
    
    /**
     * Get real pickup games from community sources
     */
    async getRealPickupGames(userLocation, radiusKm) {
        // This would integrate with social media APIs, community boards, etc.
        // For now, return known regular pickup games
        const games = [
            {
                id: 'lynn-valley-soccer',
                sport: 'soccer',
                organizer: 'Lynn Valley Soccer Group',
                platform: 'Community Board',
                venue: 'Lynn Valley Elementary School',
                coordinates: { lat: 49.3370, lng: -123.0168 },
                status: 'scheduled',
                time: 'Sundays 10:00 AM',
                playersNeeded: 5,
                skillLevel: 'All Levels',
                joinMethod: 'Just show up!',
                source: 'Community Board'
            }
        ];
        
        return games
            .map(game => {
                const distance = this.calculateDistance(
                    userLocation.lat,
                    userLocation.lng,
                    game.coordinates.lat,
                    game.coordinates.lng
                );
                return {
                    ...game,
                    lat: game.coordinates.lat,
                    lng: game.coordinates.lng,
                    distance: `${distance.toFixed(1)} km`,
                    distanceValue: distance,
                    isRealData: true
                };
            })
            .filter(game => game.distanceValue <= radiusKm)
            .sort((a, b) => a.distanceValue - b.distanceValue);
    }

    /**
     * Get mock activities (original implementation)
     */
    async getMockActivities(userLocation, options = {}) {
        const {
            radiusKm = 10,
            includeOpenCourts = true
        } = options;

        const now = new Date();
        const activities = {
            happeningNow: [],
            startingSoon: [],
            laterToday: [],
            openCourts: [],
            pickupGames: []
        };

        // Get activities from mock schedules
        for (const [facilityId, facility] of Object.entries(this.mockSchedules)) {
            const distance = this.calculateDistance(
                userLocation.lat, 
                userLocation.lng,
                facility.coordinates.lat,
                facility.coordinates.lng
            );

            if (distance <= radiusKm) {
                facility.activities.forEach(activity => {
                    const activityStatus = this.getActivityStatus(activity, now);
                    
                    if (activityStatus) {
                        const activityData = {
                            id: `${facilityId}-${activity.sport}-${activityStatus.startTime}`,
                            sport: activity.sport,
                            type: activity.type,
                            venue: facility.name,
                            address: facility.address,
                            coordinates: facility.coordinates,
                            distance: `${distance.toFixed(1)} km`,
                            distanceValue: distance,
                            cost: activity.cost,
                            costChild: activity.costChild,
                            ageGroup: activity.ageGroup,
                            skillLevel: activity.skillLevel,
                            capacity: activity.capacity,
                            courts: activity.courts,
                            note: activity.note,
                            ...activityStatus
                        };

                        if (activityStatus.status === 'happening-now') {
                            activities.happeningNow.push(activityData);
                        } else if (activityStatus.status === 'starting-soon') {
                            activities.startingSoon.push(activityData);
                        } else if (activityStatus.status === 'later-today') {
                            activities.laterToday.push(activityData);
                        }
                    }
                });
            }
        }

        // Add open courts/fields
        if (includeOpenCourts) {
            activities.openCourts = this.getOpenCourts(userLocation, radiusKm);
        }

        // Add pickup games
        activities.pickupGames = this.getPickupGames(userLocation, radiusKm);

        // Sort by distance
        ['happeningNow', 'startingSoon', 'laterToday'].forEach(category => {
            activities[category].sort((a, b) => a.distanceValue - b.distanceValue);
        });

        return activities;
    }

    /**
     * Check if an activity is happening now or soon
     */
    getActivityStatus(activity, now) {
        const dayOfWeek = now.getDay();
        const currentHour = now.getHours() + now.getMinutes() / 60;

        if (!activity.schedule.days.includes(dayOfWeek)) {
            // Check if it's later today
            const nextToday = activity.schedule.days.find(d => d === dayOfWeek);
            if (nextToday !== undefined && activity.schedule.startHour > currentHour) {
                return {
                    status: 'later-today',
                    timeString: `${this.formatHour(activity.schedule.startHour)} - ${this.formatHour(activity.schedule.endHour)}`,
                    startTime: this.getTimeToday(activity.schedule.startHour),
                    endTime: this.getTimeToday(activity.schedule.endHour),
                    startsIn: this.getTimeUntil(activity.schedule.startHour, currentHour)
                };
            }
            return null;
        }

        const startHour = activity.schedule.startHour;
        const endHour = activity.schedule.endHour;

        // Activity is happening now
        if (currentHour >= startHour && currentHour < endHour) {
            const startedMins = Math.floor((currentHour - startHour) * 60);
            return {
                status: 'happening-now',
                timeString: `${this.formatHour(startHour)} - ${this.formatHour(endHour)}`,
                startTime: this.getTimeToday(startHour),
                endTime: this.getTimeToday(endHour),
                startedAgo: startedMins < 60 ? `${startedMins} minutes ago` : `${Math.floor(startedMins/60)} hour${startedMins >= 120 ? 's' : ''} ago`,
                endsIn: this.getTimeUntil(endHour, currentHour)
            };
        }

        // Activity is starting soon (within 2 hours)
        if (currentHour < startHour && startHour - currentHour <= 2) {
            return {
                status: 'starting-soon',
                timeString: `${this.formatHour(startHour)} - ${this.formatHour(endHour)}`,
                startTime: this.getTimeToday(startHour),
                endTime: this.getTimeToday(endHour),
                startsIn: this.getTimeUntil(startHour, currentHour)
            };
        }

        // Activity is later today
        if (currentHour < startHour) {
            return {
                status: 'later-today',
                timeString: `${this.formatHour(startHour)} - ${this.formatHour(endHour)}`,
                startTime: this.getTimeToday(startHour),
                endTime: this.getTimeToday(endHour),
                startsIn: this.getTimeUntil(startHour, currentHour)
            };
        }

        return null;
    }

    /**
     * Get open courts and fields
     */
    getOpenCourts(userLocation, radiusKm) {
        const courts = [
            {
                id: 'david-lam-basketball',
                type: 'basketball',
                venue: 'David Lam Park',
                address: 'Pacific Blvd & Drake St, Vancouver',
                coordinates: { lat: 49.2729, lng: -123.1267 },
                status: 'open',
                courts: 2,
                surface: 'outdoor',
                lights: 'Until 10 PM',
                busyTimes: 'Usually busy 6-8 PM'
            },
            {
                id: 'qe-tennis',
                type: 'tennis', 
                venue: 'Queen Elizabeth Park',
                address: '4600 Cambie St, Vancouver',
                coordinates: { lat: 49.2418, lng: -123.1126 },
                status: 'open',
                courts: 17,
                surface: 'hard court',
                availability: 'First come, first served',
                busyTimes: 'Peak: 5-7 PM'
            },
            {
                id: 'trout-lake-soccer',
                type: 'soccer',
                venue: 'Trout Lake Park',
                address: '3300 Victoria Dr, Vancouver',
                coordinates: { lat: 49.2558, lng: -123.0655 },
                status: 'partial',
                fields: 2,
                condition: 'Field 1: Open (Good), Field 2: Closed (Standing water)',
                surface: 'grass'
            }
        ];

        return courts
            .map(court => {
                const distance = this.calculateDistance(
                    userLocation.lat,
                    userLocation.lng,
                    court.coordinates.lat,
                    court.coordinates.lng
                );
                return {
                    ...court,
                    distance: `${distance.toFixed(1)} km`,
                    distanceValue: distance
                };
            })
            .filter(court => court.distanceValue <= radiusKm)
            .sort((a, b) => a.distanceValue - b.distanceValue);
    }

    /**
     * Get pickup games from social sources
     */
    getPickupGames(userLocation, radiusKm) {
        const now = new Date();
        const hour = now.getHours();

        const games = [
            {
                id: 'fb-soccer-andy',
                sport: 'soccer',
                organizer: 'Vancouver Pickup Soccer',
                platform: 'Facebook Group',
                venue: 'Andy Livingstone Park',
                coordinates: { lat: 49.2846, lng: -123.1026 },
                status: hour >= 18 && hour < 20 ? 'active' : 'scheduled',
                time: '6:00 PM - 8:00 PM',
                playersNeeded: 3,
                skillLevel: 'Casual/Intermediate',
                joinMethod: 'Message on Facebook group'
            },
            {
                id: 'opensports-basketball',
                sport: 'basketball',
                organizer: 'OpenSports App',
                platform: 'OpenSports',
                venue: 'Sunset Community Centre',
                coordinates: { lat: 49.2187, lng: -123.1043 },
                status: 'scheduled',
                time: '8:00 PM',
                spotsLeft: 2,
                skillLevel: 'Competitive',
                joinMethod: 'Join via OpenSports app'
            }
        ];

        return games
            .map(game => {
                const distance = this.calculateDistance(
                    userLocation.lat,
                    userLocation.lng,
                    game.coordinates.lat,
                    game.coordinates.lng
                );
                return {
                    ...game,
                    distance: `${distance.toFixed(1)} km`,
                    distanceValue: distance
                };
            })
            .filter(game => game.distanceValue <= radiusKm)
            .sort((a, b) => a.distanceValue - b.distanceValue);
    }

    /**
     * Helper functions
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

    formatHour(hour) {
        const h = Math.floor(hour);
        const m = Math.round((hour - h) * 60);
        const period = h >= 12 ? 'PM' : 'AM';
        const displayHour = h > 12 ? h - 12 : (h === 0 ? 12 : h);
        return m > 0 ? `${displayHour}:${m.toString().padStart(2, '0')} ${period}` : `${displayHour}:00 ${period}`;
    }

    getTimeToday(hour) {
        const now = new Date();
        const time = new Date(now);
        time.setHours(Math.floor(hour), Math.round((hour % 1) * 60), 0, 0);
        return time;
    }

    getTimeUntil(targetHour, currentHour) {
        const diff = targetHour - currentHour;
        const hours = Math.floor(diff);
        const mins = Math.round((diff - hours) * 60);
        
        if (hours > 0 && mins > 0) {
            return `${hours} hour${hours > 1 ? 's' : ''} ${mins} min`;
        } else if (hours > 0) {
            return `${hours} hour${hours > 1 ? 's' : ''}`;
        } else {
            return `${mins} minutes`;
        }
    }

    /**
     * Enable or disable swarm usage
     */
    setSwarmEnabled(enabled) {
        this.config.useSwarm = enabled;
        console.log(`🐝 Play Now Swarm ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Set swarm timeout
     */
    setSwarmTimeout(timeout) {
        this.config.swarmTimeout = timeout;
        console.log(`⏱️ Swarm timeout set to ${timeout}ms`);
    }

    /**
     * Get swarm status
     */
    getSwarmStatus() {
        return {
            enabled: this.config.useSwarm,
            timeout: this.config.swarmTimeout,
            fallbackEnabled: this.config.fallbackToMock,
            swarmDetails: this.playNowSwarm.getStatus()
        };
    }

    /**
     * Clear swarm cache
     */
    clearSwarmCache() {
        this.playNowSwarm.clearCache();
    }

    /**
     * Get data sources info
     */
    getDataSourcesInfo() {
        const swarmSources = this.dataSwarm.getSourcesByCategory();
        return {
            totalSources: this.dataSwarm.sources.size,
            categories: swarmSources,
            playNowSwarmAgents: this.playNowSwarm.agents.size,
            mockDataAvailable: Object.keys(this.mockSchedules).length
        };
    }
}

// Singleton instance
let instance;

module.exports = {
    getInstance: () => {
        if (!instance) {
            instance = new PlayNowService();
        }
        return instance;
    },
    PlayNowService
};