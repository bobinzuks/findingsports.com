#!/usr/bin/env python3
"""
University Recreation Facility Extractor
100% Automated extraction from university recreation websites
Handles UBC, SFU, VIU, TRU, UNBC, and other BC universities
"""

import asyncio
import aiohttp
import json
import re
from datetime import datetime
from typing import List, Dict, Optional, Any
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import logging
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class UniversityRecreationExtractor:
    """Specialized extractor for university recreation facilities"""
    
    def __init__(self):
        self.session = None
        self.driver = None
        
        # University-specific configurations based on research
        self.university_configs = {
            'ubc.ca': {
                'recreation_base': 'https://recreation.ubc.ca',
                'facilities_path': '/facilities/',
                'booking_api': '/api/facilities/',
                'selectors': {
                    'facility_cards': '.facility-card, .rec-facility, .sport-facility',
                    'facility_name': 'h2, h3, .facility-title, .card-title',
                    'facility_type': '.facility-type, .sport-type, .category',
                    'location': '.location, .building, .address',
                    'hours': '.hours, .operating-hours, .schedule',
                    'amenities': '.amenities, .features, .equipment',
                    'booking_link': '.book-now, .reserve, .booking'
                },
                'api_patterns': {
                    'facilities': r'/api/(v\d+/)?facilities',
                    'schedules': r'/api/(v\d+/)?schedules',
                    'availability': r'/api/(v\d+/)?availability'
                },
                'sports_facilities': [
                    'aquatic centre', 'gymnasium', 'fitness centre', 'tennis courts',
                    'squash courts', 'climbing wall', 'dance studio', 'martial arts'
                ]
            },
            'sfu.ca': {
                'recreation_base': 'https://www.sfu.ca/recreation',
                'facilities_path': '/facilities/',
                'selectors': {
                    'facility_cards': '.facility-item, .rec-item',
                    'facility_name': 'h2, h3, .title',
                    'facility_type': '.type, .category',
                    'location': '.location, .campus',
                    'hours': '.hours, .schedule',
                    'description': '.description, .details'
                },
                'sports_facilities': [
                    'gymnasium', 'pool', 'fitness centre', 'courts', 'fields'
                ]
            },
            'viu.ca': {
                'recreation_base': 'https://www.viu.ca/campuslife/recreation',
                'facilities_path': '/facilities/',
                'selectors': {
                    'facility_cards': '.facility, .rec-facility',
                    'facility_name': 'h2, h3',
                    'location': '.campus, .location',
                    'hours': '.hours'
                },
                'sports_facilities': ['gymnasium', 'fitness', 'courts']
            },
            'tru.ca': {
                'recreation_base': 'https://www.tru.ca/recreation',
                'facilities_path': '/facilities/',
                'selectors': {
                    'facility_cards': '.facility-card',
                    'facility_name': 'h2, h3',
                    'location': '.location',
                    'hours': '.hours'
                },
                'sports_facilities': ['gymnasium', 'pool', 'fitness']
            },
            'unbc.ca': {
                'recreation_base': 'https://www.unbc.ca/recreation',
                'facilities_path': '/facilities/',
                'selectors': {
                    'facility_cards': '.facility',
                    'facility_name': 'h2, h3',
                    'location': '.location',
                    'hours': '.hours'
                },
                'sports_facilities': ['gymnasium', 'fitness', 'courts']
            }
        }
        
        # Generic university patterns for unknown sites
        self.generic_university_patterns = {
            'recreation_paths': [
                '/recreation', '/athletics', '/campus-recreation', '/rec-services',
                '/student-life/recreation', '/campuslife/recreation'
            ],
            'facility_paths': [
                '/facilities', '/sports-facilities', '/recreation-facilities',
                '/gyms', '/pools', '/courts', '/fitness'
            ],
            'api_indicators': [
                'api/facilities', 'api/recreation', 'api/booking',
                'rest/facilities', 'json/facilities'
            ]
        }
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30),
            headers={'User-Agent': 'UniversityRecBot/1.0 (Research)'}
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
        if self.driver:
            self.driver.quit()
    
    def setup_selenium_driver(self):
        """Setup Selenium driver for JavaScript-heavy university sites"""
        if self.driver:
            return
        
        chrome_options = Options()
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        
        try:
            self.driver = webdriver.Chrome(options=chrome_options)
        except Exception as e:
            logger.warning(f"Failed to setup Selenium driver: {e}")
    
    async def extract_all_universities(self) -> List[Dict[str, Any]]:
        """Extract from all configured universities"""
        all_facilities = []
        
        for domain, config in self.university_configs.items():
            try:
                logger.info(f"Extracting from {domain}")
                facilities = await self.extract_university_facilities(domain, config)
                all_facilities.extend(facilities)
                logger.info(f"Found {len(facilities)} facilities from {domain}")
            except Exception as e:
                logger.error(f"Failed to extract from {domain}: {e}")
        
        return all_facilities
    
    async def extract_university_facilities(self, domain: str, config: Dict) -> List[Dict[str, Any]]:
        """Extract facilities from a specific university"""
        facilities = []
        
        # First, try to discover API endpoints
        api_facilities = await self.discover_and_extract_api_data(domain, config)
        if api_facilities:
            facilities.extend(api_facilities)
            logger.info(f"Found {len(api_facilities)} facilities via API from {domain}")
        
        # Then, scrape the regular web pages
        web_facilities = await self.extract_web_facilities(domain, config)
        facilities.extend(web_facilities)
        
        # Merge and deduplicate
        facilities = self.deduplicate_facilities(facilities)
        
        return facilities
    
    async def discover_and_extract_api_data(self, domain: str, config: Dict) -> List[Dict[str, Any]]:
        """Discover and extract data from university APIs"""
        api_facilities = []
        
        # Check for known API patterns
        api_patterns = config.get('api_patterns', {})
        base_url = config['recreation_base']
        
        for api_type, pattern in api_patterns.items():
            api_urls = await self.discover_api_endpoints(base_url, pattern)
            
            for api_url in api_urls:
                try:
                    data = await self.extract_from_api_endpoint(api_url, api_type, domain)
                    if data:
                        api_facilities.extend(data)
                except Exception as e:
                    logger.debug(f"Failed to extract from API {api_url}: {e}")
        
        return api_facilities
    
    async def discover_api_endpoints(self, base_url: str, pattern: str) -> List[str]:
        """Discover API endpoints using pattern matching"""
        api_endpoints = []
        
        # Common API paths to check
        api_paths = ['/api/facilities', '/api/v1/facilities', '/api/v2/facilities',
                    '/rest/facilities', '/json/facilities', '/api/recreation']
        
        for path in api_paths:
            if re.search(pattern, path):
                api_url = base_url + path
                # Check if endpoint exists
                try:
                    async with self.session.get(api_url) as response:
                        if response.status == 200:
                            content_type = response.headers.get('content-type', '')
                            if 'json' in content_type:
                                api_endpoints.append(api_url)
                except:
                    pass
        
        return api_endpoints
    
    async def extract_from_api_endpoint(self, api_url: str, api_type: str, domain: str) -> List[Dict[str, Any]]:
        """Extract facility data from API endpoint"""
        try:
            async with self.session.get(api_url) as response:
                if response.status != 200:
                    return []
                
                data = await response.json()
                
                facilities = []
                
                # Handle different API response structures
                if isinstance(data, list):
                    facility_list = data
                elif isinstance(data, dict):
                    # Try common keys for facility lists
                    facility_list = (data.get('facilities') or 
                                   data.get('data') or 
                                   data.get('results') or 
                                   data.get('items') or [])
                else:
                    return []
                
                for item in facility_list:
                    if isinstance(item, dict):
                        facility = self.parse_api_facility_data(item, api_type, domain)
                        if facility:
                            facilities.append(facility)
                
                return facilities
        
        except Exception as e:
            logger.debug(f"API extraction failed for {api_url}: {e}")
            return []
    
    def parse_api_facility_data(self, data: Dict, api_type: str, domain: str) -> Optional[Dict[str, Any]]:
        """Parse facility data from API response"""
        facility = {
            'source': f'{domain}_api',
            'api_type': api_type,
            'extraction_method': 'university_api',
            'extracted_at': datetime.now().isoformat()
        }
        
        # Map common API fields to our structure
        field_mappings = {
            'name': ['name', 'title', 'facility_name', 'facilityName'],
            'type': ['type', 'category', 'facility_type', 'facilityType'],
            'location': ['location', 'address', 'building', 'room'],
            'capacity': ['capacity', 'max_capacity', 'maxCapacity'],
            'amenities': ['amenities', 'features', 'equipment'],
            'hours': ['hours', 'operating_hours', 'schedule'],
            'booking_url': ['booking_url', 'reservation_url', 'book_link']
        }
        
        for our_field, api_fields in field_mappings.items():
            for api_field in api_fields:
                if api_field in data:
                    facility[our_field] = data[api_field]
                    break
        
        # Ensure we have at least a name
        if not facility.get('name'):
            return None
        
        # Extract sports/activities from various fields
        sports = self.extract_sports_from_api_data(data)
        if sports:
            facility['sports'] = sports
        
        return facility
    
    def extract_sports_from_api_data(self, data: Dict) -> List[str]:
        """Extract sports activities from API data"""
        sports = []
        
        # Check various fields for sports information
        sports_fields = ['sports', 'activities', 'programs', 'type', 'category', 'description']
        
        for field in sports_fields:
            value = data.get(field)
            if isinstance(value, list):
                sports.extend([str(v).title() for v in value if v])
            elif isinstance(value, str) and value:
                # Parse sports from text
                detected_sports = self.detect_sports_in_text(value)
                sports.extend(detected_sports)
        
        return list(set(sports))  # Remove duplicates
    
    def detect_sports_in_text(self, text: str) -> List[str]:
        """Detect sports activities in text"""
        sports_keywords = {
            'Basketball': ['basketball', 'hoops', 'court'],
            'Swimming': ['swimming', 'pool', 'aquatic', 'lanes'],
            'Tennis': ['tennis', 'racquet'],
            'Volleyball': ['volleyball', 'net'],
            'Badminton': ['badminton', 'shuttlecock'],
            'Squash': ['squash', 'racquetball'],
            'Fitness': ['fitness', 'gym', 'weights', 'cardio'],
            'Dance': ['dance', 'studio'],
            'Martial Arts': ['martial arts', 'karate', 'judo'],
            'Climbing': ['climbing', 'wall', 'boulder'],
            'Track': ['track', 'running', 'athletics'],
            'Soccer': ['soccer', 'football', 'pitch'],
            'Hockey': ['hockey', 'rink', 'ice']
        }
        
        detected_sports = []
        text_lower = text.lower()
        
        for sport, keywords in sports_keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                detected_sports.append(sport)
        
        return detected_sports
    
    async def extract_web_facilities(self, domain: str, config: Dict) -> List[Dict[str, Any]]:
        """Extract facilities from web pages"""
        facilities = []
        
        # Get facility pages
        facility_pages = await self.discover_facility_pages(domain, config)
        
        for page_url in facility_pages:
            try:
                page_facilities = await self.extract_facilities_from_page(page_url, config, domain)
                facilities.extend(page_facilities)
            except Exception as e:
                logger.debug(f"Failed to extract from page {page_url}: {e}")
        
        return facilities
    
    async def discover_facility_pages(self, domain: str, config: Dict) -> List[str]:
        """Discover facility pages on university website"""
        pages = set()
        
        base_url = config['recreation_base']
        facilities_url = base_url + config['facilities_path']
        
        pages.add(facilities_url)
        
        # Crawl main facilities page for additional links
        try:
            async with self.session.get(facilities_url) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    # Find facility-related links
                    for link in soup.find_all('a', href=True):
                        href = link['href']
                        if self.is_facility_related_link(href):
                            full_url = urljoin(facilities_url, href)
                            pages.add(full_url)
        
        except Exception as e:
            logger.debug(f"Failed to discover pages from {facilities_url}: {e}")
        
        return list(pages)
    
    def is_facility_related_link(self, href: str) -> bool:
        """Check if link is facility-related"""
        facility_keywords = [
            'gym', 'pool', 'court', 'field', 'arena', 'studio',
            'fitness', 'aquatic', 'recreation', 'sports'
        ]
        href_lower = href.lower()
        return any(keyword in href_lower for keyword in facility_keywords)
    
    async def extract_facilities_from_page(self, page_url: str, config: Dict, domain: str) -> List[Dict[str, Any]]:
        """Extract facilities from a single page"""
        facilities = []
        
        try:
            # First try regular HTTP request
            async with self.session.get(page_url) as response:
                if response.status != 200:
                    return facilities
                
                html = await response.text()
                
                # Check if page needs JavaScript rendering
                if self.needs_javascript_rendering(html):
                    facilities = await self.extract_with_selenium(page_url, config, domain)
                else:
                    facilities = await self.extract_with_beautifulsoup(html, page_url, config, domain)
        
        except Exception as e:
            logger.debug(f"Failed to extract from {page_url}: {e}")
        
        return facilities
    
    def needs_javascript_rendering(self, html: str) -> bool:
        """Check if page needs JavaScript to render content"""
        js_indicators = [
            'react', 'angular', 'vue', 'loading...', 'please enable javascript',
            'document.getElementById', 'addEventListener'
        ]
        html_lower = html.lower()
        return any(indicator in html_lower for indicator in js_indicators)
    
    async def extract_with_beautifulsoup(self, html: str, page_url: str, config: Dict, domain: str) -> List[Dict[str, Any]]:
        """Extract facilities using BeautifulSoup"""
        facilities = []
        soup = BeautifulSoup(html, 'html.parser')
        
        selectors = config['selectors']
        
        # Find facility containers
        containers = soup.select(selectors['facility_cards'])
        
        for container in containers:
            facility = self.extract_facility_from_container(container, selectors, page_url, domain)
            if facility:
                facilities.append(facility)
        
        return facilities
    
    async def extract_with_selenium(self, page_url: str, config: Dict, domain: str) -> List[Dict[str, Any]]:
        """Extract facilities using Selenium for JavaScript pages"""
        if not self.driver:
            self.setup_selenium_driver()
        
        if not self.driver:
            return []
        
        facilities = []
        
        try:
            self.driver.get(page_url)
            
            # Wait for content to load
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            
            # Additional wait for dynamic content
            await asyncio.sleep(3)
            
            html = self.driver.page_source
            soup = BeautifulSoup(html, 'html.parser')
            
            selectors = config['selectors']
            containers = soup.select(selectors['facility_cards'])
            
            for container in containers:
                facility = self.extract_facility_from_container(container, selectors, page_url, domain)
                if facility:
                    facilities.append(facility)
        
        except Exception as e:
            logger.debug(f"Selenium extraction failed for {page_url}: {e}")
        
        return facilities
    
    def extract_facility_from_container(self, container, selectors: Dict, page_url: str, domain: str) -> Optional[Dict[str, Any]]:
        """Extract facility data from container element"""
        facility = {
            'source_url': page_url,
            'university_domain': domain,
            'extraction_method': 'university_web',
            'extracted_at': datetime.now().isoformat()
        }
        
        # Extract name
        name_elem = container.select_one(selectors['facility_name'])
        if name_elem:
            facility['name'] = self.clean_text(name_elem.get_text())
        else:
            return None
        
        # Extract facility type
        type_elem = container.select_one(selectors.get('facility_type', ''))
        if type_elem:
            facility['facility_type'] = self.clean_text(type_elem.get_text())
        
        # Extract location
        location_elem = container.select_one(selectors.get('location', ''))
        if location_elem:
            facility['location'] = self.clean_text(location_elem.get_text())
        
        # Extract hours
        hours_elem = container.select_one(selectors.get('hours', ''))
        if hours_elem:
            facility['hours'] = self.clean_text(hours_elem.get_text())
        
        # Extract amenities
        amenities_elem = container.select_one(selectors.get('amenities', ''))
        if amenities_elem:
            facility['amenities'] = self.parse_amenities(amenities_elem.get_text())
        
        # Extract booking link
        booking_elem = container.select_one(selectors.get('booking_link', ''))
        if booking_elem and booking_elem.get('href'):
            facility['booking_url'] = urljoin(page_url, booking_elem['href'])
        
        # Detect sports from all text content
        container_text = container.get_text()
        facility['sports'] = self.detect_sports_in_text(container_text)
        
        return facility
    
    def clean_text(self, text: str) -> str:
        """Clean and normalize text"""
        if not text:
            return ""
        return re.sub(r'\s+', ' ', text.strip())
    
    def parse_amenities(self, amenities_text: str) -> List[str]:
        """Parse amenities from text"""
        if not amenities_text:
            return []
        
        # Split by common delimiters
        amenities = re.split(r'[,;•\n]', amenities_text)
        return [self.clean_text(amenity) for amenity in amenities if amenity.strip()]
    
    def deduplicate_facilities(self, facilities: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Remove duplicate facilities"""
        seen = set()
        unique_facilities = []
        
        for facility in facilities:
            # Create unique key based on name and location
            key = f"{facility.get('name', '').lower()}_{facility.get('location', '').lower()}"
            
            if key not in seen:
                seen.add(key)
                unique_facilities.append(facility)
        
        return unique_facilities

# Example usage and testing
async def test_university_extractor():
    """Test the university extractor"""
    async with UniversityRecreationExtractor() as extractor:
        # Test with UBC
        ubc_config = extractor.university_configs['ubc.ca']
        facilities = await extractor.extract_university_facilities('ubc.ca', ubc_config)
        
        print(f"Extracted {len(facilities)} facilities from UBC")
        
        if facilities:
            print("\nSample facility:")
            print(json.dumps(facilities[0], indent=2))

if __name__ == "__main__":
    asyncio.run(test_university_extractor())