# External API Requirements Documentation

## Overview
The Finding Sports platform integrates with multiple external APIs to provide comprehensive sports activity data. This document outlines the requirements, costs, and implementation strategies for each external API.

## Failed External APIs Requiring Keys

### 1. Google Places API
- **Purpose**: Venue information, busy times, sports facilities
- **Authentication**: API Key required
- **Rate Limits**: 1000 requests per 24 hours (free tier)
- **Cost**: $0.017 per request after free tier
- **Setup**:
  1. Create Google Cloud Platform account
  2. Enable Places API
  3. Generate API key
  4. Set environment variable: `GOOGLE_PLACES_API_KEY`
- **Fallback Strategy**: Use OpenStreetMap Nominatim for basic venue data

### 2. Eventbrite API
- **Purpose**: Sports events and tournaments
- **Authentication**: OAuth 2.0 Bearer Token
- **Rate Limits**: 2000 requests per hour
- **Cost**: Free for public event data
- **Setup**:
  1. Create Eventbrite account
  2. Register app at https://www.eventbrite.com/platform
  3. Get OAuth token
  4. Set environment variable: `EVENTBRITE_API_KEY`
- **Fallback Strategy**: Scrape public event pages with puppeteer

### 3. Strava API
- **Purpose**: Running and cycling activities
- **Authentication**: OAuth 2.0
- **Rate Limits**: 600 requests per 15 minutes
- **Cost**: Free tier available
- **Setup**:
  1. Create Strava account
  2. Register app at https://www.strava.com/settings/api
  3. Implement OAuth flow
  4. Set environment variables: `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`
- **Fallback Strategy**: Use MapMyRun public routes

### 4. Meetup GraphQL API
- **Purpose**: Sports meetups and pickup games
- **Authentication**: OAuth 2.0
- **Rate Limits**: 200 requests per hour
- **Cost**: $30/month for Pro account (required for API)
- **Setup**:
  1. Create Meetup Pro account
  2. Register OAuth app
  3. Implement OAuth flow
  4. Set environment variable: `MEETUP_API_KEY`
- **Fallback Strategy**: Scrape public Meetup pages

### 5. Facebook Graph API
- **Purpose**: Facebook events and groups
- **Authentication**: Access Token
- **Rate Limits**: Complex, based on app tier
- **Cost**: Free but requires app review
- **Setup**:
  1. Create Facebook Developer account
  2. Create app
  3. Submit for review (can take weeks)
  4. Set environment variable: `FACEBOOK_ACCESS_TOKEN`
- **Fallback Strategy**: Not available due to strict policies

### 6. SportsEngine API
- **Purpose**: Youth sports leagues
- **Authentication**: API Key + Secret
- **Rate Limits**: Varies by partnership
- **Cost**: Partnership required
- **Setup**:
  1. Contact SportsEngine for partnership
  2. Sign agreement
  3. Receive credentials
  4. Set environment variables: `SPORTSENGINE_API_KEY`, `SPORTSENGINE_SECRET`
- **Fallback Strategy**: Parse public team pages

### 7. TeamSnap API
- **Purpose**: Team management and schedules
- **Authentication**: OAuth 2.0
- **Rate Limits**: 5000 requests per hour
- **Cost**: Free for basic access
- **Setup**:
  1. Register at https://auth.teamsnap.com/oauth/applications
  2. Get OAuth credentials
  3. Set environment variables: `TEAMSNAP_CLIENT_ID`, `TEAMSNAP_CLIENT_SECRET`
- **Fallback Strategy**: Limited public data available

### 8. Playfinder API
- **Purpose**: UK sports venue booking
- **Authentication**: API Key
- **Rate Limits**: 1000 requests per day
- **Cost**: Contact for pricing
- **Setup**:
  1. Contact Playfinder for API access
  2. Sign commercial agreement
  3. Set environment variable: `PLAYFINDER_API_KEY`
- **Fallback Strategy**: Use alternative UK sources

### 9. OpenSports API
- **Purpose**: Global sports data
- **Authentication**: API Key
- **Rate Limits**: 500 requests per day (free)
- **Cost**: Free tier available, $99/month pro
- **Setup**:
  1. Register at opensports.io
  2. Get API key
  3. Set environment variable: `OPENSPORTS_API_KEY`
- **Fallback Strategy**: Use community-sourced data

## Recommended Implementation Priority

### Phase 1: Free/Low-Cost APIs (Week 1)
1. **Eventbrite** - Free, lots of public sports events
2. **Strava** - Free tier, popular for running/cycling
3. **TeamSnap** - Free basic access
4. **OpenSports** - Free tier available

### Phase 2: Essential Paid APIs (Week 2)
1. **Google Places** - Essential for venue data ($200 credit free)
2. **Meetup** - Worth the $30/month for active groups

### Phase 3: Partnership APIs (Month 2+)
1. **SportsEngine** - If targeting youth sports
2. **Facebook** - If approved after review
3. **Playfinder** - If expanding to UK market

## Fallback Strategies Implementation

### 1. Enhanced Web Scraping
```javascript
// Already implemented with puppeteer-extra
const fallbackSources = {
  'google-places': 'openstreetmap',
  'eventbrite': 'eventbrite-public-scraper',
  'meetup': 'meetup-public-scraper',
  'strava': 'mapmyrun-public'
};
```

### 2. Community Data Sources
- Leverage existing 51 local sources
- Add user-submitted venues and games
- Build community database over time

### 3. Caching Strategy
- Cache successful API responses for 24 hours
- Use cached data when API limits reached
- Implement intelligent refresh cycles

### 4. Progressive Enhancement
- Start with free local sources
- Add external APIs as budget allows
- Prioritize based on user demand

## Environment Variables Template

```bash
# Google APIs
GOOGLE_PLACES_API_KEY=your_key_here

# Event APIs  
EVENTBRITE_API_KEY=your_token_here

# Sports APIs
STRAVA_CLIENT_ID=your_client_id
STRAVA_CLIENT_SECRET=your_secret
OPENSPORTS_API_KEY=your_key_here

# Social APIs
MEETUP_API_KEY=your_key_here
FACEBOOK_ACCESS_TOKEN=your_token_here

# Team Management
TEAMSNAP_CLIENT_ID=your_client_id
TEAMSNAP_CLIENT_SECRET=your_secret
SPORTSENGINE_API_KEY=your_key_here
SPORTSENGINE_SECRET=your_secret

# Regional APIs
PLAYFINDER_API_KEY=your_key_here
```

## Cost Analysis

### Minimum Viable Product (MVP)
- **Monthly Cost**: $0
- **APIs**: Use only free tiers and web scraping
- **Coverage**: 70% of desired data

### Recommended Setup
- **Monthly Cost**: $30-50
- **APIs**: Meetup Pro + Google Places free tier
- **Coverage**: 85% of desired data

### Full Integration
- **Monthly Cost**: $200-500
- **APIs**: All paid APIs with higher limits
- **Coverage**: 95%+ of desired data

## Monitoring and Optimization

### API Usage Tracking
```javascript
const apiUsageTracker = {
  googlePlaces: { used: 0, limit: 1000, reset: '24h' },
  eventbrite: { used: 0, limit: 2000, reset: '1h' },
  meetup: { used: 0, limit: 200, reset: '1h' }
};
```

### Intelligent Request Distribution
- Rotate between APIs for similar data
- Use cheapest API first
- Fall back to expensive APIs only when needed

### Error Handling
- Graceful degradation when APIs fail
- User notification for degraded service
- Automatic fallback to cached/scraped data

## Conclusion

The platform is designed to work without external APIs through its 51 local data sources. External APIs should be added progressively based on:
1. User demand for specific data
2. Available budget
3. Geographic expansion needs

The fallback strategies ensure the platform remains functional even without any external API keys, making it resilient and cost-effective.