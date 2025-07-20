/**
 * Web Scraping Sources for Sports Activities
 * Uses Puppeteer/Playwright for dynamic content
 */

const webScrapingSources = [
  // === RECREATION CENTER WEBSITES ===
  {
    siteId: 'vancouver-rec-scraper',
    domain: 'vancouver.ca',
    name: 'Vancouver Recreation Drop-ins',
    sport: 'multiple',
    gameType: 'drop-in',
    method: {
      type: 'scraper',
      requiresJS: true,
      urls: [
        'https://ca.apm.activecommunities.com/vancouver/Activity_Search?detailskeyword=drop-in&IsAdvanced=True&ddlSortBy=Activity+name',
        'https://ca.apm.activecommunities.com/vancouver/Activity_Search?detailskeyword=drop+in+sports&IsAdvanced=True&ddlSortBy=Activity+name'
      ],
      selectors: {
        activities: '.ActivitySearchResult',
        title: '.ActivityName',
        location: '.ActivityLocation',
        time: '.ActivitySchedule',
        age: '.ActivityAge',
        price: '.ActivityPrice',
        description: '.ActivityDescription'
      },
      pagination: {
        nextButton: '.pagination-next',
        maxPages: 5
      },
      waitFor: '.ActivitySearchResult',
      timeout: 30000
    }
  },

  // === BURNABY RECREATION ===
  {
    siteId: 'burnaby-rec-scraper',
    domain: 'burnaby.ca',
    name: 'Burnaby Drop-in Activities',
    sport: 'multiple',
    gameType: 'drop-in',
    method: {
      type: 'scraper',
      requiresJS: true,
      urls: [
        'https://www.burnaby.ca/recreation-and-arts/recreation-centres/drop-programs',
        'https://www.burnaby.ca/recreation-and-arts/recreation-centres/gymnasium-schedules'
      ],
      selectors: {
        schedule: '.drop-in-schedule table',
        rows: 'tbody tr',
        facility: 'td:nth-child(1)',
        activity: 'td:nth-child(2)', 
        day: 'td:nth-child(3)',
        time: 'td:nth-child(4)',
        age: 'td:nth-child(5)'
      },
      dataProcessor: 'burnaby-schedule-parser'
    }
  },

  // === SURREY RECREATION ===
  {
    siteId: 'surrey-rec-scraper',
    domain: 'surrey.ca',
    name: 'Surrey Drop-in Sports',
    sport: 'multiple',
    gameType: 'drop-in',
    method: {
      type: 'scraper',
      requiresJS: false,
      urls: [
        'https://www.surrey.ca/recreation-culture/recreation-centres-arenas/drop-programs',
        'https://www.surrey.ca/recreation-culture/recreation-centres-arenas/gymnasium-schedules'
      ],
      selectors: {
        facilities: '.facility-card',
        name: '.facility-name',
        dropInLink: 'a[href*="drop-in"]',
        schedule: '.schedule-table'
      },
      followLinks: true,
      linkSelector: 'a[href*="drop-in-schedule"]'
    }
  },

  // === RICHMOND RECREATION ===
  {
    siteId: 'richmond-rec-scraper',
    domain: 'richmond.ca',
    name: 'Richmond Drop-in Programs',
    sport: 'multiple',
    gameType: 'drop-in',
    method: {
      type: 'scraper',
      requiresJS: true,
      urls: [
        'https://www.richmond.ca/recreation/drop-in.htm',
        'https://www.richmond.ca/recreation/facilities/facility-schedules.htm'
      ],
      selectors: {
        dropInSection: '#drop-in-programs',
        facility: '.facility-block',
        schedule: '.schedule-content',
        activity: '.activity-name',
        times: '.activity-times'
      },
      iframe: {
        selector: 'iframe[src*="activecommunities"]',
        waitFor: '.ActivityDetails'
      }
    }
  },

  // === YMCA SCHEDULES ===
  {
    siteId: 'ymca-gv-scraper',
    domain: 'gv.ymca.ca',
    name: 'YMCA Drop-in Sports',
    sport: 'multiple',
    gameType: 'drop-in',
    method: {
      type: 'scraper',
      requiresJS: true,
      urls: [
        'https://gv.ymca.ca/schedules/group-fitness-schedules',
        'https://gv.ymca.ca/schedules/gymnasium-schedules'
      ],
      selectors: {
        scheduleWidget: '.schedule-widget',
        dayTabs: '.day-tab',
        activities: '.schedule-item',
        time: '.schedule-time',
        name: '.schedule-name',
        location: '.schedule-location',
        instructor: '.schedule-instructor'
      },
      actions: [
        { type: 'click', selector: '.location-dropdown', wait: 500 },
        { type: 'select', selector: '.location-select', value: 'all' },
        { type: 'wait', time: 2000 }
      ]
    }
  },

  // === COMMUNITY CENTER WEBSITES ===
  {
    siteId: 'kerrisdale-cc-scraper',
    domain: 'kerrisdalecc.com',
    name: 'Kerrisdale Community Centre',
    sport: 'multiple',
    gameType: 'drop-in',
    method: {
      type: 'scraper',
      requiresJS: false,
      urls: ['https://www.kerrisdalecc.com/dropin'],
      selectors: {
        schedule: '.dropin-schedule',
        day: '.schedule-day',
        activities: '.schedule-activity',
        time: '.activity-time',
        name: '.activity-name',
        age: '.activity-age'
      }
    }
  },

  // === SPORTS-SPECIFIC FACILITIES ===
  {
    siteId: 'tennis-bc-scraper',
    domain: 'tennisbc.org',
    name: 'Tennis BC Court Availability',
    sport: 'tennis',
    gameType: 'open-court',
    method: {
      type: 'scraper',
      requiresJS: true,
      urls: ['https://www.tennisbc.org/court-finder'],
      selectors: {
        courts: '.court-listing',
        name: '.court-name',
        address: '.court-address',
        type: '.court-type',
        availability: '.court-availability',
        booking: '.booking-link'
      },
      geoLocation: {
        extract: true,
        selector: '.court-map-link'
      }
    }
  },

  // === BASKETBALL COURTS ===
  {
    siteId: 'courts-of-world-scraper',
    domain: 'courtsoftheworld.com',
    name: 'Basketball Courts Database',
    sport: 'basketball',
    gameType: 'open-court',
    method: {
      type: 'scraper',
      requiresJS: true,
      urls: ['https://www.courtsoftheworld.com/courts/Canada/British-Columbia/Vancouver'],
      selectors: {
        courts: '.court-card',
        name: '.court-title',
        address: '.court-address',
        type: '.court-type',
        hoops: '.court-hoops',
        rating: '.court-rating',
        photos: '.court-photos img'
      },
      pagination: {
        loadMore: '.load-more-courts',
        scrollToLoad: true
      }
    }
  },

  // === SOCCER FIELDS ===
  {
    siteId: 'bc-soccer-fields',
    domain: 'bcsoccer.net',
    name: 'BC Soccer Field Directory',
    sport: 'soccer',
    gameType: 'open-field',
    method: {
      type: 'scraper',
      requiresJS: false,
      urls: [
        'https://www.bcsoccer.net/field-directory',
        'https://www.bcsoccer.net/field-availability'
      ],
      selectors: {
        fields: '.field-entry',
        name: '.field-name',
        location: '.field-location',
        surface: '.field-surface',
        lights: '.field-lights',
        status: '.field-status'
      }
    }
  },

  // === MEETUP SCRAPER ===
  {
    siteId: 'meetup-sports-scraper',
    domain: 'meetup.com',
    name: 'Meetup Sports Groups',
    sport: 'multiple',
    gameType: 'pickup',
    method: {
      type: 'scraper',
      requiresJS: true,
      urls: [
        'https://www.meetup.com/find/?keywords=sports&location=ca--bc--vancouver&source=EVENTS',
        'https://www.meetup.com/find/?keywords=pickup%20basketball&location=ca--bc--vancouver',
        'https://www.meetup.com/find/?keywords=drop-in%20soccer&location=ca--bc--vancouver'
      ],
      selectors: {
        events: '[data-element-name="categoryResults-eventCard"]',
        title: 'h3',
        group: '[data-testid="event-group-name"]',
        time: 'time',
        location: '[data-testid="venue-name"]',
        attendees: '[data-testid="attendee-count"]',
        link: 'a[href^="/events/"]'
      },
      cookies: {
        accept: true,
        selector: '[data-testid="cookie-consent-accept"]'
      },
      scrolling: {
        enabled: true,
        maxScrolls: 5,
        waitBetween: 2000
      }
    }
  },

  // === FACEBOOK EVENTS SCRAPER ===
  {
    siteId: 'facebook-events-scraper',
    domain: 'facebook.com',
    name: 'Facebook Sports Events',
    sport: 'multiple',
    gameType: 'social',
    method: {
      type: 'scraper',
      requiresJS: true,
      requiresAuth: false, // Public events only
      urls: [
        'https://www.facebook.com/search/events/?q=vancouver%20drop%20in%20sports',
        'https://www.facebook.com/search/events/?q=vancouver%20pickup%20basketball',
        'https://www.facebook.com/search/events/?q=vancouver%20soccer%20pickup'
      ],
      selectors: {
        events: '[role="article"]',
        title: '[role="presentation"] span',
        time: '[aria-label*="Start time"]',
        location: '[aria-label*="Location"]',
        interested: '[aria-label*="interested"]',
        image: 'img[referrerpolicy="origin-when-cross-origin"]'
      },
      publicOnly: true
    }
  },

  // === SPORTS BOOKING PLATFORMS ===
  {
    siteId: 'opensports-web-scraper',
    domain: 'opensports.ca',
    name: 'OpenSports Canada',
    sport: 'multiple',
    gameType: 'pickup',
    method: {
      type: 'scraper',
      requiresJS: true,
      urls: ['https://opensports.ca/games?city=vancouver'],
      selectors: {
        games: '.game-card',
        sport: '.game-sport',
        venue: '.game-venue',
        time: '.game-time',
        spotsLeft: '.spots-available',
        skillLevel: '.skill-level',
        joinButton: '.join-game-btn'
      }
    }
  },

  // === FIELD BOOKING SYSTEMS ===
  {
    siteId: 'perfect-mind-scraper',
    domain: 'perfectmind.com',
    name: 'PerfectMind Facility Bookings',
    sport: 'multiple',
    gameType: 'facility',
    method: {
      type: 'scraper',
      requiresJS: true,
      urls: [
        'https://vancouver.perfectmind.com/24063/Clients/BookMe4FacilityList',
        'https://burnaby.perfectmind.com/24063/Clients/BookMe4FacilityList'
      ],
      selectors: {
        facilities: '.facility-item',
        name: '.facility-name',
        availability: '.availability-grid',
        timeSlot: '.time-slot',
        bookButton: '.book-button'
      },
      iframe: {
        present: true,
        selector: 'iframe[name="BookMe4"]',
        switchTo: true
      }
    }
  },

  // === SPORTS COMPLEX WEBSITES ===
  {
    siteId: 'richmond-oval-scraper',
    domain: 'richmondoval.ca',
    name: 'Richmond Olympic Oval',
    sport: 'multiple',
    gameType: 'drop-in',
    method: {
      type: 'scraper',
      requiresJS: true,
      urls: ['https://www.richmondoval.ca/drop-in-schedules'],
      selectors: {
        schedule: '.schedule-container',
        activity: '.schedule-activity',
        time: '.schedule-time',
        location: '.schedule-location',
        spots: '.available-spots'
      },
      dynamicContent: {
        waitFor: '.schedule-loaded',
        timeout: 10000
      }
    }
  },

  // === SPECIALIZED SCRAPERS ===
  {
    siteId: 'playfinder-scraper',
    domain: 'playfinder.com',
    name: 'Playfinder Sports Venues',
    sport: 'multiple',
    gameType: 'booking',
    method: {
      type: 'scraper',
      requiresJS: true,
      urls: ['https://www.playfinder.com/search?location=Vancouver%2C+BC'],
      selectors: {
        venues: '.venue-card',
        name: '.venue-name',
        sports: '.venue-sports',
        address: '.venue-address',
        availability: '.venue-availability',
        price: '.venue-price'
      },
      filters: {
        sport: '#sport-filter',
        date: '#date-filter',
        time: '#time-filter'
      }
    }
  }
];

// Data processors for complex schedule parsing
const dataProcessors = {
  'burnaby-schedule-parser': (data) => {
    // Parse Burnaby's specific table format
    const activities = [];
    data.rows.forEach(row => {
      activities.push({
        facility: row.facility,
        activity: row.activity,
        schedule: {
          day: row.day,
          time: row.time
        },
        ageGroup: row.age
      });
    });
    return activities;
  }
};

// Scraping configuration
const scrapingConfig = {
  puppeteer: {
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ],
    defaultViewport: {
      width: 1920,
      height: 1080
    }
  },
  playwright: {
    headless: true,
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  },
  retry: {
    attempts: 3,
    delay: 2000
  },
  timeout: 30000
};

module.exports = {
  webScrapingSources,
  dataProcessors,
  scrapingConfig
};