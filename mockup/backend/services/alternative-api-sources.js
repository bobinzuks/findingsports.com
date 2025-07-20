/**
 * Alternative API Sources for Sports Activities
 * Replaces broken/defunct APIs with working alternatives
 */

const alternativeAPISources = [
  // === GOOGLE PLACES API ===
  // For venue information, busy times, and sports facilities
  {
    siteId: 'google-places-sports',
    domain: 'maps.googleapis.com',
    name: 'Google Places - Sports Venues',
    sport: 'multiple',
    gameType: 'venue-info',
    method: {
      type: 'api',
      endpoint: 'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
      requiresAuth: true,
      authType: 'apiKey',
      rateLimit: { requests: 1000, window: '24h' },
      params: {
        types: ['gym', 'stadium', 'sports_complex'],
        keyword: 'sports recreation drop-in'
      },
      dataMapping: {
        venues: 'results',
        name: 'name',
        address: 'vicinity',
        location: 'geometry.location',
        rating: 'rating',
        openNow: 'opening_hours.open_now'
      }
    },
    documentation: 'https://developers.google.com/maps/documentation/places/web-service/search-nearby'
  },

  // === MEETUP API ===
  // For sports meetups and pickup games
  {
    siteId: 'meetup-graphql-sports',
    domain: 'api.meetup.com',
    name: 'Meetup GraphQL API',
    sport: 'multiple',
    gameType: 'pickup',
    method: {
      type: 'graphql',
      endpoint: 'https://api.meetup.com/gql',
      requiresAuth: true,
      authType: 'oauth2',
      rateLimit: { requests: 200, window: '1h' },
      query: `
        query($lat: Float!, $lon: Float!, $radius: Int!, $topicCategoryId: Int!) {
          rankedEvents(
            filter: {
              lat: $lat,
              lon: $lon,
              radius: $radius,
              topicCategoryId: $topicCategoryId
            }
          ) {
            edges {
              node {
                title
                dateTime
                venue {
                  name
                  lat
                  lng
                }
                group {
                  name
                }
                going
                maxTickets
              }
            }
          }
        }
      `,
      variables: {
        topicCategoryId: 32  // Sports & Recreation
      }
    },
    documentation: 'https://www.meetup.com/api/schema/'
  },

  // === EVENTBRITE API ===
  // For organized sports events and tournaments
  {
    siteId: 'eventbrite-sports',
    domain: 'eventbriteapi.com',
    name: 'Eventbrite Sports Events',
    sport: 'multiple',
    gameType: 'event',
    method: {
      type: 'api',
      endpoint: 'https://www.eventbriteapi.com/v3/events/search/',
      requiresAuth: true,
      authType: 'bearer',
      rateLimit: { requests: 1000, window: '1h' },
      params: {
        categories: '108', // Sports & Fitness
        'location.within': '20km',
        'location.latitude': null, // Set dynamically
        'location.longitude': null, // Set dynamically
        'start_date.keyword': 'this_week'
      }
    },
    documentation: 'https://www.eventbrite.com/platform/api#/reference/event/search'
  },

  // === STRAVA API ===
  // For finding popular sports locations and segments
  {
    siteId: 'strava-segments',
    domain: 'strava.com',
    name: 'Strava Popular Segments',
    sport: 'multiple',
    gameType: 'location',
    method: {
      type: 'api',
      endpoint: 'https://www.strava.com/api/v3/segments/explore',
      requiresAuth: true,
      authType: 'oauth2',
      rateLimit: { requests: 600, window: '15m' },
      params: {
        bounds: null, // Set dynamically based on location
        activity_type: 'running' // Can be 'running' or 'riding'
      }
    },
    documentation: 'https://developers.strava.com/docs/reference/#api-Segments-exploreSegments'
  },

  // === WEATHER/FIELD CONDITIONS ===
  // OpenWeatherMap for field conditions
  {
    siteId: 'openweather-conditions',
    domain: 'api.openweathermap.org',
    name: 'OpenWeather Field Conditions',
    sport: 'multiple',
    gameType: 'conditions',
    method: {
      type: 'api',
      endpoint: 'https://api.openweathermap.org/data/2.5/weather',
      requiresAuth: true,
      authType: 'apiKey',
      rateLimit: { requests: 1000, window: '1d' },
      params: {
        units: 'metric'
      },
      dataMapping: {
        condition: 'weather[0].main',
        description: 'weather[0].description',
        temp: 'main.temp',
        humidity: 'main.humidity',
        rain: 'rain'
      }
    },
    documentation: 'https://openweathermap.org/current'
  },

  // === CITY OF VANCOUVER OPEN DATA ===
  // Direct access to city facilities data
  {
    siteId: 'vancouver-opendata-facilities',
    domain: 'opendata.vancouver.ca',
    name: 'Vancouver Open Data - Facilities',
    sport: 'multiple',
    gameType: 'facility',
    method: {
      type: 'api',
      endpoint: 'https://opendata.vancouver.ca/api/records/1.0/search/',
      requiresAuth: false,
      rateLimit: { requests: 5000, window: '1d' },
      params: {
        dataset: 'community-centres',
        rows: 100
      },
      dataMapping: {
        facilities: 'records',
        name: 'fields.name',
        address: 'fields.address',
        location: 'fields.geo_point_2d'
      }
    },
    documentation: 'https://opendata.vancouver.ca/explore/dataset/community-centres/'
  },

  // === ACTIVE NETWORK API ===
  // For recreation center programs and drop-ins
  {
    siteId: 'activenet-activities',
    domain: 'api.active.com',
    name: 'Active Network Activities',
    sport: 'multiple',
    gameType: 'program',
    method: {
      type: 'api',
      endpoint: 'https://api.active.com/v2/search',
      requiresAuth: true,
      authType: 'apiKey',
      rateLimit: { requests: 1000, window: '1h' },
      params: {
        category: 'event',
        topic: 'Sports and Fitness',
        radius: 20,
        current_page: 1,
        per_page: 100
      }
    },
    documentation: 'https://developer.active.com/docs/ActivitySearchV2'
  },

  // === FACEBOOK GRAPH API ===
  // For public sports events and groups
  {
    siteId: 'facebook-graph-events',
    domain: 'graph.facebook.com',
    name: 'Facebook Public Sports Events',
    sport: 'multiple',
    gameType: 'social',
    method: {
      type: 'api',
      endpoint: 'https://graph.facebook.com/v18.0/search',
      requiresAuth: true,
      authType: 'oauth2',
      rateLimit: { requests: 200, window: '1h' },
      params: {
        type: 'event',
        q: 'sports drop-in pickup vancouver',
        fields: 'name,start_time,place,description,attending_count'
      }
    },
    documentation: 'https://developers.facebook.com/docs/graph-api/reference/event'
  },

  // === RSS/ICAL FEEDS ===
  // City recreation calendars
  {
    siteId: 'vancouver-rec-calendar',
    domain: 'vancouver.ca',
    name: 'Vancouver Recreation Calendar Feed',
    sport: 'multiple',
    gameType: 'schedule',
    method: {
      type: 'ical',
      feedUrl: 'https://vancouver.ca/parks-recreation-culture/ical/drop-in-sports.ics',
      requiresAuth: false,
      updateFrequency: '1h'
    }
  },

  // === SPORTS ENGINE API ===
  // For league and tournament data
  {
    siteId: 'sportsengine-events',
    domain: 'api.sportsengine.com',
    name: 'SportsEngine Events',
    sport: 'multiple', 
    gameType: 'league',
    method: {
      type: 'api',
      endpoint: 'https://api.sportsengine.com/v1/events',
      requiresAuth: true,
      authType: 'apiKey',
      rateLimit: { requests: 1000, window: '1h' },
      params: {
        near: null, // Set dynamically
        radius: 20,
        sport_id: null // Set based on sport
      }
    }
  },

  // === FOURSQUARE PLACES API ===
  // Alternative to Google Places
  {
    siteId: 'foursquare-venues',
    domain: 'api.foursquare.com',
    name: 'Foursquare Sports Venues',
    sport: 'multiple',
    gameType: 'venue',
    method: {
      type: 'api',
      endpoint: 'https://api.foursquare.com/v3/places/search',
      requiresAuth: true,
      authType: 'apiKey',
      headers: {
        'Accept': 'application/json',
        'Authorization': 'fsq3YOUR_API_KEY'
      },
      rateLimit: { requests: 500, window: '1h' },
      params: {
        categories: '18000', // Sports and Recreation
        radius: 20000,
        limit: 50
      }
    },
    documentation: 'https://location.foursquare.com/developer/reference/place-search'
  },

  // === YELP FUSION API ===
  // For sports facilities and user reviews
  {
    siteId: 'yelp-sports-venues',
    domain: 'api.yelp.com',
    name: 'Yelp Sports Facilities',
    sport: 'multiple',
    gameType: 'venue',
    method: {
      type: 'api',
      endpoint: 'https://api.yelp.com/v3/businesses/search',
      requiresAuth: true,
      authType: 'bearer',
      rateLimit: { requests: 5000, window: '1d' },
      params: {
        categories: 'recreation,sports_clubs,fitness',
        radius: 20000,
        limit: 50,
        sort_by: 'distance'
      }
    },
    documentation: 'https://docs.developer.yelp.com/reference/v3_business_search'
  }
];

// Helper to get API configuration
const getAPIConfig = (siteId) => {
  return alternativeAPISources.find(source => source.siteId === siteId);
};

// Helper to check which APIs require keys
const getRequiredAPIKeys = () => {
  return alternativeAPISources
    .filter(source => source.method.requiresAuth)
    .map(source => ({
      siteId: source.siteId,
      name: source.name,
      authType: source.method.authType,
      documentation: source.documentation
    }));
};

module.exports = {
  alternativeAPISources,
  getAPIConfig,
  getRequiredAPIKeys
};