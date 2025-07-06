// Agent 8: Integration Engineer - Official API and Third-party Integrations
const axios = require('axios');
const { EventEmitter } = require('events');

class SportsIntegrationEngine extends EventEmitter {
    constructor() {
        super();
        this.apiKeys = new Map();
        this.integrations = new Map();
        this.webhooks = new Map();
        this.rateLimiters = new Map();

        this.initializeIntegrations();
    }

    // Initialize all available integrations
    initializeIntegrations() {
        this.setupOfficialAPIs();
        this.setupSocialMediaIntegrations();
        this.setupSportsAppIntegrations();
        this.setupBookingSystemIntegrations();
        this.setupEventPlatformIntegrations();
    }

    // Official Recreation Center APIs
    setupOfficialAPIs() {
        // Vancouver Parks and Recreation API
        this.integrations.set('vancouver_parks_api', {
            name: 'Vancouver Parks Open Data API',
            type: 'official_api',
            baseUrl: 'https://opendata.vancouver.ca/api/records/1.0/search/',
            endpoints: {
                facilities: 'dataset=parks-and-recreation-facilities',
                programs: 'dataset=recreation-programs'
            },
            rateLimit: 100, // requests per minute
            requiresAuth: false,
            dataFormat: 'json',
            reliability: 'high'
        });

        // BC Recreation and Parks Association
        this.integrations.set('bc_recreation_api', {
            name: 'BC Recreation API',
            type: 'government_api',
            baseUrl: 'https://api.bcrecreation.ca/v1/',
            endpoints: {
                facilities: 'facilities',
                programs: 'programs',
                schedules: 'schedules'
            },
            rateLimit: 60,
            requiresAuth: true,
            reliability: 'high'
        });

        // Richmond Recreation API
        this.integrations.set('richmond_recreation_api', {
            name: 'Richmond Recreation API',
            type: 'municipal_api',
            baseUrl: 'https://www.richmond.ca/api/',
            endpoints: {
                programs: 'recreation/programs',
                facilities: 'recreation/facilities',
                schedules: 'recreation/schedules'
            },
            rateLimit: 50,
            requiresAuth: false,
            reliability: 'medium'
        });
    }

    // Social Media Platform Integrations
    setupSocialMediaIntegrations() {
        // Meetup.com API
        this.integrations.set('meetup_api', {
            name: 'Meetup.com API',
            type: 'social_api',
            baseUrl: 'https://api.meetup.com/',
            endpoints: {
                events: 'find/events',
                groups: 'find/groups'
            },
            searchTerms: [
                'basketball vancouver',
                'soccer vancouver',
                'volleyball vancouver',
                'pickup sports vancouver',
                'drop-in sports'
            ],
            rateLimit: 200,
            requiresAuth: true,
            reliability: 'high'
        });

        // Facebook Events API (requires approval)
        this.integrations.set('facebook_events_api', {
            name: 'Facebook Events API',
            type: 'social_api',
            baseUrl: 'https://graph.facebook.com/v18.0/',
            endpoints: {
                events: 'search',
                pages: 'pages'
            },
            requiresAuth: true,
            rateLimit: 600,
            reliability: 'medium',
            status: 'requires_approval'
        });

        // Eventbrite API
        this.integrations.set('eventbrite_api', {
            name: 'Eventbrite API',
            type: 'event_api',
            baseUrl: 'https://www.eventbriteapi.com/v3/',
            endpoints: {
                events: 'events/search/',
                venues: 'venues/'
            },
            categories: ['108'], // Sports & Fitness category ID
            rateLimit: 1000,
            requiresAuth: true,
            reliability: 'high'
        });
    }

    // Sports App Integrations
    setupSportsAppIntegrations() {
        // TeamSnap Public API
        this.integrations.set('teamsnap_api', {
            name: 'TeamSnap API',
            type: 'sports_app_api',
            baseUrl: 'https://api.teamsnap.com/v3/',
            endpoints: {
                teams: 'teams',
                events: 'events',
                locations: 'locations'
            },
            rateLimit: 300,
            requiresAuth: true,
            reliability: 'high'
        });

        // PlayFinder API (if available)
        this.integrations.set('playfinder_api', {
            name: 'PlayFinder API',
            type: 'sports_app_api',
            baseUrl: 'https://api.playfinder.com/v1/',
            endpoints: {
                games: 'games',
                venues: 'venues'
            },
            rateLimit: 100,
            requiresAuth: true,
            reliability: 'medium'
        });
    }

    // Booking System Integrations
    setupBookingSystemIntegrations() {
        // PerfectMind (used by many BC recreation centers)
        this.integrations.set('perfectmind_integration', {
            name: 'PerfectMind Booking System',
            type: 'booking_system',
            endpoints: {
                programs: '/BookMe4/Public/Programs',
                schedules: '/BookMe4/Public/Schedule'
            },
            instances: [
                'https://nvrc.perfectmind.com/23734',
                'https://burnaby.perfectmind.com/24073',
                'https://richmond.perfectmind.com/24110'
            ],
            rateLimit: 30,
            requiresAuth: false,
            dataFormat: 'html_with_json',
            reliability: 'medium'
        });

        // ActiveNet (another common booking system)
        this.integrations.set('activenet_integration', {
            name: 'ActiveNet Booking System',
            type: 'booking_system',
            baseUrl: 'https://anc-ca.activenetwork.com/',
            endpoints: {
                activities: 'activities/search',
                facilities: 'facilities'
            },
            rateLimit: 60,
            requiresAuth: false,
            reliability: 'medium'
        });
    }

    // Event Platform Integrations
    setupEventPlatformIntegrations() {
        // Google Calendar API (for public sports calendars)
        this.integrations.set('google_calendar_api', {
            name: 'Google Calendar API',
            type: 'calendar_api',
            baseUrl: 'https://www.googleapis.com/calendar/v3/',
            endpoints: {
                events: 'calendars/{calendarId}/events'
            },
            publicCalendars: [
                'vancouver.ca_sports@group.calendar.google.com',
                'recreation.vancouver@gmail.com'
            ],
            rateLimit: 1000,
            requiresAuth: true,
            reliability: 'high'
        });
    }

    // Fetch data from Vancouver Parks API
    async fetchVancouverParksData() {
        const integration = this.integrations.get('vancouver_parks_api');

        try {
            await this.checkRateLimit('vancouver_parks_api');

            // Fetch facilities
            const facilitiesResponse = await axios.get(
                `${integration.baseUrl}?${integration.endpoints.facilities}&rows=1000`
            );

            // Fetch programs
            const programsResponse = await axios.get(
                `${integration.baseUrl}?${integration.endpoints.programs}&rows=1000`
            );

            return {
                facilities: this.processVancouverFacilities(facilitiesResponse.data),
                programs: this.processVancouverPrograms(programsResponse.data)
            };
        } catch (error) {
            console.error('Error fetching Vancouver Parks data:', error.message);
            return { facilities: [], programs: [] };
        }
    }

    // Process Vancouver facilities data
    processVancouverFacilities(data) {
        if (!data.records) { return []; }

        return data.records.map(record => {
            const { fields } = record;
            return {
                name: fields.name,
                type: fields.facilitytype,
                address: fields.address,
                neighbourhood: fields.neighbourhood,
                coordinates: fields.geom ? {
                    lat: fields.geom.coordinates[1],
                    lng: fields.geom.coordinates[0]
                } : null,
                amenities: fields.amenities ? fields.amenities.split(',') : [],
                source: 'vancouver_parks_api',
                lastUpdated: new Date()
            };
        });
    }

    // Process Vancouver programs data
    processVancouverPrograms(data) {
        if (!data.records) { return []; }

        return data.records
            .filter(record => this.isSportsProgram(record.fields))
            .map(record => {
                const { fields } = record;
                return {
                    title: fields.program_name,
                    sport: this.identifySport(`${fields.program_name} ${fields.description || ''}`),
                    venue: fields.facility_name,
                    startDate: fields.start_date,
                    endDate: fields.end_date,
                    schedule: fields.schedule,
                    dropIn: this.isDropInProgram(fields),
                    ageGroup: fields.age_group,
                    price: fields.fee,
                    description: fields.description,
                    source: 'vancouver_parks_api',
                    lastUpdated: new Date()
                };
            });
    }

    // Fetch data from Meetup API
    async fetchMeetupData(lat, lng, radius = 25) {
        const integration = this.integrations.get('meetup_api');
        if (!this.apiKeys.get('meetup')) {
            console.warn('Meetup API key not configured');
            return [];
        }

        try {
            await this.checkRateLimit('meetup_api');

            const events = [];

            for (const searchTerm of integration.searchTerms) {
                const response = await axios.get(`${integration.baseUrl}${integration.endpoints.events}`, {
                    params: {
                        lat,
                        lon: lng,
                        radius,
                        text: searchTerm,
                        category: 9, // Sports & Recreation
                        status: 'upcoming',
                        page: 20
                    },
                    headers: {
                        Authorization: `Bearer ${this.apiKeys.get('meetup')}`
                    }
                });

                if (response.data.events) {
                    events.push(...response.data.events);
                }

                // Rate limiting between requests
                await this.delay(100);
            }

            return this.processMeetupEvents(events);
        } catch (error) {
            console.error('Error fetching Meetup data:', error.message);
            return [];
        }
    }

    // Process Meetup events
    processMeetupEvents(events) {
        return events.map(event => ({
            title: event.name,
            sport: this.identifySport(`${event.name} ${event.description || ''}`),
            venue: {
                name: event.venue ? event.venue.name : 'TBD',
                address: event.venue ? event.venue.address_1 : null,
                coordinates: event.venue ? {
                    lat: event.venue.lat,
                    lng: event.venue.lon
                } : null
            },
            startTime: new Date(event.time),
            endTime: event.duration ? new Date(event.time + event.duration) : null,
            attendees: event.yes_rsvp_count,
            maxAttendees: event.rsvp_limit,
            description: event.description,
            organizer: {
                name: event.group.name,
                url: event.group.urlname
            },
            eventUrl: event.link,
            dropIn: true, // Most Meetup sports events are drop-in
            source: 'meetup_api',
            lastUpdated: new Date()
        }));
    }

    // Fetch data from Eventbrite
    async fetchEventbriteData(lat, lng, radius = 25) {
        const integration = this.integrations.get('eventbrite_api');
        if (!this.apiKeys.get('eventbrite')) {
            console.warn('Eventbrite API key not configured');
            return [];
        }

        try {
            await this.checkRateLimit('eventbrite_api');

            const response = await axios.get(`${integration.baseUrl}${integration.endpoints.events}`, {
                params: {
                    'location.latitude': lat,
                    'location.longitude': lng,
                    'location.within': `${radius}km`,
                    categories: integration.categories.join(','),
                    'start_date.range_start': new Date().toISOString(),
                    expand: 'venue,organizer',
                    page_size: 50
                },
                headers: {
                    Authorization: `Bearer ${this.apiKeys.get('eventbrite')}`
                }
            });

            return this.processEventbriteEvents(response.data.events || []);
        } catch (error) {
            console.error('Error fetching Eventbrite data:', error.message);
            return [];
        }
    }

    // Process Eventbrite events
    processEventbriteEvents(events) {
        return events
            .filter(event => this.isSportsEvent(event))
            .map(event => ({
                title: event.name.text,
                sport: this.identifySport(`${event.name.text} ${event.description.text || ''}`),
                venue: event.venue ? {
                    name: event.venue.name,
                    address: event.venue.address ?
                        `${event.venue.address.address_1}, ${event.venue.address.city}` : null,
                    coordinates: event.venue.latitude ? {
                        lat: parseFloat(event.venue.latitude),
                        lng: parseFloat(event.venue.longitude)
                    } : null
                } : null,
                startTime: new Date(event.start.utc),
                endTime: new Date(event.end.utc),
                price: event.ticket_availability ?
                    event.ticket_availability.minimum_ticket_price?.major_value || 0 : 0,
                capacity: event.capacity,
                description: event.description.text,
                organizer: {
                    name: event.organizer ? event.organizer.name : 'Unknown',
                    url: event.organizer ? event.organizer.url : null
                },
                eventUrl: event.url,
                dropIn: this.isDropInEvent(event),
                source: 'eventbrite_api',
                lastUpdated: new Date()
            }));
    }

    // Fetch from PerfectMind booking systems
    async fetchPerfectMindData() {
        const integration = this.integrations.get('perfectmind_integration');
        const allPrograms = [];

        for (const instance of integration.instances) {
            try {
                await this.checkRateLimit('perfectmind_integration');

                const response = await axios.get(`${instance}${integration.endpoints.programs}`, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (compatible; FindingSports/1.0)',
                        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                    },
                    timeout: 15000
                });

                const programs = this.parsePerfectMindPrograms(response.data, instance);
                allPrograms.push(...programs);
            } catch (error) {
                console.error(`Error fetching PerfectMind data from ${instance}:`, error.message);
            }
        }

        return allPrograms;
    }

    // Parse PerfectMind HTML/JSON data
    parsePerfectMindPrograms(html, instance) {
        // PerfectMind often has embedded JSON data
        const jsonMatches = html.match(/var\s+programData\s*=\s*(\[.*?\]);/);
        if (jsonMatches) {
            try {
                const programs = JSON.parse(jsonMatches[1]);
                return programs
                    .filter(program => this.isSportsProgram(program))
                    .map(program => this.normalizePerfectMindProgram(program, instance));
            } catch (error) {
                console.error('Error parsing PerfectMind JSON:', error);
            }
        }

        // Fallback to HTML parsing
        return this.parsePerfectMindHTML(html, instance);
    }

    // Setup webhook listeners for real-time updates
    setupWebhooks() {
        // Webhook for recreation center updates
        this.webhooks.set('recreation_updates', {
            endpoint: '/webhooks/recreation-updates',
            sources: ['vancouver_parks', 'richmond_recreation'],
            handler: this.handleRecreationUpdate.bind(this)
        });

        // Webhook for social media events
        this.webhooks.set('social_events', {
            endpoint: '/webhooks/social-events',
            sources: ['meetup', 'facebook', 'eventbrite'],
            handler: this.handleSocialEventUpdate.bind(this)
        });
    }

    // Handle recreation center update webhook
    async handleRecreationUpdate(data) {
        console.log('Received recreation update:', data);

        // Process and emit the update
        const processedData = await this.processWebhookData(data);
        this.emit('realTimeUpdate', {
            type: 'recreation_update',
            data: processedData
        });
    }

    // Handle social media event update
    async handleSocialEventUpdate(data) {
        console.log('Received social event update:', data);

        const processedData = await this.processWebhookData(data);
        this.emit('realTimeUpdate', {
            type: 'social_event_update',
            data: processedData
        });
    }

    // Rate limiting
    async checkRateLimit(integrationKey) {
        const integration = this.integrations.get(integrationKey);
        const limiter = this.rateLimiters.get(integrationKey) || { requests: [], limit: integration.rateLimit };

        const now = Date.now();
        const windowStart = now - 60000; // 1 minute window

        // Remove old requests
        limiter.requests = limiter.requests.filter(time => time > windowStart);

        // Check if we're at the limit
        if (limiter.requests.length >= limiter.limit) {
            const waitTime = 60000 - (now - limiter.requests[0]);
            await this.delay(waitTime);
        }

        // Add current request
        limiter.requests.push(now);
        this.rateLimiters.set(integrationKey, limiter);
    }

    // Utility methods
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    isSportsProgram(program) {
        const text = (program.program_name || program.name || '').toLowerCase();
        const description = (program.description || '').toLowerCase();
        const combined = `${text} ${description}`;

        const sportsKeywords = [
            'basketball', 'soccer', 'volleyball', 'tennis', 'badminton',
            'hockey', 'swimming', 'fitness', 'sport', 'athletic', 'gym'
        ];

        return sportsKeywords.some(keyword => combined.includes(keyword));
    }

    isDropInProgram(program) {
        const text = (`${program.program_name || program.name || ''} ${
            program.description || ''}`).toLowerCase();

        const dropInKeywords = ['drop-in', 'drop in', 'dropin', 'walk-in', 'public'];
        return dropInKeywords.some(keyword => text.includes(keyword));
    }

    isSportsEvent(event) {
        return this.isSportsProgram(event.name || event);
    }

    isDropInEvent(event) {
        return this.isDropInProgram(event.name || event);
    }

    identifySport(text) {
        const lowerText = text.toLowerCase();
        const sports = {
            basketball: ['basketball', 'bball', 'hoops'],
            soccer: ['soccer', 'football', 'futbol'],
            volleyball: ['volleyball', 'vball'],
            tennis: ['tennis'],
            badminton: ['badminton'],
            hockey: ['hockey'],
            swimming: ['swim', 'pool', 'aqua'],
            fitness: ['fitness', 'gym', 'workout']
        };

        for (const [sport, keywords] of Object.entries(sports)) {
            if (keywords.some(keyword => lowerText.includes(keyword))) {
                return sport;
            }
        }

        return 'general';
    }

    // Set API keys
    setApiKey(service, key) {
        this.apiKeys.set(service, key);
    }

    // Get integration status
    getIntegrationStatus() {
        const status = {};

        for (const [key, integration] of this.integrations) {
            status[key] = {
                name: integration.name,
                type: integration.type,
                configured: integration.requiresAuth ? this.apiKeys.has(key) : true,
                rateLimit: integration.rateLimit,
                reliability: integration.reliability,
                status: integration.status || 'active'
            };
        }

        return status;
    }
}

module.exports = SportsIntegrationEngine;
