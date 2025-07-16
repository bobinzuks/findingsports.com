# Comprehensive Sports Data API Catalog

## Overview
This catalog provides a comprehensive list of APIs available for accessing sports venue data, recreation facility information, and drop-in game schedules. Each API is documented with endpoints, data types, authentication requirements, and usage limitations.

---

## 1. Google Places API

### Overview
Google's comprehensive location and place information API with extensive sports venue coverage.

### Key Endpoints
- **Nearby Search**: `https://maps.googleapis.com/maps/api/place/nearbysearch/json`
- **Text Search**: `https://maps.googleapis.com/maps/api/place/textsearch/json`
- **Place Details**: `https://maps.googleapis.com/maps/api/place/details/json`

### Supported Place Types for Sports
- `gym` - Fitness centers and gyms
- `stadium` - Sports stadiums and arenas
- `park` - Parks with potential sports facilities
- Note: `sports_complex` is NOT currently supported

### Data Available
- Venue name, address, phone number
- Operating hours
- Photos
- User ratings and reviews
- Geographic coordinates
- Website URL

### Authentication
- API Key required
- OAuth 2.0 support available

### Rate Limits & Pricing
- Free tier: $200 monthly credit
- Nearby Search: $32.00 per 1,000 requests
- Text Search: $32.00 per 1,000 requests
- Place Details: $17.00 per 1,000 requests
- Daily request quotas apply

### Data Freshness
- Real-time data for basic information
- Hours and availability updated by business owners
- User reviews updated continuously

---

## 2. Municipal Open Data APIs

### 2.1 Toronto Open Data

**Portal**: https://open.toronto.ca/

#### Key Datasets
- Parks and Recreation Facilities
- Recreation Courts, Ice Rinks, Sports Fields

#### API Access
- RESTful API available
- Open311 implementation for service requests

#### Data Available
- Facility locations and types
- Booking availability for recreation courts
- Pool and splash pad schedules
- Sports field and stadium information

#### Authentication
- No authentication required for public data

#### Rate Limits
- Generally unlimited for public datasets

### 2.2 New York City Open Data

**Portal**: https://opendata.cityofnewyork.us/

#### Key Datasets
- **Athletic Facilities**: `https://data.cityofnewyork.us/dataset/Athletic-Facilities/qpgi-ckmp`
- **Parks Properties**: `https://data.cityofnewyork.us/Recreation/Parks-Properties/enfh-gkve`
- **Parks Special Events**: `https://data.cityofnewyork.us/Recreation/Parks-Special-Events/6v4b-5gp4`

#### API Access
- Socrata Open Data API (SODA)
- RESTful endpoints with JSON responses

#### Data Available
- Athletic facility locations and types
- Permittable sports facilities
- Special events including sports programs
- Facility amenities and features

#### Authentication
- Optional app tokens for higher rate limits

#### Rate Limits
- Without token: 1,000 requests/hour
- With token: Higher limits available

### 2.3 Chicago Data Portal

**Portal**: https://data.cityofchicago.org/

#### Key Datasets
- **Parks Facilities**: `https://data.cityofchicago.org/Parks-Recreation/Parks-Chicago-Park-District-Facilities-current-/5yyk-qt9y`
- **Park Activities**: `https://data.cityofchicago.org/Parks-Recreation/Chicago-Park-District-Activities/tn7v-6rnw`

#### API Access
- Open and standards-based APIs
- API console for testing

#### Data Available
- Facility locations and features
- Activity schedules
- Park amenities
- Athletic field information

#### Authentication
- No authentication for public data

#### Rate Limits
- Generous limits for public use

### 2.4 Seattle Open Data

**Portal**: https://data.seattle.gov/

#### Key Datasets
- **Parks and Recreation Addresses**: `https://data.seattle.gov/Community-and-Culture/Seattle-Parks-And-Recreation-Park-Addresses/v5tj-kqhc`
- Parks GIS data via ARCGIS services

#### API Access
- Socrata API platform
- ARCGIS REST services

#### Data Available
- Park locations and addresses
- Athletic facility information
- Recreation program data

#### Authentication
- Optional for enhanced access

#### Rate Limits
- Standard Socrata limits apply

---

## 3. Sports Organization APIs

### 3.1 YMCA API

**Base URL**: `https://api.ymca.net/` (limited public documentation)

#### YMCA Digital Services Platform
- **Documentation**: https://ds-docs.y.org/
- Open source platform for YMCA branches
- GitHub repository available

#### Program Event Framework (PEF)
- Manages schedules and calendar views
- Supports data import from Traction Rec
- Individual branch implementations vary

#### Data Available
- Program schedules by location
- Activity registration information
- Facility availability

#### Authentication
- Varies by branch
- OAuth typically required

#### Implementation Notes
- Many YMCAs use third-party scheduling systems
- Seattle YMCA: Browse schedules at seattleymca.org/schedules
- API access may require partnership agreement

---

## 4. Recreation Management System APIs

### 4.1 ActiveNet by ACTIVE Network

**Developer Portal**: https://developer.active.com/apis

#### Overview
- Comprehensive recreation management platform
- Powers many municipal recreation departments

#### API Features
- System APIs for Flex Registration
- Gateway API for internal development
- Limited public API access

#### Data Available
- Class and program registrations
- Facility scheduling
- Membership information
- League management data

#### Authentication
- Requires licensing agreement with ACTIVE Network
- OAuth-based authentication

#### Rate Limits
- Determined by licensing agreement
- Gateway API has specific terms of use

### 4.2 RecDesk

**Website**: https://recdesk.com

#### API Availability
- ✅ API Available
- Cloud-based recreation management software

#### Technical Infrastructure
- Runs on AWS
- SQL Server (AWS RDS) backend
- Incremental backups every 5 minutes

#### Data Available
- Online registration data
- Facility management information
- Program schedules and rosters
- Attendance records

#### Integrations
- Sparxo (ticketing)
- Kisi (access control)

#### Authentication
- API key required
- Contact RecDesk for developer access

---

## 5. Event Platform APIs

### 5.1 Eventbrite API

**Documentation**: https://www.eventbrite.com/platform/api

#### Key Endpoints
- **Event Search**: Filter events by category, location
- **Event Creation**: Create and manage events
- **Event Details**: Get comprehensive event information

#### Sports & Recreation Features
- Create sports events
- Search for recreation activities
- Manage registrations and attendees

#### Authentication
- OAuth 2.0 required
- API keys available in account settings

#### Rate Limits
- Subject to change
- Violations result in API access termination

#### Data Available
- Event descriptions and schedules
- Venue information
- Attendee/registration data
- Pricing and ticket availability

### 5.2 Meetup API

**Current Status**: Transitioned to GraphQL (REST API deprecated)

#### GraphQL API
- Modern query language
- Requires Meetup Pro subscription for new OAuth consumers

#### Authentication
- OAuth2 Server Flow
- Access tokens for GraphQL requests

#### Data Available
- Group information
- Event schedules
- Member details
- Topic/category filtering (including sports)

#### Limitations
- Pro subscription required for API access
- No feature parity with old REST endpoints
- GraphQL learning curve

---

## 6. Additional APIs Worth Exploring

### 6.1 Geoapify Places API
- Alternative to Google Places
- Sports venue search capabilities
- More affordable pricing

### 6.2 Foursquare Places API
- Venue database with sports locations
- Check-in data for popularity
- Developer-friendly documentation

### 6.3 OpenStreetMap Overpass API
- Free and open data
- Community-maintained
- Includes sports facilities tagging

### 6.4 Local Sports League APIs
- Many local leagues have custom APIs
- Requires direct contact with organizations
- Examples: local soccer leagues, basketball leagues

---

## Implementation Recommendations

### For Drop-in Game Schedules
1. **Primary Sources**:
   - Municipal open data portals (most reliable for public facilities)
   - Recreation management systems (ActiveNet, RecDesk)
   - YMCA branch-specific systems

2. **Supplementary Sources**:
   - Google Places for venue discovery
   - Eventbrite/Meetup for organized drop-in events
   - Direct facility websites (web scraping may be needed)

### Data Aggregation Strategy
1. Start with municipal open data (free, reliable)
2. Enhance with Google Places details
3. Add recreation management system data where available
4. Supplement with event platforms
5. Consider web scraping for facilities without APIs

### Authentication Best Practices
- Store API keys securely
- Implement rate limiting on your end
- Cache responses to minimize API calls
- Use OAuth where available for better security

### Cost Optimization
- Prioritize free municipal APIs
- Cache Google Places results aggressively
- Batch API requests where possible
- Monitor usage to stay within free tiers

---

## Conclusion

This catalog provides a foundation for building a comprehensive sports venue and drop-in game discovery system. The combination of municipal open data, commercial APIs, and recreation management systems can provide rich, real-time information about sports opportunities in any given area.

Key success factors:
- Start with free, open data sources
- Use commercial APIs strategically
- Build relationships with recreation management system providers
- Implement robust caching and data aggregation
- Consider web scraping as a fallback option