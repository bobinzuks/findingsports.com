#!/usr/bin/env python3
"""
API Integration Harvester
100% Automated extraction from APIs: Google Places, Meetup, Facebook Events, Yelp, etc.
High-priority targets with excellent API access
"""

import asyncio
import aiohttp
import json
import time
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
import logging
import hashlib
import re
from urllib.parse import quote_plus

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class APIIntegrationHarvester:
    """Harvester for API-based sports venue data"""
    
    def __init__(self, config_file: str = "api_config.json"):
        self.session = None
        self.config = self.load_config(config_file)
        self.rate_limiters = {}
        
        # BC Cities for geographic searches
        self.bc_cities = [
            'Vancouver', 'Burnaby', 'Richmond', 'Surrey', 'Coquitlam', 'Langley',
            'Delta', 'North Vancouver', 'West Vancouver', 'Port Moody', 'New Westminster',
            'Maple Ridge', 'White Rock', 'Port Coquitlam', 'Chilliwack', 'Abbotsford',
            'Mission', 'Pitt Meadows', 'Victoria', 'Saanich', 'Esquimalt', 'Oak Bay',
            'Sidney', 'Langford', 'Sooke', 'Duncan', 'Nanaimo', 'Parksville',
            'Qualicum Beach', 'Port Alberni', 'Tofino', 'Ucluelet', 'Campbell River',
            'Courtenay', 'Comox', 'Kelowna', 'Vernon', 'Penticton', 'Kamloops',
            'Prince George', 'Williams Lake', 'Quesnel', 'Revelstoke', 'Golden',
            'Cranbrook', 'Fernie', 'Kimberley', 'Castlegar', 'Nelson', 'Trail',
            'Fort St. John', 'Dawson Creek', 'Fort Nelson', 'Terrace', 'Kitimat',
            'Prince Rupert', 'Smithers', 'Whistler', 'Squamish', 'Pemberton',
            'Sechelt', 'Gibsons', 'Powell River'
        ]
        
        # Sports-related search terms
        self.sports_keywords = [
            'basketball', 'hockey', 'swimming', 'tennis', 'soccer', 'volleyball',
            'badminton', 'squash', 'racquetball', 'table tennis', 'gymnastics',
            'martial arts', 'boxing', 'wrestling', 'fitness', 'gym', 'yoga',
            'pilates', 'dance', 'rock climbing', 'bowling', 'curling', 'skating',
            'cycling', 'running', 'track', 'field', 'baseball', 'softball',
            'lacrosse', 'rugby', 'football', 'golf', 'skiing', 'snowboarding'
        ]
    
    def load_config(self, config_file: str) -> Dict:
        """Load API configuration"""
        default_config = {
            'google_places_api_key': 'YOUR_GOOGLE_PLACES_API_KEY',
            'meetup_api_key': 'YOUR_MEETUP_API_KEY',
            'facebook_access_token': 'YOUR_FACEBOOK_ACCESS_TOKEN',
            'yelp_api_key': 'YOUR_YELP_API_KEY',
            'foursquare_client_id': 'YOUR_FOURSQUARE_CLIENT_ID',
            'foursquare_client_secret': 'YOUR_FOURSQUARE_CLIENT_SECRET',
            'eventbrite_api_key': 'YOUR_EVENTBRITE_API_KEY',
            
            'rate_limits': {
                'google_places': {'requests_per_second': 10, 'daily_limit': 100000},
                'meetup': {'requests_per_second': 10, 'daily_limit': 10000},
                'facebook': {'requests_per_second': 5, 'daily_limit': 50000},
                'yelp': {'requests_per_second': 5, 'daily_limit': 5000},
                'foursquare': {'requests_per_second': 5, 'daily_limit': 50000},
                'eventbrite': {'requests_per_second': 5, 'daily_limit': 1000}
            },
            
            'search_radius': 10000,  # 10km radius
            'max_results_per_search': 60,
            'enable_caching': True,
            'cache_duration_hours': 24
        }
        
        try:
            with open(config_file, 'r') as f:
                user_config = json.load(f)
                default_config.update(user_config)
        except FileNotFoundError:
            logger.info(f"Config file {config_file} not found, using defaults")
        
        return default_config
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30),
            headers={'User-Agent': 'FindingSports API Harvester/1.0'}
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def harvest_all_apis(self) -> List[Dict[str, Any]]:
        """Harvest from all configured APIs"""
        all_venues = []
        
        # Harvest from each API source
        harvesters = [
            ('Google Places', self.harvest_google_places),
            ('Meetup', self.harvest_meetup_events),
            ('Facebook Events', self.harvest_facebook_events),
            ('Yelp', self.harvest_yelp_businesses),
            ('Foursquare', self.harvest_foursquare_venues),
            ('Eventbrite', self.harvest_eventbrite_events)
        ]
        
        for source_name, harvester_func in harvesters:
            try:
                logger.info(f"Harvesting from {source_name}")
                venues = await harvester_func()
                all_venues.extend(venues)
                logger.info(f"Harvested {len(venues)} venues from {source_name}")
            except Exception as e:
                logger.error(f"Failed to harvest from {source_name}: {e}")
        
        # Deduplicate and merge
        unique_venues = self.deduplicate_venues(all_venues)
        logger.info(f"Total unique venues after deduplication: {len(unique_venues)}")
        
        return unique_venues
    
    async def harvest_google_places(self) -> List[Dict[str, Any]]:
        """Harvest sports venues from Google Places API"""
        if not self.config['google_places_api_key'] or self.config['google_places_api_key'] == 'YOUR_GOOGLE_PLACES_API_KEY':
            logger.warning("Google Places API key not configured")
            return []
        
        venues = []
        base_url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
        
        # Sports venue types for Google Places
        place_types = [
            'gym', 'stadium', 'bowling_alley', 'establishment'
        ]
        
        # Search keywords for establishments
        sports_queries = [
            'recreation center', 'community center', 'sports complex', 'fitness center',
            'aquatic center', 'ice rink', 'tennis club', 'basketball court',
            'swimming pool', 'martial arts', 'yoga studio', 'dance studio'
        ]
        
        for city in self.bc_cities[:20]:  # Limit to first 20 cities for demo
            city_coords = await self.get_city_coordinates(city)
            if not city_coords:
                continue
            
            # Search by place types
            for place_type in place_types:
                venues_batch = await self.search_google_places_by_type(
                    city_coords, place_type, city, base_url
                )
                venues.extend(venues_batch)
                await self.respect_rate_limit('google_places')
            
            # Search by keywords
            for query in sports_queries:
                venues_batch = await self.search_google_places_by_keyword(
                    city_coords, query, city, base_url
                )
                venues.extend(venues_batch)
                await self.respect_rate_limit('google_places')
        
        return venues
    
    async def get_city_coordinates(self, city: str) -> Optional[Dict[str, float]]:
        """Get coordinates for a city using geocoding"""
        if not self.config['google_places_api_key']:
            return None
        
        geocode_url = "https://maps.googleapis.com/maps/api/geocode/json"
        params = {
            'address': f"{city}, BC, Canada",
            'key': self.config['google_places_api_key']
        }
        
        try:
            async with self.session.get(geocode_url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    if data['status'] == 'OK' and data['results']:
                        location = data['results'][0]['geometry']['location']
                        return {'lat': location['lat'], 'lng': location['lng']}
        except Exception as e:
            logger.debug(f"Geocoding failed for {city}: {e}")
        
        return None
    
    async def search_google_places_by_type(self, coords: Dict[str, float], place_type: str, city: str, base_url: str) -> List[Dict[str, Any]]:
        """Search Google Places by place type"""
        params = {
            'location': f"{coords['lat']},{coords['lng']}",
            'radius': self.config['search_radius'],
            'type': place_type,
            'key': self.config['google_places_api_key']
        }
        
        venues = []
        
        try:
            async with self.session.get(base_url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    if data['status'] == 'OK':
                        for place in data.get('results', []):
                            venue = await self.parse_google_place(place, city, 'type_search')
                            if venue and self.is_sports_venue(venue):
                                venues.append(venue)
                        
                        # Handle pagination
                        next_page_token = data.get('next_page_token')
                        if next_page_token:
                            await asyncio.sleep(2)  # Required delay for next page
                            next_venues = await self.get_google_places_next_page(next_page_token, city)
                            venues.extend(next_venues)
        
        except Exception as e:
            logger.debug(f"Google Places search failed for {place_type} in {city}: {e}")
        
        return venues
    
    async def search_google_places_by_keyword(self, coords: Dict[str, float], keyword: str, city: str, base_url: str) -> List[Dict[str, Any]]:
        """Search Google Places by keyword"""
        params = {
            'location': f"{coords['lat']},{coords['lng']}",
            'radius': self.config['search_radius'],
            'keyword': keyword,
            'key': self.config['google_places_api_key']
        }
        
        venues = []
        
        try:
            async with self.session.get(base_url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    if data['status'] == 'OK':
                        for place in data.get('results', []):
                            venue = await self.parse_google_place(place, city, 'keyword_search')
                            if venue:
                                venues.append(venue)
        
        except Exception as e:
            logger.debug(f"Google Places keyword search failed for '{keyword}' in {city}: {e}")
        
        return venues
    
    async def get_google_places_next_page(self, next_page_token: str, city: str) -> List[Dict[str, Any]]:
        """Get next page of Google Places results"""
        base_url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
        params = {
            'pagetoken': next_page_token,
            'key': self.config['google_places_api_key']
        }
        
        venues = []
        
        try:
            async with self.session.get(base_url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    if data['status'] == 'OK':
                        for place in data.get('results', []):
                            venue = await self.parse_google_place(place, city, 'pagination')
                            if venue and self.is_sports_venue(venue):
                                venues.append(venue)
        
        except Exception as e:
            logger.debug(f"Google Places pagination failed: {e}")
        
        return venues
    
    async def parse_google_place(self, place: Dict, city: str, search_method: str) -> Dict[str, Any]:
        """Parse Google Places result into venue format"""
        venue = {
            'source': 'google_places',
            'search_method': search_method,
            'city': city,
            'extracted_at': datetime.now().isoformat()
        }
        
        # Basic information
        venue['name'] = place.get('name', '')
        venue['place_id'] = place.get('place_id', '')
        venue['address'] = place.get('vicinity', '')
        venue['types'] = place.get('types', [])
        
        # Location
        if 'geometry' in place and 'location' in place['geometry']:
            location = place['geometry']['location']
            venue['latitude'] = location.get('lat')
            venue['longitude'] = location.get('lng')
        
        # Rating and reviews
        venue['rating'] = place.get('rating')
        venue['user_ratings_total'] = place.get('user_ratings_total')
        venue['price_level'] = place.get('price_level')
        
        # Business status
        venue['business_status'] = place.get('business_status')
        venue['opening_hours'] = place.get('opening_hours', {})
        
        # Photos
        if 'photos' in place:
            venue['photos'] = [photo['photo_reference'] for photo in place['photos'][:3]]
        
        # Get detailed information
        if venue['place_id']:
            detailed_info = await self.get_google_place_details(venue['place_id'])
            if detailed_info:
                venue.update(detailed_info)
        
        return venue
    
    async def get_google_place_details(self, place_id: str) -> Optional[Dict[str, Any]]:
        """Get detailed information for a Google Place"""
        details_url = "https://maps.googleapis.com/maps/api/place/details/json"
        params = {
            'place_id': place_id,
            'fields': 'name,formatted_address,formatted_phone_number,website,opening_hours,types,reviews',
            'key': self.config['google_places_api_key']
        }
        
        try:
            async with self.session.get(details_url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    if data['status'] == 'OK' and 'result' in data:
                        result = data['result']
                        
                        details = {
                            'formatted_address': result.get('formatted_address'),
                            'phone': result.get('formatted_phone_number'),
                            'website': result.get('website'),
                            'detailed_types': result.get('types', [])
                        }
                        
                        # Parse opening hours
                        if 'opening_hours' in result:
                            opening_hours = result['opening_hours']
                            details['hours_text'] = opening_hours.get('weekday_text', [])
                            details['is_open_now'] = opening_hours.get('open_now')
                        
                        # Extract sports from reviews
                        if 'reviews' in result:
                            sports_from_reviews = self.extract_sports_from_reviews(result['reviews'])
                            if sports_from_reviews:
                                details['sports_from_reviews'] = sports_from_reviews
                        
                        return details
        
        except Exception as e:
            logger.debug(f"Failed to get place details for {place_id}: {e}")
        
        return None
    
    def extract_sports_from_reviews(self, reviews: List[Dict]) -> List[str]:
        """Extract sports activities mentioned in reviews"""
        sports_mentioned = []
        
        for review in reviews[:5]:  # Check first 5 reviews
            text = review.get('text', '').lower()
            
            for sport in self.sports_keywords:
                if sport in text and sport not in sports_mentioned:
                    sports_mentioned.append(sport.title())
        
        return sports_mentioned
    
    def is_sports_venue(self, venue: Dict[str, Any]) -> bool:
        """Check if venue is sports-related"""
        sports_indicators = [
            'gym', 'stadium', 'bowling_alley', 'establishment'
        ]
        
        # Check Google Places types
        venue_types = venue.get('types', [])
        if any(indicator in venue_types for indicator in sports_indicators):
            return True
        
        # Check name and description
        name = venue.get('name', '').lower()
        sports_terms = ['gym', 'fitness', 'sports', 'recreation', 'aquatic', 'arena', 'court', 'field', 'pool', 'rink']
        
        if any(term in name for term in sports_terms):
            return True
        
        return False
    
    async def harvest_meetup_events(self) -> List[Dict[str, Any]]:
        """Harvest sports venues from Meetup events"""
        if not self.config['meetup_api_key'] or self.config['meetup_api_key'] == 'YOUR_MEETUP_API_KEY':
            logger.warning("Meetup API key not configured")
            return []
        
        venues = []
        
        for city in self.bc_cities[:10]:  # Limit for demo
            try:
                city_venues = await self.get_meetup_venues_for_city(city)
                venues.extend(city_venues)
                await self.respect_rate_limit('meetup')
            except Exception as e:
                logger.debug(f"Meetup search failed for {city}: {e}")
        
        return venues
    
    async def get_meetup_venues_for_city(self, city: str) -> List[Dict[str, Any]]:
        """Get sports venues from Meetup events in a city"""
        # Note: Meetup API has changed, this is a conceptual implementation
        # You would need to adapt based on current Meetup API documentation
        
        venues = []
        base_url = "https://api.meetup.com/find/events"
        
        params = {
            'location': f"{city}, BC, Canada",
            'category': '9',  # Sports & Recreation
            'radius': 25,  # 25 miles
            'key': self.config['meetup_api_key']
        }
        
        try:
            async with self.session.get(base_url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    for event in data.get('data', []):
                        if 'venue' in event:
                            venue = await self.parse_meetup_venue(event['venue'], event, city)
                            if venue:
                                venues.append(venue)
        
        except Exception as e:
            logger.debug(f"Meetup API request failed for {city}: {e}")
        
        return venues
    
    async def parse_meetup_venue(self, venue_data: Dict, event_data: Dict, city: str) -> Optional[Dict[str, Any]]:
        """Parse Meetup venue data"""
        venue = {
            'source': 'meetup',
            'city': city,
            'extracted_at': datetime.now().isoformat()
        }
        
        venue['name'] = venue_data.get('name', '')
        venue['address'] = venue_data.get('address_1', '')
        venue['latitude'] = venue_data.get('lat')
        venue['longitude'] = venue_data.get('lon')
        
        # Extract sports from event name and description
        event_name = event_data.get('name', '')
        event_description = event_data.get('description', '')
        
        sports = self.detect_sports_in_text(f"{event_name} {event_description}")
        if sports:
            venue['sports'] = sports
        
        return venue if venue['name'] else None
    
    async def harvest_facebook_events(self) -> List[Dict[str, Any]]:
        """Harvest sports venues from Facebook Events"""
        # Note: Facebook Graph API access is limited for events
        # This is a conceptual implementation
        logger.info("Facebook Events harvesting would require Graph API access")
        return []
    
    async def harvest_yelp_businesses(self) -> List[Dict[str, Any]]:
        """Harvest sports venues from Yelp API"""
        if not self.config['yelp_api_key'] or self.config['yelp_api_key'] == 'YOUR_YELP_API_KEY':
            logger.warning("Yelp API key not configured")
            return []
        
        venues = []
        base_url = "https://api.yelp.com/v3/businesses/search"
        headers = {'Authorization': f"Bearer {self.config['yelp_api_key']}"}
        
        # Yelp categories for sports venues
        categories = [
            'gyms', 'swimmingpools', 'tennis', 'golf', 'bowling',
            'martialarts', 'yoga', 'dancestudios', 'rockclimbing'
        ]
        
        for city in self.bc_cities[:15]:  # Limit for demo
            for category in categories:
                try:
                    city_venues = await self.search_yelp_category(city, category, base_url, headers)
                    venues.extend(city_venues)
                    await self.respect_rate_limit('yelp')
                except Exception as e:
                    logger.debug(f"Yelp search failed for {category} in {city}: {e}")
        
        return venues
    
    async def search_yelp_category(self, city: str, category: str, base_url: str, headers: Dict) -> List[Dict[str, Any]]:
        """Search Yelp for a specific category in a city"""
        params = {
            'location': f"{city}, BC, Canada",
            'categories': category,
            'limit': 50,
            'radius': 10000  # 10km
        }
        
        venues = []
        
        try:
            async with self.session.get(base_url, params=params, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    
                    for business in data.get('businesses', []):
                        venue = self.parse_yelp_business(business, city, category)
                        if venue:
                            venues.append(venue)
        
        except Exception as e:
            logger.debug(f"Yelp category search failed: {e}")
        
        return venues
    
    def parse_yelp_business(self, business: Dict, city: str, category: str) -> Dict[str, Any]:
        """Parse Yelp business data"""
        venue = {
            'source': 'yelp',
            'city': city,
            'yelp_category': category,
            'extracted_at': datetime.now().isoformat()
        }
        
        venue['name'] = business.get('name', '')
        venue['yelp_id'] = business.get('id', '')
        venue['rating'] = business.get('rating')
        venue['review_count'] = business.get('review_count')
        venue['price'] = business.get('price')
        venue['phone'] = business.get('phone')
        venue['website'] = business.get('url')
        
        # Address
        if 'location' in business:
            location = business['location']
            venue['address'] = ', '.join(location.get('display_address', []))
            venue['city_from_yelp'] = location.get('city')
            venue['postal_code'] = location.get('zip_code')
        
        # Coordinates
        if 'coordinates' in business:
            coords = business['coordinates']
            venue['latitude'] = coords.get('latitude')
            venue['longitude'] = coords.get('longitude')
        
        # Categories
        if 'categories' in business:
            venue['yelp_categories'] = [cat['title'] for cat in business['categories']]
        
        return venue
    
    async def harvest_foursquare_venues(self) -> List[Dict[str, Any]]:
        """Harvest sports venues from Foursquare API"""
        # Foursquare API implementation would go here
        logger.info("Foursquare harvesting would be implemented here")
        return []
    
    async def harvest_eventbrite_events(self) -> List[Dict[str, Any]]:
        """Harvest sports venues from Eventbrite events"""
        # Eventbrite API implementation would go here
        logger.info("Eventbrite harvesting would be implemented here")
        return []
    
    def detect_sports_in_text(self, text: str) -> List[str]:
        """Detect sports activities in text"""
        if not text:
            return []
        
        detected_sports = []
        text_lower = text.lower()
        
        for sport in self.sports_keywords:
            if sport in text_lower and sport.title() not in detected_sports:
                detected_sports.append(sport.title())
        
        return detected_sports
    
    async def respect_rate_limit(self, api_name: str):
        """Respect API rate limits"""
        if api_name not in self.rate_limiters:
            self.rate_limiters[api_name] = {'last_request': 0}
        
        rate_limit = self.config['rate_limits'].get(api_name, {})
        requests_per_second = rate_limit.get('requests_per_second', 1)
        
        min_interval = 1.0 / requests_per_second
        
        last_request = self.rate_limiters[api_name]['last_request']
        time_since_last = time.time() - last_request
        
        if time_since_last < min_interval:
            sleep_time = min_interval - time_since_last
            await asyncio.sleep(sleep_time)
        
        self.rate_limiters[api_name]['last_request'] = time.time()
    
    def deduplicate_venues(self, venues: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Remove duplicate venues across different APIs"""
        seen_venues = {}
        unique_venues = []
        
        for venue in venues:
            # Create unique key based on name and approximate location
            key_parts = [
                venue.get('name', '').lower().strip(),
                str(round(venue.get('latitude', 0), 3)),  # Round to ~100m precision
                str(round(venue.get('longitude', 0), 3)),
                venue.get('city', '').lower()
            ]
            
            venue_key = '_'.join(filter(None, key_parts))
            
            if venue_key not in seen_venues:
                seen_venues[venue_key] = venue
                unique_venues.append(venue)
            else:
                # Merge data from multiple sources
                existing_venue = seen_venues[venue_key]
                merged_venue = self.merge_venue_data(existing_venue, venue)
                
                # Update in unique_venues list
                for i, v in enumerate(unique_venues):
                    if v == existing_venue:
                        unique_venues[i] = merged_venue
                        break
                
                seen_venues[venue_key] = merged_venue
        
        return unique_venues
    
    def merge_venue_data(self, existing: Dict[str, Any], new: Dict[str, Any]) -> Dict[str, Any]:
        """Merge venue data from multiple sources"""
        merged = existing.copy()
        
        # Combine sources
        existing_sources = merged.get('sources', [merged.get('source')])
        new_sources = [new.get('source')]
        merged['sources'] = list(set(existing_sources + new_sources))
        
        # Merge sports activities
        existing_sports = merged.get('sports', [])
        new_sports = new.get('sports', [])
        merged['sports'] = list(set(existing_sports + new_sports))
        
        # Take best available data for each field
        for field in ['phone', 'website', 'address', 'rating']:
            if not merged.get(field) and new.get(field):
                merged[field] = new[field]
        
        return merged

# Example usage and testing
async def test_api_harvester():
    """Test the API harvester"""
    async with APIIntegrationHarvester() as harvester:
        venues = await harvester.harvest_all_apis()
        
        print(f"Harvested {len(venues)} unique venues from all APIs")
        
        if venues:
            print("\nSample venue:")
            print(json.dumps(venues[0], indent=2))
        
        # Show breakdown by source
        sources = {}
        for venue in venues:
            source = venue.get('source', 'unknown')
            sources[source] = sources.get(source, 0) + 1
        
        print("\nVenues by source:")
        for source, count in sources.items():
            print(f"  {source}: {count}")

if __name__ == "__main__":
    asyncio.run(test_api_harvester())