# Sports Data API Catalog

## 1. Google Places API

### Overview
Google's comprehensive location API with real-time business information including sports venues.

### Endpoints
- **Nearby Search**: `https://maps.googleapis.com/maps/api/place/nearbysearch/json`
- **Text Search**: `https://maps.googleapis.com/maps/api/place/textsearch/json`
- **Place Details**: `https://maps.googleapis.com/maps/api/place/details/json`

### Supported Venue Types
- `gym` - Fitness centers and gyms
- `stadium` - Sports stadiums
- `park` - Parks (may include sports facilities)
- Note: `sports_complex` is not a valid type

### Data Available
- Venue name, address, location (lat/lng)
- Opening hours (real-time)
- User ratings and reviews
- Photos
- Contact information
- Popular times data

### Rate Limits & Pricing
- **Pricing**: $17 per 1,000 requests (Nearby Search/Text Search)
- **Details**: $32 per 1,000 requests (Place Details)
- **Free Tier**: $200 monthly credit
- **Rate Limit**: No hard limit, but billing-based

### Authentication
- API Key required
- Enable "Places API" in Google Cloud Console

### Example Request
```bash
curl "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=43.6532,-79.3832&radius=5000&type=gym&key=YOUR_API_KEY"
```

## 2. Municipal Open Data APIs

### Toronto Open Data Portal

#### Overview
Comprehensive open data platform with recreation facilities and programs.

#### Endpoints
- **Base URL**: `https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action/`
- **Recreation Facilities**: `datastore_search?resource_id=e7c6e6cc-2e4f-4abd-8da3-87f595926744`
- **Parks**: `datastore_search?resource_id=parks-dataset-id`

#### Data Available
- Facility locations with coordinates
- Facility types and amenities
- Program schedules
- Drop-in schedules
- Permit booking information

#### Rate Limits & Pricing
- **FREE** - No authentication required
- Reasonable use expected
- No hard rate limits published

### NYC Open Data (Socrata API)

#### Overview
NYC's open data platform with athletic facilities and recreation data.

#### Endpoints
- **Athletic Facilities**: `https://data.cityofnewyork.us/resource/xx67-kt59.json`
- **Parks Properties**: `https://data.cityofnewyork.us/resource/enfh-gkve.json`
- **Parks Events**: `https://data.cityofnewyork.us/resource/8vkx-29is.json`

#### Data Available
- Facility locations and types
- Sports available at each facility
- Accessibility information
- Operating status

#### Rate Limits & Pricing
- **FREE** - Optional app token for higher limits
- Without token: 1,000 requests/hour
- With token: 50,000 requests/hour

### Chicago Data Portal

#### Overview
Chicago's comprehensive recreation and parks data.

#### Endpoints
- **Parks**: `https://data.cityofchicago.org/resource/parks.json`
- **Park Facilities**: `https://data.cityofchicago.org/resource/park-facilities.json`

#### Data Available
- Park locations and boundaries
- Facility types within parks
- Activity offerings
- Contact information

### Seattle Open Data

#### Endpoints
- **Parks**: `https://data.seattle.gov/resource/parks.json`
- **Community Centers**: Via ARCGIS REST services

## 3. Sports Organization APIs

### YMCA API

#### Overview
Limited central API, but YMCA offers Digital Services platform.

#### Access
- **Central API**: `api.ymca.net` (limited access)
- **Digital Services**: Per-branch implementation
- Most branches use custom systems

#### Data Available
- Branch locations
- Program schedules
- Membership requirements
- Drop-in schedules (varies by branch)

#### Integration Strategy
- Partner with local YMCA branches
- Use web scraping for public schedules
- Check for branch-specific APIs

### Local Sports Leagues
Many local leagues have custom APIs or data feeds:
- Contact individual leagues for API access
- Common platforms: TeamSnap, LeagueApps, SportsEngine

## 4. Recreation Management System APIs

### ActiveNet (ACTIVE Network)

#### Overview
Comprehensive recreation management platform used by many municipalities.

#### Access
- Requires licensing agreement
- API access for partners only
- Powers many city recreation websites

#### Data Available
- Facility schedules
- Program registration
- Drop-in schedules
- Real-time availability

### RecDesk

#### Overview
Cloud-based recreation management software.

#### Features
- RESTful API available
- Webhook support
- Real-time data sync
- Integration with Kisi (access control)

#### Access
- API documentation for customers
- OAuth 2.0 authentication
- Rate limits vary by plan

## 5. Event Platform APIs

### Eventbrite API

#### Overview
Popular event platform that includes many sports events and drop-in sessions.

#### Endpoints
- **Base URL**: `https://www.eventbriteapi.com/v3/`
- **Event Search**: `/events/search/`
- **Venue Details**: `/venues/{id}/`

#### Authentication
- OAuth 2.0 required
- Personal tokens available

#### Rate Limits
- 2,000 requests per hour
- Pagination required for large result sets

### Meetup API

#### Overview
Social platform for organizing group activities including sports.

#### Current Status
- Transitioned to GraphQL API
- Requires Meetup Pro subscription
- Limited free access

## 6. Alternative Location APIs

### Geoapify Places API

#### Overview
Google Places alternative with competitive pricing.

#### Features
- Similar place categories
- Geocoding included
- Cheaper than Google

### Foursquare Places API

#### Features
- Venue database
- Real-time information
- User-generated content

### OpenStreetMap Overpass API

#### Features
- **FREE** and open source
- Community-maintained data
- Complex query language
- No rate limits (be respectful)

## 7. Specialized Sports APIs

### PlayPass

- Youth sports management
- League schedules
- Facility bookings

### Courts4Sports

- Court booking systems
- Real-time availability
- Multiple facility support

## Integration Recommendations

### Priority 1: Free Municipal APIs
- Start with Toronto, NYC, Chicago open data
- No cost, reliable data
- Government-maintained

### Priority 2: Google Places API
- Comprehensive venue data
- Use selectively due to cost
- Good for filling gaps

### Priority 3: Web Scraping
- For venues without APIs
- Target YMCA, community centers
- Respect robots.txt

### Priority 4: Partnerships
- ActiveNet/RecDesk partnerships
- Direct relationships with venues
- Custom data feeds

## Cost Optimization Strategy

1. **Cache Everything**: Reduce API calls through aggressive caching
2. **Batch Requests**: Combine multiple queries where possible
3. **Use Free First**: Prioritize free municipal APIs
4. **Selective Enhancement**: Use paid APIs only for high-value data
5. **Monitor Usage**: Track API costs and adjust strategy

## Update Frequency Recommendations

- **Venue Information**: Daily
- **Drop-in Schedules**: Every 4-6 hours
- **Special Events**: Hourly during peak times
- **Static Data**: Weekly