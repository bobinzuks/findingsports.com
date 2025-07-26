#!/usr/bin/env python3
"""
100% Automated Sports Venue Data Harvesting System
Custom tools for complete automation across all BC sports facilities
"""

import asyncio
import aiohttp
import json
import logging
import time
import random
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from typing import List, Dict, Optional, Any, Tuple, Set
from urllib.parse import urljoin, urlparse, parse_qs
import re
from pathlib import Path
import hashlib
import sqlite3
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed

# Advanced web automation
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

# AI-powered content analysis
import requests
from bs4 import BeautifulSoup, NavigableString
import cv2
import numpy as np
from PIL import Image
import pytesseract

# Natural language processing
import spacy
from transformers import pipeline, AutoTokenizer, AutoModelForTokenClassification

# Machine learning for pattern recognition
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import DBSCAN
from sklearn.metrics.pairwise import cosine_similarity

# Configuration
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class AutomatedVenueData:
    """Enhanced venue data with automation metadata"""
    name: str
    address: str
    city: str
    province: str = "BC"
    postal_code: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    sports: List[str] = None
    amenities: List[str] = None
    contact_phone: Optional[str] = None
    contact_email: Optional[str] = None
    website: Optional[str] = None
    social_media: Dict[str, str] = None
    operating_hours: Dict[str, str] = None
    schedule_data: Dict[str, Any] = None
    pricing_info: Dict[str, Any] = None
    accessibility_features: List[str] = None
    parking_available: bool = False
    public_transit_access: bool = False
    booking_system: Optional[str] = None
    capacity_info: Dict[str, int] = None
    
    # Automation metadata
    discovery_method: str = ""
    confidence_score: float = 0.0
    last_verified: datetime = None
    verification_attempts: int = 0
    data_sources: List[str] = None
    automated_flags: Dict[str, bool] = None
    image_urls: List[str] = None
    review_data: Dict[str, Any] = None
    competitor_analysis: Dict[str, Any] = None
    
    def __post_init__(self):
        # Initialize empty collections
        for field in ['sports', 'amenities', 'accessibility_features', 'data_sources', 'image_urls']:
            if getattr(self, field) is None:
                setattr(self, field, [])
        
        for field in ['social_media', 'operating_hours', 'schedule_data', 'pricing_info', 
                     'capacity_info', 'automated_flags', 'review_data', 'competitor_analysis']:
            if getattr(self, field) is None:
                setattr(self, field, {})
        
        if self.last_verified is None:
            self.last_verified = datetime.now()

class AIContentAnalyzer:
    """AI-powered content analysis for venue detection and classification"""
    
    def __init__(self):
        # Initialize NLP models
        self.setup_nlp_models()
        self.sports_classifier = self.setup_sports_classifier()
        self.venue_detector = self.setup_venue_detector()
        
    def setup_nlp_models(self):
        """Initialize NLP models for text analysis"""
        try:
            # Load spaCy model
            self.nlp = spacy.load("en_core_web_sm")
            
            # Load BERT model for venue classification
            self.venue_classifier = pipeline(
                "text-classification",
                model="distilbert-base-uncased-finetuned-sst-2-english"
            )
            
            # Load NER model for information extraction
            self.ner_model = pipeline(
                "ner",
                model="dbmdz/bert-large-cased-finetuned-conll03-english",
                aggregation_strategy="simple"
            )
        except Exception as e:
            logger.warning(f"Some NLP models failed to load: {e}")
            self.nlp = None
    
    def setup_sports_classifier(self):
        """Setup sports activity classifier"""
        sports_keywords = {
            'Basketball': ['basketball', 'hoops', 'bball', 'court', 'gymnasium'],
            'Soccer': ['soccer', 'football', 'pitch', 'field', 'futbol'],
            'Tennis': ['tennis', 'court', 'racquet', 'net'],
            'Swimming': ['swimming', 'pool', 'aquatic', 'dive', 'lanes'],
            'Hockey': ['hockey', 'ice', 'rink', 'arena', 'puck'],
            'Volleyball': ['volleyball', 'net', 'court', 'spike'],
            'Baseball': ['baseball', 'diamond', 'field', 'batting', 'softball'],
            'Track': ['track', 'field', 'running', 'athletics', 'oval'],
            'Gymnastics': ['gymnastics', 'gym', 'apparatus', 'floor', 'beam'],
            'Martial Arts': ['karate', 'judo', 'taekwondo', 'martial', 'dojo'],
            'Fitness': ['fitness', 'gym', 'weights', 'cardio', 'training'],
            'Dance': ['dance', 'studio', 'ballet', 'jazz', 'contemporary'],
            'Climbing': ['climbing', 'wall', 'boulder', 'rope'],
            'Badminton': ['badminton', 'shuttlecock', 'racquet'],
            'Squash': ['squash', 'racquetball', 'court'],
            'Table Tennis': ['ping pong', 'table tennis', 'paddle'],
            'Wrestling': ['wrestling', 'mat', 'grappling'],
            'Boxing': ['boxing', 'ring', 'gloves', 'punch'],
            'Cycling': ['cycling', 'bike', 'velodrome', 'spin'],
            'Rowing': ['rowing', 'crew', 'boat', 'shell'],
            'Lacrosse': ['lacrosse', 'stick', 'field'],
            'Rugby': ['rugby', 'scrum', 'field'],
            'Golf': ['golf', 'course', 'green', 'tee'],
            'Skiing': ['skiing', 'slope', 'mountain', 'snow'],
            'Skating': ['skating', 'rink', 'ice', 'roller'],
            'Curling': ['curling', 'stone', 'rink', 'sweep']
        }
        return sports_keywords
    
    def setup_venue_detector(self):
        """Setup venue type detection patterns"""
        venue_patterns = {
            'Community Centre': [
                r'community\s+cent(er|re)',
                r'recreation\s+cent(er|re)',
                r'civic\s+cent(er|re)',
                r'neighbourhood\s+cent(er|re)'
            ],
            'School': [
                r'elementary\s+school',
                r'high\s+school',
                r'secondary\s+school',
                r'university',
                r'college'
            ],
            'Private Club': [
                r'club',
                r'fitness\s+center',
                r'sports\s+club',
                r'athletic\s+club'
            ],
            'Arena': [
                r'arena',
                r'ice\s+rink',
                r'stadium',
                r'coliseum'
            ],
            'Park': [
                r'park',
                r'field',
                r'beach',
                r'outdoor'
            ],
            'Pool': [
                r'aquatic\s+cent(er|re)',
                r'pool',
                r'swimming'
            ]
        }
        return venue_patterns
    
    def analyze_venue_content(self, text: str, images: List[str] = None) -> Dict[str, Any]:
        """Analyze content for venue information"""
        analysis = {
            'venue_type': self.detect_venue_type(text),
            'sports_detected': self.detect_sports(text),
            'contact_info': self.extract_contact_info(text),
            'schedule_info': self.extract_schedule_info(text),
            'amenities': self.detect_amenities(text),
            'confidence_scores': {},
            'text_quality': self.assess_text_quality(text)
        }
        
        # Analyze images if provided
        if images:
            analysis['image_analysis'] = self.analyze_venue_images(images)
        
        return analysis
    
    def detect_venue_type(self, text: str) -> str:
        """Detect venue type from text content"""
        text_lower = text.lower()
        venue_scores = {}
        
        for venue_type, patterns in self.venue_detector.items():
            score = 0
            for pattern in patterns:
                matches = len(re.findall(pattern, text_lower))
                score += matches
            venue_scores[venue_type] = score
        
        if venue_scores:
            return max(venue_scores, key=venue_scores.get)
        return 'Unknown'
    
    def detect_sports(self, text: str) -> List[str]:
        """Detect sports activities from text"""
        text_lower = text.lower()
        detected_sports = []
        
        for sport, keywords in self.sports_classifier.items():
            sport_score = 0
            for keyword in keywords:
                if keyword in text_lower:
                    sport_score += text_lower.count(keyword)
            
            if sport_score > 0:
                detected_sports.append({
                    'sport': sport,
                    'confidence': min(sport_score / len(keywords), 1.0)
                })
        
        # Sort by confidence and return top sports
        detected_sports.sort(key=lambda x: x['confidence'], reverse=True)
        return [sport['sport'] for sport in detected_sports[:10]]
    
    def extract_contact_info(self, text: str) -> Dict[str, str]:
        """Extract contact information using NLP"""
        contact_info = {}
        
        # Phone number extraction
        phone_patterns = [
            r'\b(\d{3})[-.]?(\d{3})[-.]?(\d{4})\b',
            r'\b(\d{3})\s+(\d{3})\s+(\d{4})\b',
            r'\((\d{3})\)\s*(\d{3})[-.]?(\d{4})\b'
        ]
        
        for pattern in phone_patterns:
            match = re.search(pattern, text)
            if match:
                groups = match.groups()
                if len(groups) == 3:
                    contact_info['phone'] = f"{groups[0]}-{groups[1]}-{groups[2]}"
                break
        
        # Email extraction
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        email_match = re.search(email_pattern, text)
        if email_match:
            contact_info['email'] = email_match.group()
        
        # Address extraction using NER
        if self.ner_model:
            try:
                entities = self.ner_model(text)
                addresses = []
                for entity in entities:
                    if entity['entity_group'] in ['LOC', 'MISC'] and len(entity['word']) > 10:
                        addresses.append(entity['word'])
                
                if addresses:
                    contact_info['address'] = addresses[0]
            except Exception as e:
                logger.debug(f"NER extraction failed: {e}")
        
        return contact_info
    
    def extract_schedule_info(self, text: str) -> Dict[str, str]:
        """Extract operating hours and schedule information"""
        schedule_info = {}
        
        # Day patterns
        days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
        day_abbrevs = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
        
        # Time patterns
        time_patterns = [
            r'(\d{1,2}):(\d{2})\s*(am|pm)',
            r'(\d{1,2})\s*(am|pm)',
            r'(\d{1,2}):(\d{2})'
        ]
        
        text_lower = text.lower()
        
        # Find schedule blocks
        schedule_blocks = re.findall(
            r'((?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)[^.!?]*?(?:\d{1,2}:?\d{0,2}\s*(?:am|pm))[^.!?]*)',
            text_lower
        )
        
        for block in schedule_blocks:
            for i, day in enumerate(days):
                if day in block or day_abbrevs[i] in block:
                    # Extract times from this block
                    times = []
                    for pattern in time_patterns:
                        matches = re.findall(pattern, block)
                        times.extend(matches)
                    
                    if len(times) >= 2:
                        start_time = self.format_time(times[0])
                        end_time = self.format_time(times[1])
                        schedule_info[day] = f"{start_time} - {end_time}"
                    elif len(times) == 1:
                        schedule_info[day] = self.format_time(times[0])
        
        return schedule_info
    
    def format_time(self, time_tuple):
        """Format time tuple into readable time string"""
        if len(time_tuple) == 3:  # hour:minute am/pm
            return f"{time_tuple[0]}:{time_tuple[1]} {time_tuple[2]}"
        elif len(time_tuple) == 2:  # hour am/pm
            return f"{time_tuple[0]} {time_tuple[1]}"
        return str(time_tuple)
    
    def detect_amenities(self, text: str) -> List[str]:
        """Detect facility amenities"""
        amenity_keywords = {
            'Parking': ['parking', 'lot', 'garage', 'spaces'],
            'Changerooms': ['change room', 'locker', 'changing', 'dressing'],
            'Shower': ['shower', 'facilities'],
            'Equipment Rental': ['rental', 'equipment', 'gear'],
            'Pro Shop': ['pro shop', 'retail', 'store'],
            'Food Service': ['cafeteria', 'snack bar', 'restaurant', 'food'],
            'Accessibility': ['accessible', 'wheelchair', 'ramp', 'elevator'],
            'WiFi': ['wifi', 'internet', 'wireless'],
            'Childcare': ['childcare', 'daycare', 'nursery'],
            'Storage': ['storage', 'lockers', 'cubbies']
        }
        
        detected_amenities = []
        text_lower = text.lower()
        
        for amenity, keywords in amenity_keywords.items():
            for keyword in keywords:
                if keyword in text_lower:
                    detected_amenities.append(amenity)
                    break
        
        return detected_amenities
    
    def assess_text_quality(self, text: str) -> float:
        """Assess quality of text content"""
        if not text:
            return 0.0
        
        quality_score = 0.0
        
        # Length check
        if len(text) > 100:
            quality_score += 0.2
        if len(text) > 500:
            quality_score += 0.2
        
        # Contact info presence
        if re.search(r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b', text):
            quality_score += 0.2
        if re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text):
            quality_score += 0.2
        
        # Schedule info presence
        if any(day in text.lower() for day in ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']):
            quality_score += 0.2
        
        return min(quality_score, 1.0)
    
    def analyze_venue_images(self, image_urls: List[str]) -> Dict[str, Any]:
        """Analyze venue images for additional information"""
        image_analysis = {
            'facility_type_detected': [],
            'sports_equipment_visible': [],
            'text_extracted': [],
            'quality_indicators': []
        }
        
        for url in image_urls[:5]:  # Limit to 5 images
            try:
                analysis = self.analyze_single_image(url)
                image_analysis['facility_type_detected'].extend(analysis.get('facility_type', []))
                image_analysis['sports_equipment_visible'].extend(analysis.get('equipment', []))
                image_analysis['text_extracted'].extend(analysis.get('text', []))
                image_analysis['quality_indicators'].extend(analysis.get('quality', []))
            except Exception as e:
                logger.debug(f"Image analysis failed for {url}: {e}")
        
        return image_analysis
    
    def analyze_single_image(self, image_url: str) -> Dict[str, List[str]]:
        """Analyze a single image for venue information"""
        try:
            # Download image
            response = requests.get(image_url, timeout=10)
            if response.status_code != 200:
                return {}
            
            # Convert to PIL Image
            image = Image.open(io.BytesIO(response.content))
            
            # OCR text extraction
            extracted_text = pytesseract.image_to_string(image)
            
            # Basic image analysis
            analysis = {
                'text': [extracted_text] if extracted_text.strip() else [],
                'facility_type': self.detect_facility_from_image(extracted_text),
                'equipment': self.detect_equipment_from_image(extracted_text),
                'quality': ['high_resolution'] if image.size[0] > 800 else ['low_resolution']
            }
            
            return analysis
            
        except Exception as e:
            logger.debug(f"Single image analysis failed: {e}")
            return {}
    
    def detect_facility_from_image(self, text: str) -> List[str]:
        """Detect facility type from image text"""
        facility_indicators = {
            'gym': ['gym', 'fitness', 'weights'],
            'pool': ['pool', 'swimming', 'aquatic'],
            'court': ['court', 'basketball', 'tennis', 'volleyball'],
            'rink': ['rink', 'ice', 'hockey'],
            'field': ['field', 'soccer', 'football', 'baseball']
        }
        
        detected_facilities = []
        text_lower = text.lower()
        
        for facility, keywords in facility_indicators.items():
            if any(keyword in text_lower for keyword in keywords):
                detected_facilities.append(facility)
        
        return detected_facilities
    
    def detect_equipment_from_image(self, text: str) -> List[str]:
        """Detect sports equipment from image text"""
        equipment_keywords = [
            'basketball', 'hoop', 'net', 'ball', 'weights', 'treadmill',
            'pool', 'lane', 'diving', 'tennis', 'racquet', 'court',
            'hockey', 'puck', 'goal', 'skates'
        ]
        
        detected_equipment = []
        text_lower = text.lower()
        
        for equipment in equipment_keywords:
            if equipment in text_lower:
                detected_equipment.append(equipment)
        
        return detected_equipment

class SmartWebCrawler:
    """Intelligent web crawler that adapts to different website structures"""
    
    def __init__(self, max_workers: int = 10):
        self.max_workers = max_workers
        self.session = None
        self.driver_pool = []
        self.content_analyzer = AIContentAnalyzer()
        self.crawled_urls = set()
        self.robots_cache = {}
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30),
            headers={
                'User-Agent': 'Mozilla/5.0 (compatible; FindingSportsBot/1.0; +https://findingsports.com/bot)'
            }
        )
        self.setup_driver_pool()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
        self.cleanup_driver_pool()
    
    def setup_driver_pool(self):
        """Setup pool of Chrome drivers for JavaScript-heavy sites"""
        chrome_options = Options()
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--window-size=1920,1080')
        chrome_options.add_argument('--user-agent=Mozilla/5.0 (compatible; FindingSportsBot/1.0)')
        
        for _ in range(min(self.max_workers, 5)):
            try:
                service = Service(ChromeDriverManager().install())
                driver = webdriver.Chrome(service=service, options=chrome_options)
                self.driver_pool.append(driver)
            except Exception as e:
                logger.warning(f"Failed to create Chrome driver: {e}")
    
    def cleanup_driver_pool(self):
        """Clean up Chrome drivers"""
        for driver in self.driver_pool:
            try:
                driver.quit()
            except Exception:
                pass
        self.driver_pool.clear()
    
    def get_driver(self) -> Optional[webdriver.Chrome]:
        """Get available driver from pool"""
        if self.driver_pool:
            return self.driver_pool.pop()
        return None
    
    def return_driver(self, driver: webdriver.Chrome):
        """Return driver to pool"""
        self.driver_pool.append(driver)
    
    async def crawl_domain(self, base_url: str, max_pages: int = 100) -> List[AutomatedVenueData]:
        """Crawl entire domain for venue information"""
        logger.info(f"Starting domain crawl: {base_url}")
        
        # Check robots.txt
        if not await self.check_robots_permission(base_url):
            logger.warning(f"Robots.txt disallows crawling {base_url}")
            return []
        
        venues = []
        discovered_urls = await self.discover_venue_urls(base_url, max_pages)
        
        # Process URLs in batches
        batch_size = self.max_workers
        for i in range(0, len(discovered_urls), batch_size):
            batch = discovered_urls[i:i + batch_size]
            batch_venues = await self.process_url_batch(batch)
            venues.extend(batch_venues)
            
            # Rate limiting
            await asyncio.sleep(random.uniform(1, 3))
        
        logger.info(f"Crawled {len(discovered_urls)} URLs, found {len(venues)} venues")
        return venues
    
    async def check_robots_permission(self, base_url: str) -> bool:
        """Check robots.txt for crawling permission"""
        domain = urlparse(base_url).netloc
        
        if domain in self.robots_cache:
            return self.robots_cache[domain]
        
        try:
            robots_url = f"https://{domain}/robots.txt"
            async with self.session.get(robots_url) as response:
                if response.status == 200:
                    robots_content = await response.text()
                    
                    # Simple robots.txt parsing
                    user_agent_found = False
                    allowed = True
                    
                    for line in robots_content.split('\n'):
                        line = line.strip().lower()
                        
                        if line.startswith('user-agent:'):
                            agent = line.split(':', 1)[1].strip()
                            user_agent_found = (agent == '*' or 'findingsports' in agent)
                        
                        elif user_agent_found and line.startswith('disallow:'):
                            disallow = line.split(':', 1)[1].strip()
                            if disallow == '/' or disallow == '':
                                allowed = False
                    
                    self.robots_cache[domain] = allowed
                    return allowed
        except Exception as e:
            logger.debug(f"Robots.txt check failed for {domain}: {e}")
        
        # Default to allowed if can't check
        self.robots_cache[domain] = True
        return True
    
    async def discover_venue_urls(self, base_url: str, max_pages: int) -> List[str]:
        """Discover URLs that likely contain venue information"""
        discovered_urls = set()
        urls_to_process = [base_url]
        processed_urls = set()
        
        venue_url_patterns = [
            r'/recreation', r'/facilities', r'/sports', r'/gym', r'/arena',
            r'/community', r'/center', r'/centre', r'/pool', r'/court',
            r'/field', r'/programs', r'/activities', r'/drop-in'
        ]
        
        while urls_to_process and len(discovered_urls) < max_pages:
            current_url = urls_to_process.pop(0)
            
            if current_url in processed_urls:
                continue
            
            processed_urls.add(current_url)
            
            try:
                # Get page content
                async with self.session.get(current_url) as response:
                    if response.status != 200:
                        continue
                    
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    # Check if current page contains venue information
                    if self.contains_venue_info(html):
                        discovered_urls.add(current_url)
                    
                    # Find relevant links
                    for link in soup.find_all('a', href=True):
                        href = link['href']
                        full_url = urljoin(current_url, href)
                        
                        # Check if URL matches venue patterns
                        if any(re.search(pattern, full_url, re.IGNORECASE) for pattern in venue_url_patterns):
                            if full_url not in processed_urls and full_url not in urls_to_process:
                                urls_to_process.append(full_url)
                
            except Exception as e:
                logger.debug(f"Error processing {current_url}: {e}")
        
        return list(discovered_urls)
    
    def contains_venue_info(self, html: str) -> bool:
        """Check if HTML content contains venue information"""
        venue_indicators = [
            'community center', 'recreation center', 'sports facility',
            'gymnasium', 'swimming pool', 'ice rink', 'tennis court',
            'basketball court', 'soccer field', 'hockey arena',
            'fitness center', 'aquatic center', 'athletic facility'
        ]
        
        html_lower = html.lower()
        return any(indicator in html_lower for indicator in venue_indicators)
    
    async def process_url_batch(self, urls: List[str]) -> List[AutomatedVenueData]:
        """Process a batch of URLs for venue information"""
        tasks = [self.extract_venue_from_url(url) for url in urls]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        venues = []
        for result in results:
            if isinstance(result, AutomatedVenueData):
                venues.append(result)
            elif isinstance(result, Exception):
                logger.debug(f"URL processing failed: {result}")
        
        return venues
    
    async def extract_venue_from_url(self, url: str) -> Optional[AutomatedVenueData]:
        """Extract venue information from a single URL"""
        try:
            # First try with regular HTTP request
            async with self.session.get(url) as response:
                if response.status != 200:
                    return None
                
                html = await response.text()
                
                # Check if page requires JavaScript
                if self.requires_javascript(html):
                    return await self.extract_with_selenium(url)
                else:
                    return await self.extract_with_beautifulsoup(url, html)
                    
        except Exception as e:
            logger.debug(f"Failed to extract venue from {url}: {e}")
            return None
    
    def requires_javascript(self, html: str) -> bool:
        """Check if page requires JavaScript to load content"""
        js_indicators = [
            'document.write',
            'document.getElementById',
            'addEventListener',
            'react',
            'angular',
            'vue.js',
            'loading...',
            'please enable javascript'
        ]
        
        html_lower = html.lower()
        return any(indicator in html_lower for indicator in js_indicators)
    
    async def extract_with_beautifulsoup(self, url: str, html: str) -> Optional[AutomatedVenueData]:
        """Extract venue data using BeautifulSoup"""
        soup = BeautifulSoup(html, 'html.parser')
        
        # Basic information extraction
        venue_data = AutomatedVenueData(
            name=self.extract_venue_name(soup, url),
            address=self.extract_address(soup),
            city=self.extract_city(soup, url),
            discovery_method="beautifulsoup",
            data_sources=[url]
        )
        
        # Content analysis
        page_text = soup.get_text()
        content_analysis = self.content_analyzer.analyze_venue_content(page_text)
        
        # Apply analysis results
        venue_data.sports = content_analysis['sports_detected']
        venue_data.amenities = content_analysis['amenities']
        venue_data.operating_hours = content_analysis['schedule_info']
        venue_data.confidence_score = content_analysis['text_quality']
        
        # Extract contact information
        contact_info = content_analysis['contact_info']
        venue_data.contact_phone = contact_info.get('phone')
        venue_data.contact_email = contact_info.get('email')
        
        # Additional structured data extraction
        venue_data.website = url
        venue_data.image_urls = self.extract_image_urls(soup, url)
        
        return venue_data if venue_data.name else None
    
    async def extract_with_selenium(self, url: str) -> Optional[AutomatedVenueData]:
        """Extract venue data using Selenium for JavaScript-heavy pages"""
        driver = self.get_driver()
        if not driver:
            return None
        
        try:
            driver.get(url)
            
            # Wait for content to load
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            
            # Additional wait for dynamic content
            await asyncio.sleep(3)
            
            # Get page source after JavaScript execution
            html = driver.page_source
            soup = BeautifulSoup(html, 'html.parser')
            
            # Extract venue information
            venue_data = AutomatedVenueData(
                name=self.extract_venue_name(soup, url),
                address=self.extract_address(soup),
                city=self.extract_city(soup, url),
                discovery_method="selenium",
                data_sources=[url]
            )
            
            # Content analysis
            page_text = soup.get_text()
            content_analysis = self.content_analyzer.analyze_venue_content(page_text)
            
            # Apply analysis results
            venue_data.sports = content_analysis['sports_detected']
            venue_data.amenities = content_analysis['amenities']
            venue_data.operating_hours = content_analysis['schedule_info']
            venue_data.confidence_score = content_analysis['text_quality']
            
            # Extract contact information
            contact_info = content_analysis['contact_info']
            venue_data.contact_phone = contact_info.get('phone')
            venue_data.contact_email = contact_info.get('email')
            
            venue_data.website = url
            venue_data.image_urls = self.extract_image_urls(soup, url)
            
            return venue_data if venue_data.name else None
            
        except Exception as e:
            logger.debug(f"Selenium extraction failed for {url}: {e}")
            return None
        finally:
            self.return_driver(driver)
    
    def extract_venue_name(self, soup: BeautifulSoup, url: str) -> str:
        """Extract venue name from page"""
        # Try various selectors for venue name
        name_selectors = [
            'h1',
            '.facility-name',
            '.venue-name',
            '.center-name',
            '.title',
            'title'
        ]
        
        for selector in name_selectors:
            element = soup.select_one(selector)
            if element and element.get_text().strip():
                name = element.get_text().strip()
                # Clean up title
                if selector == 'title':
                    name = re.sub(r'\s*[-|]\s*.*$', '', name)  # Remove site name
                return name
        
        # Fallback to URL-based name
        domain = urlparse(url).netloc
        return domain.replace('www.', '').replace('.com', '').replace('.ca', '').title()
    
    def extract_address(self, soup: BeautifulSoup) -> str:
        """Extract address from page"""
        address_selectors = [
            '.address',
            '.location',
            '[class*="address"]',
            '[class*="location"]',
            'address'
        ]
        
        for selector in address_selectors:
            element = soup.select_one(selector)
            if element and element.get_text().strip():
                return element.get_text().strip()
        
        # Search for address patterns in text
        page_text = soup.get_text()
        address_patterns = [
            r'\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Boulevard|Blvd|Way|Place|Pl)',
            r'\d+\s+[A-Za-z\s]+,\s*[A-Za-z\s]+,\s*BC'
        ]
        
        for pattern in address_patterns:
            match = re.search(pattern, page_text)
            if match:
                return match.group().strip()
        
        return ""
    
    def extract_city(self, soup: BeautifulSoup, url: str) -> str:
        """Extract city from page or URL"""
        # Try to find city in content
        page_text = soup.get_text()
        
        # BC cities
        bc_cities = [
            'Vancouver', 'Victoria', 'Surrey', 'Burnaby', 'Richmond', 'Coquitlam',
            'Langley', 'Delta', 'North Vancouver', 'West Vancouver', 'Port Moody',
            'New Westminster', 'Maple Ridge', 'White Rock', 'Chilliwack',
            'Abbotsford', 'Nanaimo', 'Kelowna', 'Kamloops', 'Prince George'
        ]
        
        for city in bc_cities:
            if city.lower() in page_text.lower():
                return city
        
        # Check URL for city indicators
        url_lower = url.lower()
        for city in bc_cities:
            if city.lower() in url_lower:
                return city
        
        return "Unknown"
    
    def extract_image_urls(self, soup: BeautifulSoup, base_url: str) -> List[str]:
        """Extract image URLs from page"""
        image_urls = []
        
        for img in soup.find_all('img'):
            src = img.get('src') or img.get('data-src')
            if src:
                full_url = urljoin(base_url, src)
                if self.is_venue_image(img, src):
                    image_urls.append(full_url)
        
        return image_urls[:10]  # Limit to 10 images
    
    def is_venue_image(self, img_element, src: str) -> bool:
        """Check if image is likely a venue photo"""
        # Check image attributes
        alt_text = img_element.get('alt', '').lower()
        class_name = ' '.join(img_element.get('class', [])).lower()
        
        venue_indicators = [
            'facility', 'gym', 'pool', 'court', 'field', 'arena',
            'center', 'centre', 'sport', 'recreation'
        ]
        
        # Check if alt text or class indicates venue photo
        if any(indicator in alt_text or indicator in class_name for indicator in venue_indicators):
            return True
        
        # Check image filename
        filename = src.lower()
        return any(indicator in filename for indicator in venue_indicators)

class AutomatedDataHarvester:
    """Main orchestrator for 100% automated data harvesting"""
    
    def __init__(self, config_file: str = "harvester_config.json"):
        self.config = self.load_config(config_file)
        self.crawler = None
        self.venues_database = []
        self.processed_domains = set()
        
    def load_config(self, config_file: str) -> Dict:
        """Load harvester configuration"""
        default_config = {
            "target_domains": [
                "vancouver.ca",
                "burnaby.ca", 
                "richmond.ca",
                "surrey.ca",
                "ubc.ca",
                "sfu.ca",
                "kerrisdalecc.com",
                "richmondoval.ca",
                "vancouverracquetsclub.com",
                "gv.ymca.ca",
                "stevenashfitness.ca"
            ],
            "max_pages_per_domain": 50,
            "max_concurrent_crawlers": 5,
            "delay_between_requests": 1.0,
            "output_database": "harvested_venues.db",
            "enable_image_analysis": True,
            "enable_social_media_scraping": True,
            "quality_threshold": 0.5
        }
        
        try:
            with open(config_file, 'r') as f:
                user_config = json.load(f)
                default_config.update(user_config)
        except FileNotFoundError:
            logger.info(f"Config file {config_file} not found, using defaults")
        
        return default_config
    
    async def run_full_harvest(self) -> Dict[str, Any]:
        """Run complete automated harvesting process"""
        start_time = datetime.now()
        logger.info("🚀 Starting 100% automated venue harvesting")
        
        results = {
            'start_time': start_time,
            'domains_processed': 0,
            'venues_discovered': 0,
            'high_quality_venues': 0,
            'errors': [],
            'processing_stats': {}
        }
        
        async with SmartWebCrawler(max_workers=self.config['max_concurrent_crawlers']) as crawler:
            self.crawler = crawler
            
            # Process each target domain
            for domain in self.config['target_domains']:
                try:
                    logger.info(f"🔍 Processing domain: {domain}")
                    
                    domain_start = datetime.now()
                    venues = await crawler.crawl_domain(
                        f"https://{domain}",
                        self.config['max_pages_per_domain']
                    )
                    
                    # Filter by quality threshold
                    high_quality_venues = [
                        v for v in venues 
                        if v.confidence_score >= self.config['quality_threshold']
                    ]
                    
                    self.venues_database.extend(high_quality_venues)
                    
                    # Update results
                    results['domains_processed'] += 1
                    results['venues_discovered'] += len(venues)
                    results['high_quality_venues'] += len(high_quality_venues)
                    
                    # Store processing stats
                    domain_time = (datetime.now() - domain_start).total_seconds()
                    results['processing_stats'][domain] = {
                        'venues_found': len(venues),
                        'high_quality': len(high_quality_venues),
                        'processing_time': domain_time
                    }
                    
                    logger.info(f"✅ {domain}: {len(high_quality_venues)} quality venues in {domain_time:.1f}s")
                    
                    # Rate limiting between domains
                    await asyncio.sleep(self.config['delay_between_requests'])
                    
                except Exception as e:
                    error_msg = f"Domain {domain} failed: {str(e)}"
                    results['errors'].append(error_msg)
                    logger.error(error_msg)
        
        # Post-processing
        await self.post_process_venues()
        await self.save_to_database()
        
        results['end_time'] = datetime.now()
        results['total_duration'] = (results['end_time'] - results['start_time']).total_seconds()
        
        logger.info(f"🎉 Harvest completed: {results['high_quality_venues']} venues in {results['total_duration']:.1f}s")
        
        return results
    
    async def post_process_venues(self):
        """Post-process discovered venues for deduplication and enhancement"""
        logger.info("🔧 Post-processing venues...")
        
        # Deduplicate venues
        unique_venues = self.deduplicate_venues(self.venues_database)
        self.venues_database = unique_venues
        
        # Geocode addresses
        await self.geocode_venues()
        
        # Enhance with social media data
        if self.config['enable_social_media_scraping']:
            await self.enhance_with_social_media()
        
        logger.info(f"✅ Post-processing complete: {len(self.venues_database)} unique venues")
    
    def deduplicate_venues(self, venues: List[AutomatedVenueData]) -> List[AutomatedVenueData]:
        """Remove duplicate venues using advanced similarity matching"""
        if not venues:
            return []
        
        # Create feature vectors for similarity comparison
        venue_texts = []
        for venue in venues:
            text = f"{venue.name} {venue.address} {venue.city}"
            venue_texts.append(text)
        
        # Use TF-IDF vectorization
        vectorizer = TfidfVectorizer(stop_words='english', ngram_range=(1, 2))
        try:
            vectors = vectorizer.fit_transform(venue_texts)
            
            # Calculate similarity matrix
            similarity_matrix = cosine_similarity(vectors)
            
            # Use clustering to find duplicates
            clustering = DBSCAN(metric='precomputed', eps=0.3, min_samples=1)
            distance_matrix = 1 - similarity_matrix
            clusters = clustering.fit_predict(distance_matrix)
            
            # Keep best venue from each cluster
            unique_venues = []
            cluster_groups = {}
            
            for i, cluster_id in enumerate(clusters):
                if cluster_id not in cluster_groups:
                    cluster_groups[cluster_id] = []
                cluster_groups[cluster_id].append(i)
            
            for cluster_venues in cluster_groups.values():
                # Select venue with highest confidence score
                best_venue_idx = max(cluster_venues, key=lambda i: venues[i].confidence_score)
                unique_venues.append(venues[best_venue_idx])
            
            logger.info(f"Deduplicated {len(venues)} → {len(unique_venues)} venues")
            return unique_venues
            
        except Exception as e:
            logger.warning(f"Deduplication failed, returning original list: {e}")
            return venues
    
    async def geocode_venues(self):
        """Geocode venue addresses"""
        geocoding_service = GeoCodingService("your_google_api_key")  # Add API key
        
        for venue in self.venues_database:
            if not venue.latitude or not venue.longitude:
                try:
                    lat, lng = await geocoding_service.geocode_address(venue.address, venue.city)
                    if lat and lng:
                        venue.latitude = lat
                        venue.longitude = lng
                except Exception as e:
                    logger.debug(f"Geocoding failed for {venue.name}: {e}")
    
    async def enhance_with_social_media(self):
        """Enhance venues with social media data"""
        # This would integrate with Facebook, Instagram, etc. APIs
        # For now, placeholder implementation
        logger.info("📱 Social media enhancement would be implemented here")
    
    async def save_to_database(self):
        """Save harvested venues to database"""
        db_path = self.config['output_database']
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Create table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS venues (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                address TEXT,
                city TEXT,
                latitude REAL,
                longitude REAL,
                sports TEXT,
                amenities TEXT,
                contact_phone TEXT,
                contact_email TEXT,
                website TEXT,
                operating_hours TEXT,
                confidence_score REAL,
                discovery_method TEXT,
                data_sources TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Insert venues
        for venue in self.venues_database:
            cursor.execute('''
                INSERT INTO venues (
                    name, address, city, latitude, longitude,
                    sports, amenities, contact_phone, contact_email,
                    website, operating_hours, confidence_score,
                    discovery_method, data_sources
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                venue.name,
                venue.address,
                venue.city,
                venue.latitude,
                venue.longitude,
                json.dumps(venue.sports),
                json.dumps(venue.amenities),
                venue.contact_phone,
                venue.contact_email,
                venue.website,
                json.dumps(venue.operating_hours),
                venue.confidence_score,
                venue.discovery_method,
                json.dumps(venue.data_sources)
            ))
        
        conn.commit()
        conn.close()
        
        logger.info(f"💾 Saved {len(self.venues_database)} venues to {db_path}")

class GeoCodingService:
    """Simple geocoding service"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
    
    async def geocode_address(self, address: str, city: str) -> Tuple[Optional[float], Optional[float]]:
        """Geocode address to coordinates"""
        # Placeholder implementation
        # In real implementation, use Google Geocoding API
        return None, None

async def main():
    """Main execution function"""
    harvester = AutomatedDataHarvester()
    
    try:
        results = await harvester.run_full_harvest()
        
        print("\n" + "="*60)
        print("🎯 AUTOMATED VENUE HARVESTING RESULTS")
        print("="*60)
        print(f"📊 Domains Processed: {results['domains_processed']}")
        print(f"🏢 Total Venues Found: {results['venues_discovered']}")
        print(f"⭐ High Quality Venues: {results['high_quality_venues']}")
        print(f"⏱️  Total Duration: {results['total_duration']:.1f} seconds")
        
        if results['errors']:
            print(f"\n❌ Errors: {len(results['errors'])}")
            for error in results['errors'][:5]:  # Show first 5 errors
                print(f"   • {error}")
        
        print("\n📈 Per-Domain Statistics:")
        for domain, stats in results['processing_stats'].items():
            print(f"   {domain}: {stats['high_quality']} venues ({stats['processing_time']:.1f}s)")
        
        print(f"\n💾 Data saved to: {harvester.config['output_database']}")
        
    except KeyboardInterrupt:
        print("\n⏹️  Harvesting interrupted by user")
    except Exception as e:
        print(f"\n💥 Harvesting failed: {e}")
        logger.exception("Harvesting failed")

if __name__ == "__main__":
    asyncio.run(main())