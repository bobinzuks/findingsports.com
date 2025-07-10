/**
 * Local Sports Data Sources
 * Focused on drop-in games, open gyms, and available fields/parks
 */

const localSportsSources = [
    // Vancouver Area Recreation Centers
    {
        siteId: 'vancouver-rec-drop-in',
        domain: 'vancouver.ca',
        name: 'City of Vancouver Drop-in Sports',
        sport: 'multiple',
        gameType: 'drop-in',
        method: {
            type: 'scraper',
            urls: [
                'https://vancouver.ca/parks-recreation-culture/drop-in-basketball.aspx',
                'https://vancouver.ca/parks-recreation-culture/drop-in-volleyball.aspx',
                'https://vancouver.ca/parks-recreation-culture/drop-in-soccer.aspx',
                'https://vancouver.ca/parks-recreation-culture/drop-in-badminton.aspx',
                'https://vancouver.ca/parks-recreation-culture/drop-in-fitness.aspx'
            ],
            selectors: {
                schedule: '.drop-in-schedule',
                facility: '.facility-name',
                time: '.schedule-time',
                day: '.schedule-day',
                activity: '.activity-type'
            }
        }
    },
    
    // Burnaby Recreation
    {
        siteId: 'burnaby-rec-drop-in',
        domain: 'burnaby.ca',
        name: 'Burnaby Drop-in Sports',
        sport: 'multiple',
        gameType: 'drop-in',
        method: {
            type: 'scraper',
            urls: [
                'https://www.burnaby.ca/recreation-and-arts/drop-in-schedules'
            ],
            selectors: {
                activities: '.drop-in-activity',
                location: '.rec-center-name',
                schedule: '.time-slot'
            }
        }
    },
    
    // Richmond Recreation
    {
        siteId: 'richmond-rec-drop-in',
        domain: 'richmond.ca',
        name: 'Richmond Drop-in Activities',
        sport: 'multiple',
        gameType: 'drop-in',
        method: {
            type: 'scraper',
            urls: [
                'https://www.richmond.ca/recreation/drop-in.htm'
            ]
        }
    },
    
    // Surrey Recreation
    {
        siteId: 'surrey-rec-drop-in',
        domain: 'surrey.ca',
        name: 'Surrey Drop-in Sports',
        sport: 'multiple',
        gameType: 'drop-in',
        method: {
            type: 'scraper',
            urls: [
                'https://www.surrey.ca/recreation-culture/recreation-centres-arenas/drop-programs'
            ]
        }
    },
    
    // North Vancouver Recreation
    {
        siteId: 'north-van-rec',
        domain: 'nvrc.ca',
        name: 'North Vancouver Recreation',
        sport: 'multiple',
        gameType: 'drop-in',
        method: {
            type: 'scraper',
            urls: [
                'https://www.nvrc.ca/drop-in-schedules'
            ]
        }
    },
    
    // YMCA Drop-in Sports
    {
        siteId: 'ymca-gv-drop-in',
        domain: 'gv.ymca.ca',
        name: 'YMCA Greater Vancouver Drop-in',
        sport: 'multiple',
        gameType: 'drop-in',
        method: {
            type: 'scraper',
            urls: [
                'https://gv.ymca.ca/schedules'
            ]
        }
    },
    
    // JCC Sports
    {
        siteId: 'jcc-sports-drop-in',
        domain: 'jccgv.com',
        name: 'Jewish Community Centre Drop-in',
        sport: 'multiple',
        gameType: 'drop-in',
        method: {
            type: 'scraper',
            urls: [
                'https://www.jccgv.com/drop-in-sports/'
            ]
        }
    },
    
    // Park Board Fields Status
    {
        siteId: 'vancouver-fields-status',
        domain: 'vancouver.ca',
        name: 'Vancouver Park Fields Status',
        sport: 'multiple',
        gameType: 'open-field',
        method: {
            type: 'scraper',
            urls: [
                'https://vancouver.ca/parks-recreation-culture/field-conditions.aspx'
            ],
            selectors: {
                fields: '.field-status-row',
                name: '.field-name',
                status: '.field-condition',
                sport: '.field-type'
            }
        }
    },
    
    // OpenSports App Data
    {
        siteId: 'opensports-pickup',
        domain: 'opensports.net',
        name: 'OpenSports Pickup Games',
        sport: 'multiple',
        gameType: 'pickup',
        method: {
            type: 'api',
            endpoint: 'https://api.opensports.net/v1/games',
            params: {
                type: 'pickup',
                open: true
            }
        }
    },
    
    // Meetup Sports Groups
    {
        siteId: 'meetup-sports-vancouver',
        domain: 'meetup.com',
        name: 'Meetup Drop-in Sports',
        sport: 'multiple',
        gameType: 'pickup',
        method: {
            type: 'scraper',
            urls: [
                'https://www.meetup.com/find/?keywords=drop-in%20sports&location=ca--bc--vancouver',
                'https://www.meetup.com/find/?keywords=pickup%20basketball&location=ca--bc--vancouver',
                'https://www.meetup.com/find/?keywords=pickup%20soccer&location=ca--bc--vancouver'
            ]
        }
    },
    
    // Facebook Groups (Public Pickup Games)
    {
        siteId: 'facebook-pickup-games',
        domain: 'facebook.com',
        name: 'Facebook Pickup Sports Groups',
        sport: 'multiple',
        gameType: 'pickup',
        method: {
            type: 'scraper',
            note: 'Requires login - scrape public group posts',
            groups: [
                'Vancouver Pickup Basketball',
                'Vancouver Pickup Soccer',
                'Drop in Sports Vancouver',
                'Vancouver Volleyball Pickup Games'
            ]
        }
    },
    
    // University Drop-ins
    {
        siteId: 'ubc-rec-drop-in',
        domain: 'recreation.ubc.ca',
        name: 'UBC Recreation Drop-in',
        sport: 'multiple',
        gameType: 'drop-in',
        method: {
            type: 'scraper',
            urls: [
                'https://recreation.ubc.ca/drop-in-recreation/'
            ]
        }
    },
    
    {
        siteId: 'sfu-rec-drop-in',
        domain: 'sfu.ca/recreation',
        name: 'SFU Recreation Drop-in',
        sport: 'multiple',
        gameType: 'drop-in',
        method: {
            type: 'scraper',
            urls: [
                'https://www.sfu.ca/recreation/recreation/drop-in.html'
            ]
        }
    },
    
    // Sport-Specific Local Sites
    {
        siteId: 'urban-rec-vancouver',
        domain: 'vancouver.urbanrec.ca',
        name: 'Urban Rec Drop-in Sports',
        sport: 'multiple',
        gameType: 'drop-in',
        method: {
            type: 'scraper',
            urls: [
                'https://vancouver.urbanrec.ca/drop-in-sports'
            ]
        }
    },
    
    // Basketball City
    {
        siteId: 'basketball-city-drop-in',
        domain: 'basketballcity.ca',
        name: 'Basketball City Drop-in',
        sport: 'basketball',
        gameType: 'drop-in',
        method: {
            type: 'scraper',
            urls: [
                'https://basketballcity.ca/drop-in-basketball'
            ]
        }
    },
    
    // Local Soccer Fields
    {
        siteId: 'vancouver-soccer-fields',
        domain: 'vancouversoccer.com',
        name: 'Vancouver Soccer Fields',
        sport: 'soccer',
        gameType: 'open-field',
        method: {
            type: 'scraper',
            note: 'Check which fields are not booked',
            urls: [
                'https://vancouversoccer.com/field-availability'
            ]
        }
    },
    
    // Tennis Courts
    {
        siteId: 'vancouver-tennis-courts',
        domain: 'vancouver.ca',
        name: 'Vancouver Public Tennis Courts',
        sport: 'tennis',
        gameType: 'open-court',
        method: {
            type: 'scraper',
            urls: [
                'https://vancouver.ca/parks-recreation-culture/tennis-courts.aspx'
            ],
            note: 'Most courts are first-come-first-served'
        }
    },
    
    // Basketball Courts
    {
        siteId: 'courts-of-the-world',
        domain: 'courtsoftheworld.com',
        name: 'Courts of the World',
        sport: 'basketball',
        gameType: 'open-court',
        method: {
            type: 'api',
            endpoint: 'https://courtsoftheworld.com/api/courts',
            params: {
                city: 'Vancouver',
                type: 'outdoor'
            }
        }
    },
    
    // Volleyball Courts
    {
        siteId: 'vancouver-beach-volleyball',
        domain: 'vancouver.ca',
        name: 'Beach Volleyball Courts',
        sport: 'volleyball',
        gameType: 'open-court',
        method: {
            type: 'scraper',
            urls: [
                'https://vancouver.ca/parks-recreation-culture/beach-volleyball.aspx'
            ],
            note: 'Kitsilano Beach, English Bay, Jericho Beach courts'
        }
    },
    
    // Pickleball Courts
    {
        siteId: 'pickleball-bc',
        domain: 'pickleballbc.ca',
        name: 'Pickleball BC Drop-in',
        sport: 'pickleball',
        gameType: 'drop-in',
        method: {
            type: 'scraper',
            urls: [
                'https://pickleballbc.ca/drop-in-play'
            ]
        }
    },
    
    // Local Sports Apps
    {
        siteId: 'javelin-app',
        domain: 'javelin-app.com',
        name: 'Javelin Sports App',
        sport: 'multiple',
        gameType: 'pickup',
        method: {
            type: 'api',
            endpoint: 'https://api.javelin-app.com/games',
            note: 'Local pickup games app'
        }
    },
    
    {
        siteId: 'playsportsapp',
        domain: 'playsportsapp.com',
        name: 'PlaySports App',
        sport: 'multiple',
        gameType: 'pickup',
        method: {
            type: 'api',
            endpoint: 'https://api.playsportsapp.com/pickup-games'
        }
    },
    
    // Community Boards & Local Sites
    {
        siteId: 'craigslist-sports',
        domain: 'vancouver.craigslist.org',
        name: 'Craigslist Sports Activities',
        sport: 'multiple',
        gameType: 'pickup',
        method: {
            type: 'scraper',
            urls: [
                'https://vancouver.craigslist.org/search/act?query=drop+in+sports',
                'https://vancouver.craigslist.org/search/act?query=pickup+basketball',
                'https://vancouver.craigslist.org/search/act?query=pickup+soccer'
            ]
        }
    },
    
    // Weather-Dependent Field Status
    {
        siteId: 'rainout-line',
        domain: 'rainoutline.com',
        name: 'Rainout Line Field Status',
        sport: 'multiple',
        gameType: 'open-field',
        method: {
            type: 'api',
            endpoint: 'https://rainoutline.com/api/vancouver',
            note: 'Real-time field conditions'
        }
    },
    
    // School Gyms Open Hours
    {
        siteId: 'vsb-community-gym',
        domain: 'vsb.bc.ca',
        name: 'VSB School Gym Drop-in',
        sport: 'multiple',
        gameType: 'drop-in',
        method: {
            type: 'scraper',
            urls: [
                'https://www.vsb.bc.ca/community-use-facilities'
            ],
            note: 'Evening and weekend gym availability'
        }
    },
    
    // Sport-Specific Clubs with Drop-in
    {
        siteId: 'vancouver-badminton-club',
        domain: 'vbc.ca',
        name: 'Vancouver Badminton Club',
        sport: 'badminton',
        gameType: 'drop-in',
        method: {
            type: 'scraper',
            urls: ['https://vbc.ca/drop-in']
        }
    },
    
    // Local Fitness Studios with Sports
    {
        siteId: 'steve-nash-drop-in',
        domain: 'stevenashfitness.ca',
        name: 'Steve Nash Fitness Drop-in Sports',
        sport: 'multiple',
        gameType: 'drop-in',
        method: {
            type: 'scraper',
            urls: ['https://www.stevenashfitness.ca/drop-in-sports']
        }
    }
];

// Helper to categorize by data type
const categorizeLocalSources = () => {
    const categories = {
        municipalRecCenters: [],
        parkFields: [],
        pickupApps: [],
        socialMedia: [],
        universities: [],
        privateFacilities: [],
        openCourts: []
    };
    
    localSportsSources.forEach(source => {
        if (source.domain.includes('.ca') && source.name.includes('City')) {
            categories.municipalRecCenters.push(source);
        } else if (source.gameType === 'open-field' || source.gameType === 'open-court') {
            categories.openCourts.push(source);
        } else if (source.domain.includes('meetup') || source.domain.includes('facebook')) {
            categories.socialMedia.push(source);
        } else if (source.domain.includes('ubc') || source.domain.includes('sfu')) {
            categories.universities.push(source);
        } else if (source.method.type === 'api' && source.gameType === 'pickup') {
            categories.pickupApps.push(source);
        } else {
            categories.privateFacilities.push(source);
        }
    });
    
    return categories;
};

module.exports = {
    localSportsSources,
    categorizeLocalSources
};