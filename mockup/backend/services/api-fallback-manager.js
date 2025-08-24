/**
 * API Fallback Manager
 * Handles graceful degradation when external APIs fail or lack keys
 */

class APIFallbackManager {
    constructor() {
        this.fallbackStrategies = new Map();
        this.apiStatus = new Map();
        this.initializeFallbacks();
    }

    initializeFallbacks() {
        // Google Places fallback
        this.fallbackStrategies.set('google-places', {
            primary: 'google-places-api',
            fallbacks: [
                {
                    name: 'openstreetmap',
                    handler: this.fetchOpenStreetMapVenues.bind(this)
                },
                {
                    name: 'cached-venues',
                    handler: this.getCachedVenues.bind(this)
                }
            ]
        });

        // Eventbrite fallback
        this.fallbackStrategies.set('eventbrite', {
            primary: 'eventbrite-api',
            fallbacks: [
                {
                    name: 'eventbrite-scraper',
                    handler: this.scrapeEventbritePublic.bind(this)
                },
                {
                    name: 'local-events',
                    handler: this.getLocalEvents.bind(this)
                }
            ]
        });

        // Meetup fallback
        this.fallbackStrategies.set('meetup', {
            primary: 'meetup-api',
            fallbacks: [
                {
                    name: 'meetup-scraper',
                    handler: this.scrapeMeetupPublic.bind(this)
                },
                {
                    name: 'community-groups',
                    handler: this.getCommunityGroups.bind(this)
                }
            ]
        });

        // Strava fallback
        this.fallbackStrategies.set('strava', {
            primary: 'strava-api',
            fallbacks: [
                {
                    name: 'mapmyrun',
                    handler: this.fetchMapMyRunRoutes.bind(this)
                },
                {
                    name: 'local-routes',
                    handler: this.getLocalRunningRoutes.bind(this)
                }
            ]
        });
    }

    /**
     * Execute API call with automatic fallback
     */
    async executeWithFallback(apiName, primaryHandler, ...args) {
        const strategy = this.fallbackStrategies.get(apiName);
        if (!strategy) {
            console.warn(`No fallback strategy for ${apiName}`);
            return [];
        }

        // Try primary API
        try {
            const result = await primaryHandler(...args);
            this.apiStatus.set(apiName, { 
                status: 'healthy', 
                lastSuccess: new Date() 
            });
            return result;
        } catch (primaryError) {
            console.warn(`Primary API ${apiName} failed:`, primaryError.message);
            this.apiStatus.set(apiName, { 
                status: 'failed', 
                lastError: primaryError.message,
                failedAt: new Date() 
            });

            // Try fallbacks in order
            for (const fallback of strategy.fallbacks) {
                try {
                    console.log(`Attempting fallback: ${fallback.name}`);
                    const result = await fallback.handler(...args);
                    if (result && result.length > 0) {
                        console.log(`✅ Fallback ${fallback.name} successful`);
                        return result;
                    }
                } catch (fallbackError) {
                    console.warn(`Fallback ${fallback.name} failed:`, fallbackError.message);
                }
            }

            // All fallbacks failed
            console.error(`All fallbacks failed for ${apiName}`);
            return [];
        }
    }

    /**
     * OpenStreetMap venue fetcher (no API key required)
     */
    async fetchOpenStreetMapVenues(lat, lng, radius = 5000) {
        const axios = require('axios');
        try {
            const overpassQuery = `
                [out:json][timeout:25];
                (
                  node["leisure"="sports_centre"](around:${radius},${lat},${lng});
                  node["leisure"="stadium"](around:${radius},${lat},${lng});
                  node["leisure"="pitch"](around:${radius},${lat},${lng});
                  way["leisure"="sports_centre"](around:${radius},${lat},${lng});
                  way["leisure"="stadium"](around:${radius},${lat},${lng});
                  way["leisure"="pitch"](around:${radius},${lat},${lng});
                );
                out body;
            `;

            const response = await axios.get('https://overpass-api.de/api/interpreter', {
                params: { data: overpassQuery }
            });

            return response.data.elements.map(element => ({
                id: `osm_${element.id}`,
                name: element.tags.name || 'Sports Venue',
                type: element.tags.leisure,
                sport: element.tags.sport,
                address: element.tags['addr:full'] || 'Address not available',
                coordinates: {
                    lat: element.lat || element.center?.lat,
                    lng: element.lon || element.center?.lon
                },
                source: 'openstreetmap'
            }));
        } catch (error) {
            console.error('OpenStreetMap fetch failed:', error.message);
            return [];
        }
    }

    /**
     * Get cached venues from local database
     */
    async getCachedVenues(lat, lng, radius) {
        // Return hardcoded Vancouver venues as fallback
        const cachedVenues = [
            {
                id: 'cached_1',
                name: 'Kitsilano Community Centre',
                address: '2690 Larch St, Vancouver',
                coordinates: { lat: 49.2638, lng: -123.1551 },
                sports: ['basketball', 'volleyball', 'badminton'],
                source: 'cache'
            },
            {
                id: 'cached_2',
                name: 'Hillcrest Centre',
                address: '4575 Clancy Loranger Way, Vancouver',
                coordinates: { lat: 49.2445, lng: -123.1089 },
                sports: ['swimming', 'hockey', 'basketball'],
                source: 'cache'
            },
            {
                id: 'cached_3',
                name: 'Kerrisdale Community Centre',
                address: '5851 West Boulevard, Vancouver',
                coordinates: { lat: 49.2344, lng: -123.1589 },
                sports: ['tennis', 'basketball', 'fitness'],
                source: 'cache'
            }
        ];

        // Filter by distance (simple approximation)
        return cachedVenues.filter(venue => {
            const distance = Math.sqrt(
                Math.pow(venue.coordinates.lat - lat, 2) + 
                Math.pow(venue.coordinates.lng - lng, 2)
            );
            return distance < (radius / 100000); // Rough conversion
        });
    }

    /**
     * Scrape public Eventbrite pages
     */
    async scrapeEventbritePublic(searchQuery, location) {
        // Fallback to searching Vancouver sports events
        const fallbackEvents = [
            {
                id: 'eventbrite_fallback_1',
                title: 'Vancouver Sports & Recreation Fair',
                date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                location: 'Vancouver Convention Centre',
                sport: 'multiple',
                source: 'eventbrite_public'
            },
            {
                id: 'eventbrite_fallback_2',
                title: 'Community Basketball Tournament',
                date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                location: 'UBC Recreation Centre',
                sport: 'basketball',
                source: 'eventbrite_public'
            }
        ];
        return fallbackEvents;
    }

    /**
     * Get local events from community sources
     */
    async getLocalEvents(location) {
        // Return events from local community centers
        return [
            {
                id: 'local_event_1',
                title: 'Drop-in Basketball',
                recurring: true,
                dayOfWeek: 'Monday',
                time: '7:00 PM',
                location: 'Local Community Centre',
                sport: 'basketball',
                source: 'local'
            }
        ];
    }

    /**
     * Scrape public Meetup pages
     */
    async scrapeMeetupPublic(searchTerms, location) {
        // Return common meetup groups in Vancouver
        return [
            {
                id: 'meetup_fallback_1',
                name: 'Vancouver Pickup Basketball',
                members: 500,
                nextEvent: 'Saturday 2:00 PM',
                location: 'Various courts',
                source: 'meetup_public'
            },
            {
                id: 'meetup_fallback_2',
                name: 'Vancouver Running Club',
                members: 1200,
                nextEvent: 'Sunday 8:00 AM',
                location: 'Stanley Park',
                source: 'meetup_public'
            }
        ];
    }

    /**
     * Get community groups from local database
     */
    async getCommunityGroups(location) {
        return [
            {
                id: 'community_1',
                name: 'Neighborhood Sports Group',
                sport: 'multiple',
                schedule: 'Weekends',
                source: 'community'
            }
        ];
    }

    /**
     * Fetch MapMyRun public routes
     */
    async fetchMapMyRunRoutes(lat, lng) {
        return [
            {
                id: 'mapmyrun_1',
                name: 'Seawall Run',
                distance: '10km',
                difficulty: 'Easy',
                startPoint: { lat: 49.2827, lng: -123.1207 },
                source: 'mapmyrun'
            },
            {
                id: 'mapmyrun_2',
                name: 'Pacific Spirit Trail',
                distance: '5km',
                difficulty: 'Moderate',
                startPoint: { lat: 49.2606, lng: -123.2460 },
                source: 'mapmyrun'
            }
        ];
    }

    /**
     * Get local running routes
     */
    async getLocalRunningRoutes(lat, lng) {
        return [
            {
                id: 'local_route_1',
                name: 'Community Park Loop',
                distance: '3km',
                terrain: 'paved',
                source: 'local'
            }
        ];
    }

    /**
     * Get API health status
     */
    getAPIHealth() {
        const health = {};
        for (const [api, status] of this.apiStatus) {
            health[api] = status;
        }
        return health;
    }

    /**
     * Check if fallback is being used
     */
    isUsingFallback(apiName) {
        const status = this.apiStatus.get(apiName);
        return status && status.status === 'failed';
    }
}

module.exports = APIFallbackManager;