#!/usr/bin/env python3
"""
BC Sports Venues Data Collection Automation System
Comprehensive scraping and API integration for Finding Sports app
"""

import asyncio
import aiohttp
import json
import logging
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from typing import List, Dict, Optional, Any, Tuple
from urllib.parse import urljoin, urlparse
import re
from pathlib import Path
import hashlib

# Web scraping imports
from playwright import async_playwright
from bs4 import BeautifulSoup
import requests

# Database and caching
import sqlite3
import redis
from sqlalchemy import create_engine, Column, Integer, String, Text, Float, DateTime, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Natural language processing
import spacy
from dateutil import parser as date_parser

# Configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

Base = declarative_base()

@dataclass
class VenueData:
    """Standardized venue data structure"""
    name: str
    address: str
    city: str
    province: str = "BC"
    postal_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    sports: List[str] = None
    amenities: List[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    website: Optional[str] = None
    hours: Dict[str, str] = None
    schedule: Dict[str, Any] = None
    pricing: Dict[str, Any] = None
    accessibility: List[str] = None
    parking: bool = False
    public_transit: bool = False
    last_updated: datetime = None
    data_source: str = ""
    data_quality_score: float = 0.0
    
    def __post_init__(self):
        if self.sports is None:
            self.sports = []
        if self.amenities is None:
            self.amenities = []
        if self.hours is None:
            self.hours = {}
        if self.schedule is None:
            self.schedule = {}
        if self.pricing is None:
            self.pricing = {}
        if self.accessibility is None:
            self.accessibility = []
        if self.last_updated is None:
            self.last_updated = datetime.now()

class VenueModel(Base):
    """SQLAlchemy model for venue data"""
    __tablename__ = 'venues'
    
    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    address = Column(Text)
    city = Column(String(100))
    latitude = Column(Float)
    longitude = Column(Float)
    sports = Column(JSON)
    amenities = Column(JSON)
    contact_info = Column(JSON)
    schedule_data = Column(JSON)
    pricing_data = Column(JSON)
    data_source = Column(String(100))
    last_updated = Column(DateTime, default=datetime.now)
    data_quality_score = Column(Float, default=0.0)

class DataQualityValidator:
    """Validates and scores venue data quality"""
    
    def __init__(self):
        self.phone_pattern = re.compile(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b')
        self.email_pattern = re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b')
        self.postal_code_pattern = re.compile(r'\b[A-Za-z]\d[A-Za-z] ?\d[A-Za-z]\d\b')
    
    def validate_venue(self, venue: VenueData) -> float:
        """Calculate data quality score (0.0 to 1.0)"""
        score = 0.0
        max_score = 10.0
        
        # Required fields
        if venue.name and venue.name.strip():
            score += 2.0
        if venue.address and venue.address.strip():
            score += 2.0
        if venue.city and venue.city.strip():
            score += 1.0
        
        # Contact information
        if venue.phone and self.phone_pattern.search(venue.phone):
            score += 1.0
        if venue.email and self.email_pattern.search(venue.email):
            score += 0.5
        if venue.website and venue.website.startswith(('http://', 'https://')):
            score += 0.5
        
        # Location data
        if venue.latitude and venue.longitude:
            score += 1.0
        if venue.postal_code and self.postal_code_pattern.search(venue.postal_code):
            score += 0.5
        
        # Activity data
        if venue.sports and len(venue.sports) > 0:
            score += 1.0
        if venue.hours and len(venue.hours) > 0:
            score += 0.5
        
        return min(score / max_score, 1.0)

class GeoCodingService:
    """Geocoding service for venue addresses"""
    
    def __init__(self, google_api_key: str):
        self.api_key = google_api_key
        self.base_url = "https://maps.googleapis.com/maps/api/geocode/json"
        
    async def geocode_address(self, address: str, city: str = None) -> Tuple[Optional[float], Optional[float]]:
        """Convert address to latitude/longitude coordinates"""
        query = f"{address}, {city}, BC, Canada" if city else f"{address}, BC, Canada"
        
        params = {
            'address': query,
            'key': self.api_key
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(self.base_url, params=params) as response:
                    data = await response.json()
                    
                    if data['status'] == 'OK' and data['results']:
                        location = data['results'][0]['geometry']['location']
                        return location['lat'], location['lng']
                        
        except Exception as e:
            logger.error(f"Geocoding failed for {address}: {e}")
            
        return None, None

class ScheduleParser:
    """Natural language processing for schedule data"""
    
    def __init__(self):
        # Load spaCy model for English
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            logger.warning("spaCy model not found. Install with: python -m spacy download en_core_web_sm")
            self.nlp = None
    
    def parse_schedule_text(self, schedule_text: str) -> Dict[str, Any]:
        """Parse natural language schedule into structured data"""
        if not self.nlp or not schedule_text:
            return {}
        
        doc = self.nlp(schedule_text)
        schedule = {}
        
        # Extract days and times
        days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        day_abbrevs = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
        
        text_lower = schedule_text.lower()
        
        # Find time patterns
        time_pattern = re.compile(r'\b(\d{1,2}):?(\d{2})?\s*(am|pm|a\.m\.|p\.m\.)\b', re.IGNORECASE)
        times = time_pattern.findall(text_lower)
        
        # Basic schedule parsing
        for i, day in enumerate(days):
            if day in text_lower or day_abbrevs[i] in text_lower:
                # Extract times for this day
                day_times = self._extract_day_times(text_lower, day, day_abbrevs[i])
                if day_times:
                    schedule[day] = day_times
        
        return schedule
    
    def _extract_day_times(self, text: str, day: str, day_abbrev: str) -> Optional[str]:
        """Extract operating hours for a specific day"""
        # Find the position of the day in the text
        day_pos = text.find(day)
        if day_pos == -1:
            day_pos = text.find(day_abbrev)
        
        if day_pos == -1:
            return None
        
        # Extract text around the day mention
        context_start = max(0, day_pos - 20)
        context_end = min(len(text), day_pos + 100)
        context = text[context_start:context_end]
        
        # Look for time patterns
        time_pattern = re.compile(r'(\d{1,2}):?(\d{2})?\s*(am|pm)', re.IGNORECASE)
        times = time_pattern.findall(context)
        
        if len(times) >= 2:
            start_time = f"{times[0][0]}:{times[0][1] or '00'} {times[0][2]}"
            end_time = f"{times[1][0]}:{times[1][1] or '00'} {times[1][2]}"
            return f"{start_time} - {end_time}"
        
        return None

class BaseScraper:
    """Base class for all venue scrapers"""
    
    def __init__(self, name: str, base_url: str):
        self.name = name
        self.base_url = base_url
        self.session = None
        self.validator = DataQualityValidator()
        self.schedule_parser = ScheduleParser()
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30),
            headers={'User-Agent': 'Mozilla/5.0 (compatible; FindingSports/1.0)'}
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def scrape_venues(self) -> List[VenueData]:
        """Override in subclasses to implement specific scraping"""
        raise NotImplementedError
    
    def clean_text(self, text: str) -> str:
        """Clean and normalize text data"""
        if not text:
            return ""
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text.strip())
        
        # Remove common prefixes/suffixes
        text = re.sub(r'^(the\s+)', '', text, flags=re.IGNORECASE)
        
        return text
    
    def extract_phone(self, text: str) -> Optional[str]:
        """Extract phone number from text"""
        if not text:
            return None
            
        phone_match = re.search(r'\b(\d{3})[-.]?(\d{3})[-.]?(\d{4})\b', text)
        if phone_match:
            return f"{phone_match.group(1)}-{phone_match.group(2)}-{phone_match.group(3)}"
        
        return None
    
    def extract_email(self, text: str) -> Optional[str]:
        """Extract email address from text"""
        if not text:
            return None
            
        email_match = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text)
        if email_match:
            return email_match.group()
        
        return None

class VancouverMunicipalScraper(BaseScraper):
    """Scraper for Vancouver municipal recreation facilities"""
    
    def __init__(self):
        super().__init__("Vancouver Municipal", "https://vancouver.ca")
        self.facilities_url = "https://vancouver.ca/parks-recreation-culture/recreation-facilities.aspx"
    
    async def scrape_venues(self) -> List[VenueData]:
        venues = []
        
        try:
            async with self.session.get(self.facilities_url) as response:
                html = await response.text()
                soup = BeautifulSoup(html, 'html.parser')
                
                # Find facility listings
                facility_sections = soup.find_all('div', class_='facility-item')
                
                for section in facility_sections:
                    venue = await self._parse_facility_section(section)
                    if venue:
                        venues.append(venue)
                        
        except Exception as e:
            logger.error(f"Error scraping Vancouver facilities: {e}")
        
        return venues
    
    async def _parse_facility_section(self, section) -> Optional[VenueData]:
        """Parse individual facility section"""
        try:
            name_elem = section.find('h3') or section.find('h2')
            if not name_elem:
                return None
                
            name = self.clean_text(name_elem.get_text())
            
            # Extract address
            address_elem = section.find('div', class_='address') or section.find('p', class_='address')
            address = self.clean_text(address_elem.get_text()) if address_elem else ""
            
            # Extract contact info
            contact_text = section.get_text()
            phone = self.extract_phone(contact_text)
            email = self.extract_email(contact_text)
            
            # Extract sports/activities
            sports = []
            activities_elem = section.find('div', class_='activities') or section.find('ul', class_='activities')
            if activities_elem:
                for item in activities_elem.find_all(['li', 'span']):
                    sport = self.clean_text(item.get_text())
                    if sport and sport not in sports:
                        sports.append(sport)
            
            # Create venue data
            venue = VenueData(
                name=name,
                address=address,
                city="Vancouver",
                phone=phone,
                email=email,
                sports=sports,
                data_source=self.name,
                website=self.base_url
            )
            
            venue.data_quality_score = self.validator.validate_venue(venue)
            return venue
            
        except Exception as e:
            logger.error(f"Error parsing facility section: {e}")
            return None

class UBCRecreationScraper(BaseScraper):
    """Scraper for UBC Recreation facilities"""
    
    def __init__(self):
        super().__init__("UBC Recreation", "https://recreation.ubc.ca")
        self.facilities_url = "https://recreation.ubc.ca/facilities/"
    
    async def scrape_venues(self) -> List[VenueData]:
        venues = []
        
        try:
            async with self.session.get(self.facilities_url) as response:
                html = await response.text()
                soup = BeautifulSoup(html, 'html.parser')
                
                # UBC has different structure - adapt as needed
                facility_cards = soup.find_all('div', class_=['facility-card', 'card', 'facility-item'])
                
                for card in facility_cards:
                    venue = await self._parse_ubc_facility(card)
                    if venue:
                        venues.append(venue)
                        
        except Exception as e:
            logger.error(f"Error scraping UBC facilities: {e}")
        
        return venues
    
    async def _parse_ubc_facility(self, card) -> Optional[VenueData]:
        """Parse UBC facility card"""
        try:
            name_elem = card.find(['h2', 'h3', 'h4'])
            if not name_elem:
                return None
            
            name = self.clean_text(name_elem.get_text())
            
            # UBC facilities are all on campus
            address = "6081 University Blvd, Vancouver, BC"
            
            # Extract sports from description
            description = card.get_text()
            sports = self._extract_sports_from_description(description)
            
            venue = VenueData(
                name=f"UBC {name}",
                address=address,
                city="Vancouver",
                sports=sports,
                data_source=self.name,
                website=self.base_url
            )
            
            venue.data_quality_score = self.validator.validate_venue(venue)
            return venue
            
        except Exception as e:
            logger.error(f"Error parsing UBC facility: {e}")
            return None
    
    def _extract_sports_from_description(self, description: str) -> List[str]:
        """Extract sports activities from facility description"""
        sports_keywords = [
            'basketball', 'volleyball', 'badminton', 'tennis', 'squash', 'racquetball',
            'swimming', 'pool', 'gym', 'fitness', 'weight training', 'cardio',
            'yoga', 'pilates', 'dance', 'martial arts', 'rock climbing',
            'track', 'field', 'soccer', 'football', 'rugby', 'hockey',
            'table tennis', 'ping pong', 'pickleball'
        ]
        
        found_sports = []
        description_lower = description.lower()
        
        for sport in sports_keywords:
            if sport in description_lower and sport not in found_sports:
                found_sports.append(sport.title())
        
        return found_sports

class MeetupEventsScraper(BaseScraper):
    """Scraper for Meetup sports events"""
    
    def __init__(self, api_key: str):
        super().__init__("Meetup Events", "https://www.meetup.com")
        self.api_key = api_key
        self.api_base = "https://api.meetup.com"
    
    async def scrape_venues(self) -> List[VenueData]:
        """Scrape sports venues from Meetup events"""
        venues = []
        
        # Search for sports groups in BC cities
        cities = ['Vancouver', 'Burnaby', 'Richmond', 'Surrey', 'Victoria', 'Kelowna']
        
        for city in cities:
            city_venues = await self._scrape_city_venues(city)
            venues.extend(city_venues)
        
        return venues
    
    async def _scrape_city_venues(self, city: str) -> List[VenueData]:
        """Scrape venues for a specific city"""
        venues = []
        
        try:
            # Search for sports groups
            search_url = f"{self.api_base}/find/groups"
            params = {
                'location': f"{city}, BC, Canada",
                'category': '9',  # Sports & Recreation category
                'key': self.api_key,
                'page': 20
            }
            
            async with self.session.get(search_url, params=params) as response:
                if response.status == 200:
                    groups_data = await response.json()
                    
                    for group in groups_data.get('data', []):
                        group_venues = await self._extract_venues_from_group(group)
                        venues.extend(group_venues)
                        
        except Exception as e:
            logger.error(f"Error scraping Meetup venues for {city}: {e}")
        
        return venues
    
    async def _extract_venues_from_group(self, group_data: Dict) -> List[VenueData]:
        """Extract venue information from Meetup group data"""
        venues = []
        
        try:
            group_id = group_data.get('id')
            if not group_id:
                return venues
            
            # Get recent events for this group
            events_url = f"{self.api_base}/{group_id}/events"
            params = {
                'key': self.api_key,
                'status': 'past,upcoming',
                'page': 10
            }
            
            async with self.session.get(events_url, params=params) as response:
                if response.status == 200:
                    events_data = await response.json()
                    
                    for event in events_data.get('data', []):
                        venue = await self._parse_event_venue(event, group_data)
                        if venue:
                            venues.append(venue)
                            
        except Exception as e:
            logger.error(f"Error extracting venues from group: {e}")
        
        return venues
    
    async def _parse_event_venue(self, event_data: Dict, group_data: Dict) -> Optional[VenueData]:
        """Parse venue data from Meetup event"""
        try:
            venue_data = event_data.get('venue')
            if not venue_data:
                return None
            
            name = venue_data.get('name', 'Unknown Venue')
            address = venue_data.get('address_1', '')
            city = venue_data.get('city', '')
            
            # Extract sports from group name and event description
            group_name = group_data.get('name', '')
            event_name = event_data.get('name', '')
            description = event_data.get('description', '')
            
            sports = self._extract_sports_from_text(f"{group_name} {event_name} {description}")
            
            venue = VenueData(
                name=name,
                address=address,
                city=city,
                latitude=venue_data.get('lat'),
                longitude=venue_data.get('lon'),
                sports=sports,
                data_source=self.name
            )
            
            venue.data_quality_score = self.validator.validate_venue(venue)
            return venue
            
        except Exception as e:
            logger.error(f"Error parsing event venue: {e}")
            return None
    
    def _extract_sports_from_text(self, text: str) -> List[str]:
        """Extract sports from text content"""
        sports_patterns = {
            'Basketball': r'\b(basketball|bball|hoops)\b',
            'Soccer': r'\b(soccer|football|futbol)\b',
            'Tennis': r'\b(tennis)\b',
            'Volleyball': r'\b(volleyball|vball)\b',
            'Running': r'\b(running|jogging|run|runners)\b',
            'Cycling': r'\b(cycling|biking|bike)\b',
            'Swimming': r'\b(swimming|swim)\b',
            'Hockey': r'\b(hockey|ice hockey)\b',
            'Baseball': r'\b(baseball|softball)\b',
            'Badminton': r'\b(badminton)\b'
        }
        
        found_sports = []
        text_lower = text.lower()
        
        for sport, pattern in sports_patterns.items():
            if re.search(pattern, text_lower, re.IGNORECASE):
                found_sports.append(sport)
        
        return found_sports

class DataCollectionOrchestrator:
    """Orchestrates all data collection activities"""
    
    def __init__(self, config_path: str = "config.json"):
        self.config = self._load_config(config_path)
        self.scrapers = []
        self.geocoding_service = None
        self.database_url = self.config.get('database_url', 'sqlite:///venues.db')
        self.redis_client = None
        
        # Initialize services
        self._setup_services()
        self._setup_scrapers()
    
    def _load_config(self, config_path: str) -> Dict:
        """Load configuration from JSON file"""
        try:
            with open(config_path, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            # Default configuration
            return {
                'google_api_key': 'YOUR_GOOGLE_API_KEY',
                'meetup_api_key': 'YOUR_MEETUP_API_KEY',
                'database_url': 'sqlite:///venues.db',
                'redis_url': 'redis://localhost:6379',
                'scraping_delay': 1.0,
                'max_concurrent_scrapers': 5
            }
    
    def _setup_services(self):
        """Initialize supporting services"""
        google_api_key = self.config.get('google_api_key')
        if google_api_key and google_api_key != 'YOUR_GOOGLE_API_KEY':
            self.geocoding_service = GeoCodingService(google_api_key)
        
        # Initialize Redis if available
        try:
            redis_url = self.config.get('redis_url', 'redis://localhost:6379')
            self.redis_client = redis.from_url(redis_url)
            self.redis_client.ping()  # Test connection
        except Exception:
            logger.warning("Redis not available, caching disabled")
            self.redis_client = None
    
    def _setup_scrapers(self):
        """Initialize all scrapers"""
        self.scrapers = [
            VancouverMunicipalScraper(),
            UBCRecreationScraper(),
        ]
        
        # Add Meetup scraper if API key is available
        meetup_key = self.config.get('meetup_api_key')
        if meetup_key and meetup_key != 'YOUR_MEETUP_API_KEY':
            self.scrapers.append(MeetupEventsScraper(meetup_key))
    
    async def run_data_collection(self) -> Dict[str, Any]:
        """Run complete data collection process"""
        start_time = datetime.now()
        results = {
            'start_time': start_time,
            'scrapers_run': 0,
            'venues_collected': 0,
            'venues_geocoded': 0,
            'venues_stored': 0,
            'errors': []
        }
        
        logger.info("Starting data collection process...")
        
        # Run all scrapers concurrently
        semaphore = asyncio.Semaphore(self.config.get('max_concurrent_scrapers', 5))
        
        async def run_scraper(scraper):
            async with semaphore:
                try:
                    async with scraper:
                        venues = await scraper.scrape_venues()
                        return scraper.name, venues
                except Exception as e:
                    logger.error(f"Scraper {scraper.name} failed: {e}")
                    results['errors'].append(f"{scraper.name}: {str(e)}")
                    return scraper.name, []
        
        # Execute all scrapers
        scraper_tasks = [run_scraper(scraper) for scraper in self.scrapers]
        scraper_results = await asyncio.gather(*scraper_tasks, return_exceptions=True)
        
        # Process results
        all_venues = []
        for result in scraper_results:
            if isinstance(result, Exception):
                results['errors'].append(str(result))
                continue
            
            scraper_name, venues = result
            all_venues.extend(venues)
            results['scrapers_run'] += 1
            logger.info(f"Scraper {scraper_name} collected {len(venues)} venues")
        
        results['venues_collected'] = len(all_venues)
        
        # Geocode venues
        if self.geocoding_service:
            geocoded_venues = await self._geocode_venues(all_venues)
            results['venues_geocoded'] = sum(1 for v in geocoded_venues if v.latitude and v.longitude)
        else:
            geocoded_venues = all_venues
        
        # Remove duplicates
        unique_venues = self._deduplicate_venues(geocoded_venues)
        
        # Store venues
        stored_count = await self._store_venues(unique_venues)
        results['venues_stored'] = stored_count
        
        results['end_time'] = datetime.now()
        results['duration'] = (results['end_time'] - results['start_time']).total_seconds()
        
        logger.info(f"Data collection completed. Stored {stored_count} venues in {results['duration']:.2f} seconds")
        
        return results
    
    async def _geocode_venues(self, venues: List[VenueData]) -> List[VenueData]:
        """Geocode all venues that don't have coordinates"""
        geocoded_venues = []
        
        for venue in venues:
            if not venue.latitude or not venue.longitude:
                if venue.address and venue.city:
                    lat, lng = await self.geocoding_service.geocode_address(venue.address, venue.city)
                    if lat and lng:
                        venue.latitude = lat
                        venue.longitude = lng
            
            geocoded_venues.append(venue)
            
            # Rate limiting
            await asyncio.sleep(0.1)
        
        return geocoded_venues
    
    def _deduplicate_venues(self, venues: List[VenueData]) -> List[VenueData]:
        """Remove duplicate venues based on name and location"""
        seen_venues = {}
        unique_venues = []
        
        for venue in venues:
            # Create a hash based on name and approximate location
            venue_key = self._create_venue_key(venue)
            
            if venue_key not in seen_venues:
                seen_venues[venue_key] = venue
                unique_venues.append(venue)
            else:
                # Keep venue with higher data quality score
                existing_venue = seen_venues[venue_key]
                if venue.data_quality_score > existing_venue.data_quality_score:
                    seen_venues[venue_key] = venue
                    # Replace in unique_venues list
                    for i, v in enumerate(unique_venues):
                        if v == existing_venue:
                            unique_venues[i] = venue
                            break
        
        logger.info(f"Deduplicated {len(venues)} venues to {len(unique_venues)} unique venues")
        return unique_venues
    
    def _create_venue_key(self, venue: VenueData) -> str:
        """Create a unique key for venue deduplication"""
        name_normalized = re.sub(r'\W+', '', venue.name.lower())
        
        # Use coordinates if available, otherwise use address
        if venue.latitude and venue.longitude:
            # Round to 3 decimal places (about 100m precision)
            location_key = f"{venue.latitude:.3f},{venue.longitude:.3f}"
        else:
            location_key = re.sub(r'\W+', '', venue.address.lower() if venue.address else '')
        
        return f"{name_normalized}_{location_key}_{venue.city.lower() if venue.city else ''}"
    
    async def _store_venues(self, venues: List[VenueData]) -> int:
        """Store venues in database"""
        try:
            # Create database engine
            engine = create_engine(self.database_url)
            Base.metadata.create_all(engine)
            
            Session = sessionmaker(bind=engine)
            session = Session()
            
            stored_count = 0
            
            for venue in venues:
                try:
                    # Convert to database model
                    venue_model = VenueModel(
                        name=venue.name,
                        address=venue.address,
                        city=venue.city,
                        latitude=venue.latitude,
                        longitude=venue.longitude,
                        sports=venue.sports,
                        amenities=venue.amenities,
                        contact_info={
                            'phone': venue.phone,
                            'email': venue.email,
                            'website': venue.website
                        },
                        schedule_data=venue.schedule,
                        pricing_data=venue.pricing,
                        data_source=venue.data_source,
                        data_quality_score=venue.data_quality_score
                    )
                    
                    # Check if venue already exists
                    existing = session.query(VenueModel).filter_by(
                        name=venue.name,
                        city=venue.city
                    ).first()
                    
                    if existing:
                        # Update existing venue if new data has higher quality score
                        if venue.data_quality_score > existing.data_quality_score:
                            for attr, value in asdict(venue).items():
                                if hasattr(existing, attr) and value is not None:
                                    setattr(existing, attr, value)
                            existing.last_updated = datetime.now()
                    else:
                        session.add(venue_model)
                        stored_count += 1
                    
                except Exception as e:
                    logger.error(f"Error storing venue {venue.name}: {e}")
                    continue
            
            session.commit()
            session.close()
            
            return stored_count
            
        except Exception as e:
            logger.error(f"Database storage failed: {e}")
            return 0

async def main():
    """Main execution function"""
    orchestrator = DataCollectionOrchestrator()
    results = await orchestrator.run_data_collection()
    
    print("\n" + "="*50)
    print("DATA COLLECTION RESULTS")
    print("="*50)
    print(f"Scrapers run: {results['scrapers_run']}")
    print(f"Venues collected: {results['venues_collected']}")
    print(f"Venues geocoded: {results['venues_geocoded']}")
    print(f"Venues stored: {results['venues_stored']}")
    print(f"Duration: {results['duration']:.2f} seconds")
    
    if results['errors']:
        print(f"\nErrors encountered: {len(results['errors'])}")
        for error in results['errors']:
            print(f"  - {error}")

if __name__ == "__main__":
    asyncio.run(main())