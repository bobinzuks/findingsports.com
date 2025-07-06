// Agent 4: Sports Domain Expert - Comprehensive Source Discovery
class SportsSourceDiscovery {
    constructor() {
        this.sources = new Map();
        this.regions = ['vancouver', 'burnaby', 'richmond', 'surrey', 'coquitlam', 'north-vancouver', 'west-vancouver', 'delta', 'langley', 'maple-ridge'];
        this.sports = ['basketball', 'soccer', 'volleyball', 'tennis', 'badminton', 'hockey', 'baseball', 'swimming', 'fitness', 'martial-arts'];
    }

    // Comprehensive source mapping for British Columbia
    initializeSources() {
        this.addRecreationCenters();
        this.addCommunityFacilities();
        this.addEducationalInstitutions();
        this.addPrivateFacilities();
        this.addSportsOrganizations();
        this.addSocialPlatforms();
        this.addSpecializedApps();
        this.addGovernmentSources();
    }

    addCommunityFacilities() {
        // This method was missing - add community facilities to sources
        const communityFacilities = [
            // North Vancouver Community Facilities
            {
                name: 'North Vancouver Recreation Commission',
                url: 'https://www.nvrc.ca/',
                type: 'recreation_center',
                region: 'north-vancouver',
                specialties: ['basketball', 'volleyball', 'badminton', 'swimming'],
                endpoints: {
                    gymnasiums: 'https://www.nvrc.ca/facilities-fields/locations-hours/gymnasiums',
                    programs: 'https://nvrc.perfectmind.com/23734/Clients/BookMe4'
                }
            },
            {
                name: 'Delbrook Community Recreation Centre',
                url: 'https://www.nvrc.ca/facilities-fields/delbrook-community-recreation-centre',
                type: 'community_center',
                region: 'north-vancouver',
                specialties: ['basketball', 'volleyball', 'fitness']
            },
            {
                name: 'John Braithwaite Community Centre',
                url: 'https://www.nvrc.ca/facilities-fields/john-braithwaite-community-centre',
                type: 'community_center',
                region: 'north-vancouver',
                specialties: ['basketball', 'badminton', 'fitness']
            },
            {
                name: 'Lions Gate Community Recreation Centre',
                url: 'https://www.nvrc.ca/facilities-fields/lions-gate-community-recreation-centre',
                type: 'community_center',
                region: 'north-vancouver',
                specialties: ['swimming', 'fitness', 'basketball']
            }
        ];

        communityFacilities.forEach(facility => this.sources.set(facility.name, facility));
    }

    addRecreationCenters() {
        const recreationCenters = [
            // Vancouver
            {
                name: 'Vancouver Parks and Recreation',
                url: 'https://vancouver.ca/parks-recreation-culture/recreation-programs.aspx',
                type: 'recreation_center',
                region: 'vancouver',
                scrapers: ['schedule_scraper', 'facility_scraper'],
                endpoints: {
                    programs: 'https://vancouver.ca/your-government/web-services.aspx',
                    facilities: 'https://opendata.vancouver.ca/explore/dataset/parks-and-recreation-facilities/'
                }
            },
            {
                name: 'Hillcrest Centre',
                url: 'https://vancouver.ca/parks-recreation-culture/hillcrest-centre.aspx',
                type: 'community_center',
                region: 'vancouver',
                specialties: ['basketball', 'volleyball', 'badminton', 'fitness']
            },
            {
                name: 'Kerrisdale Community Centre',
                url: 'https://vancouver.ca/parks-recreation-culture/kerrisdale-community-centre.aspx',
                type: 'community_center',
                region: 'vancouver',
                specialties: ['soccer', 'tennis', 'swimming']
            },
            {
                name: 'Mount Pleasant Community Centre',
                url: 'https://vancouver.ca/parks-recreation-culture/mount-pleasant-community-centre.aspx',
                type: 'community_center',
                region: 'vancouver',
                specialties: ['volleyball', 'basketball', 'fitness']
            },

            // Richmond
            {
                name: 'Richmond Community Services',
                url: 'https://www.richmond.ca/services/rac.htm',
                type: 'recreation_center',
                region: 'richmond',
                api_available: true,
                endpoints: {
                    programs: 'https://www.richmond.ca/services/rac/programs.htm'
                }
            },
            {
                name: 'Richmond Olympic Oval',
                url: 'https://www.richmondoval.ca/',
                type: 'sports_facility',
                region: 'richmond',
                specialties: ['basketball', 'volleyball', 'badminton', 'fitness', 'running']
            },

            // Burnaby
            {
                name: 'Burnaby Parks and Recreation',
                url: 'https://www.burnaby.ca/parks-recreation',
                type: 'recreation_center',
                region: 'burnaby',
                endpoints: {
                    facilities: 'https://www.burnaby.ca/parks-recreation/facilities'
                }
            },
            {
                name: 'Swangard Stadium',
                url: 'https://www.burnaby.ca/parks-recreation/facilities/swangard-stadium',
                type: 'sports_facility',
                region: 'burnaby',
                specialties: ['soccer', 'track_and_field']
            },

            // Surrey
            {
                name: 'Surrey Recreation',
                url: 'https://www.surrey.ca/culture-recreation',
                type: 'recreation_center',
                region: 'surrey',
                endpoints: {
                    programs: 'https://www.surrey.ca/culture-recreation/recreation/programs-activities'
                }
            },

            // Coquitlam
            {
                name: 'Coquitlam Recreation',
                url: 'https://www.coquitlam.ca/recreation-and-culture',
                type: 'recreation_center',
                region: 'coquitlam'
            },

            // North Vancouver
            {
                name: 'North Vancouver Recreation',
                url: 'https://www.cnv.org/parks-recreation',
                type: 'recreation_center',
                region: 'north-vancouver'
            },

            // West Vancouver
            {
                name: 'West Vancouver Community Services',
                url: 'https://westvancouver.ca/parks-recreation',
                type: 'recreation_center',
                region: 'west-vancouver'
            }
        ];

        recreationCenters.forEach(center => this.sources.set(center.name, center));
    }

    addEducationalInstitutions() {
        const institutions = [
            // Universities
            {
                name: 'UBC Recreation',
                url: 'https://recreation.ubc.ca/',
                type: 'university_recreation',
                region: 'vancouver',
                specialties: ['all_sports'],
                public_access: true,
                endpoints: {
                    drop_ins: 'https://recreation.ubc.ca/fitness-wellness/drop-in-recreation/'
                }
            },
            {
                name: 'SFU Recreation',
                url: 'https://www.sfu.ca/students/health/recreation.html',
                type: 'university_recreation',
                region: 'burnaby',
                public_access: true
            },
            {
                name: 'BCIT Recreation',
                url: 'https://www.bcit.ca/recreation/',
                type: 'college_recreation',
                region: 'burnaby',
                public_access: true
            },
            {
                name: 'Langara College Recreation',
                url: 'https://langara.ca/campus-life/recreation-athletics/',
                type: 'college_recreation',
                region: 'vancouver',
                public_access: true
            },

            // School Districts with Community Use
            {
                name: 'Vancouver School Board Community Use',
                url: 'https://www.vsb.bc.ca/Schools/Community-Use-of-Schools/Pages/default.aspx',
                type: 'school_district',
                region: 'vancouver',
                facilities: ['gymnasiums', 'fields', 'pools']
            },
            {
                name: 'Richmond School District Community Use',
                url: 'https://www.sd38.bc.ca/community-use-schools',
                type: 'school_district',
                region: 'richmond'
            }
        ];

        institutions.forEach(inst => this.sources.set(inst.name, inst));
    }

    addPrivateFacilities() {
        const privateFacilities = [
            // Fitness Chains
            {
                name: 'Steve Nash Fitness World',
                url: 'https://www.snclubs.com/',
                type: 'fitness_chain',
                region: 'multiple',
                guest_passes: true,
                specialties: ['fitness', 'basketball', 'group_classes']
            },
            {
                name: 'GoodLife Fitness',
                url: 'https://www.goodlifefitness.com/',
                type: 'fitness_chain',
                region: 'multiple',
                guest_passes: true
            },
            {
                name: 'YMCA',
                url: 'https://gv.ymca.ca/',
                type: 'community_organization',
                region: 'multiple',
                day_passes: true,
                specialties: ['swimming', 'basketball', 'fitness']
            },

            // Sports-Specific Facilities
            {
                name: 'Richmond Tennis Club',
                url: 'https://www.richmondtennisclub.com/',
                type: 'tennis_club',
                region: 'richmond',
                guest_play: true
            },
            {
                name: 'Vancouver Badminton Club',
                url: 'https://www.vancouverbadmintonclub.com/',
                type: 'badminton_club',
                region: 'vancouver',
                drop_ins: true
            },
            {
                name: 'Minoru Aquatic Centre',
                url: 'https://www.richmond.ca/services/rac/facilities/pools/minoru.htm',
                type: 'aquatic_center',
                region: 'richmond',
                public_access: true
            }
        ];

        privateFacilities.forEach(facility => this.sources.set(facility.name, facility));
    }

    addSportsOrganizations() {
        const organizations = [
            {
                name: 'Basketball BC',
                url: 'https://www.basketball.bc.ca/',
                type: 'sports_organization',
                region: 'bc',
                sport: 'basketball',
                events_feed: true
            },
            {
                name: 'BC Soccer',
                url: 'https://www.bcsoccer.net/',
                type: 'sports_organization',
                region: 'bc',
                sport: 'soccer'
            },
            {
                name: 'Volleyball BC',
                url: 'https://www.volleyballbc.org/',
                type: 'sports_organization',
                region: 'bc',
                sport: 'volleyball'
            },
            {
                name: 'Tennis BC',
                url: 'https://www.tennisbc.org/',
                type: 'sports_organization',
                region: 'bc',
                sport: 'tennis'
            },
            {
                name: 'Badminton BC',
                url: 'https://www.badmintonbc.ca/',
                type: 'sports_organization',
                region: 'bc',
                sport: 'badminton'
            }
        ];

        organizations.forEach(org => this.sources.set(org.name, org));
    }

    addSocialPlatforms() {
        const socialPlatforms = [
            {
                name: 'Meetup Sports Groups',
                url: 'https://www.meetup.com/',
                type: 'social_platform',
                region: 'multiple',
                api_available: true,
                search_terms: [
                    'basketball vancouver',
                    'soccer vancouver',
                    'volleyball vancouver',
                    'drop-in sports vancouver',
                    'pickup basketball',
                    'recreational sports'
                ]
            },
            {
                name: 'Facebook Events',
                url: 'https://www.facebook.com/events/',
                type: 'social_platform',
                region: 'multiple',
                search_terms: [
                    'drop in basketball vancouver',
                    'pickup soccer vancouver',
                    'recreational volleyball'
                ]
            },
            {
                name: 'Eventbrite Sports',
                url: 'https://www.eventbrite.ca/',
                type: 'event_platform',
                region: 'multiple',
                categories: ['sports-fitness']
            },
            {
                name: 'Reddit Local Sports',
                url: 'https://www.reddit.com/',
                type: 'social_platform',
                subreddits: [
                    'r/vancouver',
                    'r/vancouversports',
                    'r/pickup_basketball',
                    'r/vancouverfc'
                ]
            }
        ];

        socialPlatforms.forEach(platform => this.sources.set(platform.name, platform));
    }

    addSpecializedApps() {
        const apps = [
            {
                name: 'TeamSnap',
                url: 'https://www.teamsnap.com/',
                type: 'sports_app',
                region: 'multiple',
                public_games: true,
                api_available: true
            },
            {
                name: 'Playfinder',
                url: 'https://playfinder.com/',
                type: 'sports_app',
                region: 'canada',
                focus: 'pickup_games'
            },
            {
                name: 'OpenSports',
                url: 'https://opensports.net/',
                type: 'sports_app',
                region: 'multiple',
                focus: 'drop_in_sports'
            },
            {
                name: 'JoinIn',
                url: 'https://joinin.ca/',
                type: 'sports_app',
                region: 'canada',
                focus: 'recreational_sports'
            }
        ];

        apps.forEach(app => this.sources.set(app.name, app));
    }

    addGovernmentSources() {
        const govSources = [
            {
                name: 'BC Parks',
                url: 'https://bcparks.ca/',
                type: 'government',
                region: 'bc',
                facilities: ['outdoor_courts', 'fields', 'trails']
            },
            {
                name: 'Metro Vancouver Parks',
                url: 'http://www.metrovancouver.org/services/parks',
                type: 'regional_government',
                region: 'metro_vancouver',
                facilities: ['regional_parks', 'sports_fields']
            }
        ];

        govSources.forEach(source => this.sources.set(source.name, source));
    }

    // Generate scraping targets based on user location
    getSourcesForLocation(lat, lng, radius = 25) {
        const relevantSources = [];

        for (const [name, source] of this.sources) {
            if (this.isSourceRelevant(source, lat, lng, radius)) {
                relevantSources.push(source);
            }
        }

        return relevantSources.sort((a, b) => this.calculatePriority(b) - this.calculatePriority(a));
    }

    isSourceRelevant(source, lat, lng, radius) {
        // Check if source serves the geographic area
        if (source.region === 'multiple' || source.region === 'bc') {
            return true;
        }

        // Check specific regions
        const userCity = this.getCityFromCoordinates(lat, lng);
        return source.region === userCity || this.isWithinMetroArea(source.region, userCity);
    }

    calculatePriority(source) {
        let priority = 0;

        // API availability increases priority
        if (source.api_available) { priority += 50; }
        if (source.endpoints) { priority += 30; }

        // Public access increases priority
        if (source.public_access !== false) { priority += 20; }

        // Real-time data sources get higher priority
        if (source.type === 'social_platform') { priority += 40; }
        if (source.type === 'sports_app') { priority += 35; }

        // Government sources are reliable
        if (source.type === 'government' || source.type === 'recreation_center') { priority += 25; }

        return priority;
    }

    getCityFromCoordinates(lat, lng) {
        // Simplified city detection based on coordinates
        // In production, this would use a proper geocoding service
        const cities = {
            vancouver: { lat: 49.2827, lng: -123.1207 },
            burnaby: { lat: 49.2488, lng: -122.9805 },
            richmond: { lat: 49.1666, lng: -123.1336 },
            surrey: { lat: 49.1913, lng: -122.849 },
            coquitlam: { lat: 49.3956, lng: -122.7947 }
        };

        let closestCity = 'vancouver';
        let minDistance = Infinity;

        for (const [cityName, coords] of Object.entries(cities)) {
            const distance = this.calculateDistance(lat, lng, coords.lat, coords.lng);
            if (distance < minDistance) {
                minDistance = distance;
                closestCity = cityName;
            }
        }

        return closestCity;
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

    isWithinMetroArea(sourceRegion, userCity) {
        const metroVancouver = [
            'vancouver', 'burnaby', 'richmond', 'surrey',
            'coquitlam', 'north-vancouver', 'west-vancouver',
            'delta', 'langley', 'maple-ridge'
        ];

        return metroVancouver.includes(sourceRegion) && metroVancouver.includes(userCity);
    }

    // Export configuration for scrapers
    generateScrapingConfig() {
        const config = {
            sources: Array.from(this.sources.values()),
            regions: this.regions,
            sports: this.sports,
            priority_matrix: this.generatePriorityMatrix(),
            update_frequencies: this.getUpdateFrequencies()
        };

        return config;
    }

    generatePriorityMatrix() {
        return {
            high_priority: ['recreation_center', 'university_recreation', 'sports_app'],
            medium_priority: ['community_center', 'fitness_chain', 'social_platform'],
            low_priority: ['government', 'sports_organization'],
            real_time: ['social_platform', 'sports_app'],
            batch_processing: ['government', 'recreation_center']
        };
    }

    getUpdateFrequencies() {
        return {
            social_platform: '5 minutes',
            sports_app: '10 minutes',
            recreation_center: '30 minutes',
            university_recreation: '60 minutes',
            government: '4 hours',
            sports_organization: '12 hours'
        };
    }

    // Get all sources
    getAllSources() {
        return Array.from(this.sources.values());
    }

    // Get sources by type
    getSourcesByType(type) {
        return Array.from(this.sources.values()).filter(source => source.type === type);
    }

    // Get sources by region
    getSourcesByRegion(region) {
        return Array.from(this.sources.values()).filter(source =>
            source.region === region || source.region === 'multiple' || source.region === 'bc'
        );
    }
}

module.exports = SportsSourceDiscovery;
