#!/usr/bin/env python3
"""
Railway-Optimized Sports Venue Harvester
Lightweight version designed for small Railway servers
Memory-efficient, minimal dependencies, optimized for Railway deployment
"""

import asyncio
import aiohttp
import json
import sqlite3
import re
import os
import time
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
from dataclasses import dataclass, asdict
import logging
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup

# Railway-specific logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

@dataclass
class RailwayVenue:
    """Lightweight venue data structure for Railway"""
    name: str
    address: str
    city: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    sports: List[str] = None
    phone: Optional[str] = None
    website: Optional[str] = None
    source: str = ""
    confidence: float = 0.0
    last_updated: str = ""
    
    def __post_init__(self):
        if self.sports is None:
            self.sports = []
        if self.last_updated == "":
            self.last_updated = datetime.now().isoformat()

class RailwayHarvester:
    """Railway-optimized venue harvester"""
    
    def __init__(self):
        self.session = None
        self.db_path = "/tmp/venues.db"  # Railway temp storage
        self.max_concurrent = 3  # Low for small Railway instance
        self.request_delay = 1.0  # Conservative rate limiting
        
        # High-value targets for Railway deployment
        self.priority_targets = [
            {
                'domain': 'vancouver.ca',
                'type': 'municipal',
                'start_url': 'https://vancouver.ca/parks-recreation-culture/recreation-facilities.aspx',
                'selectors': {
                    'containers': '.facility-item, .rec-facility',
                    'name': 'h2, h3, .facility-name',
                    'address': '.address, .location',
                    'phone': '.phone, .contact'
                }
            },
            {
                'domain': 'burnaby.ca',
                'type': 'municipal',
                'start_url': 'https://www.burnaby.ca/recreation-and-arts/recreation-centres',
                'selectors': {
                    'containers': '.facility-card, .rec-center',
                    'name': 'h2, h3, .center-name',
                    'address': '.address, .location-info',
                    'phone': '.phone-number, .contact'
                }
            },
            {
                'domain': 'richmond.ca',
                'type': 'municipal',
                'start_url': 'https://www.richmond.ca/recreation/recreation-centres',
                'selectors': {
                    'containers': '.facility-listing, .rec-facility',
                    'name': 'h2, h3, .facility-title',
                    'address': '.facility-address, .location',
                    'phone': '.contact-info .phone'
                }
            },
            {
                'domain': 'recreation.ubc.ca',
                'type': 'university',
                'start_url': 'https://recreation.ubc.ca/facilities/',
                'selectors': {
                    'containers': '.facility-card, .rec-facility',
                    'name': 'h2, h3, .facility-title',
                    'address': '.location, .building',
                    'phone': '.contact'
                }
            }
        ]
        
        # Sports detection keywords
        self.sports_keywords = [
            'basketball', 'hockey', 'swimming', 'tennis', 'soccer', 'volleyball',
            'badminton', 'gymnasium', 'pool', 'arena', 'court', 'field', 'rink',
            'fitness', 'gym', 'aquatic', 'martial arts', 'dance', 'yoga'
        ]
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=15),  # Shorter timeout for Railway
            headers={'User-Agent': 'FindingSports/1.0 Railway Bot'}
        )
        self.setup_database()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def setup_database(self):
        """Setup SQLite database for Railway"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS venues (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                address TEXT,
                city TEXT,
                latitude REAL,
                longitude REAL,
                sports TEXT,
                phone TEXT,
                website TEXT,
                source TEXT,
                confidence REAL,
                last_updated TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create index for better performance
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_city ON venues(city)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_source ON venues(source)')
        
        conn.commit()
        conn.close()
    
    async def harvest_venues(self) -> Dict[str, Any]:
        """Main harvesting function optimized for Railway"""
        start_time = datetime.now()
        results = {
            'start_time': start_time.isoformat(),
            'venues_processed': 0,
            'venues_stored': 0,
            'sources_processed': 0,
            'errors': []
        }
        
        logger.info("🚀 Starting Railway-optimized venue harvesting")
        
        # Process priority targets with concurrency control
        semaphore = asyncio.Semaphore(self.max_concurrent)
        
        async def process_target(target):
            async with semaphore:
                try:
                    venues = await self.extract_from_target(target)
                    stored = await self.store_venues(venues)
                    return len(venues), stored
                except Exception as e:
                    error_msg = f"Target {target['domain']} failed: {str(e)}"
                    results['errors'].append(error_msg)
                    logger.error(error_msg)
                    return 0, 0
        
        # Execute all targets concurrently
        tasks = [process_target(target) for target in self.priority_targets]
        target_results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Process results
        for result in target_results:
            if isinstance(result, Exception):
                results['errors'].append(str(result))
                continue
            
            processed, stored = result
            results['venues_processed'] += processed
            results['venues_stored'] += stored
            results['sources_processed'] += 1
        
        # Final statistics
        end_time = datetime.now()
        results['end_time'] = end_time.isoformat()
        results['duration_seconds'] = (end_time - start_time).total_seconds()
        
        logger.info(f"✅ Harvesting completed: {results['venues_stored']} venues stored in {results['duration_seconds']:.1f}s")
        
        return results
    
    async def extract_from_target(self, target: Dict) -> List[RailwayVenue]:
        """Extract venues from a target website"""
        venues = []
        
        try:
            # Fetch the main page
            async with self.session.get(target['start_url']) as response:
                if response.status != 200:
                    logger.warning(f"Failed to fetch {target['start_url']}: {response.status}")
                    return venues
                
                html = await response.text()
                soup = BeautifulSoup(html, 'html.parser')
                
                # Extract venues using target-specific selectors
                containers = soup.select(target['selectors']['containers'])
                
                for container in containers:
                    venue = self.extract_venue_from_container(container, target)
                    if venue and venue.name:
                        venues.append(venue)
                
                logger.info(f"Extracted {len(venues)} venues from {target['domain']}")
                
        except Exception as e:
            logger.error(f"Error extracting from {target['domain']}: {e}")
        
        # Rate limiting for Railway server
        await asyncio.sleep(self.request_delay)
        
        return venues
    
    def extract_venue_from_container(self, container, target: Dict) -> Optional[RailwayVenue]:
        """Extract venue data from HTML container"""
        try:
            selectors = target['selectors']
            
            # Extract name
            name_elem = container.select_one(selectors['name'])
            if not name_elem:
                return None
            
            name = self.clean_text(name_elem.get_text())
            if not name:
                return None
            
            # Extract address
            address = ""
            address_elem = container.select_one(selectors['address'])
            if address_elem:
                address = self.clean_text(address_elem.get_text())
            
            # Extract phone
            phone = ""
            phone_elem = container.select_one(selectors['phone'])
            if phone_elem:
                phone = self.extract_phone(phone_elem.get_text())
            
            # Detect sports from all text content
            container_text = container.get_text().lower()
            sports = []
            for sport in self.sports_keywords:
                if sport in container_text:
                    sports.append(sport.title())
            
            # Determine city from target domain
            city = self.get_city_from_domain(target['domain'])
            
            # Calculate confidence score
            confidence = self.calculate_confidence(name, address, phone, sports)
            
            venue = RailwayVenue(
                name=name,
                address=address,
                city=city,
                sports=sports,
                phone=phone,
                website=target['start_url'],
                source=target['domain'],
                confidence=confidence
            )
            
            return venue
            
        except Exception as e:
            logger.debug(f"Error extracting venue from container: {e}")
            return None
    
    def clean_text(self, text: str) -> str:
        """Clean and normalize text"""
        if not text:
            return ""
        return re.sub(r'\s+', ' ', text.strip())
    
    def extract_phone(self, text: str) -> str:
        """Extract phone number from text"""
        if not text:
            return ""
        
        phone_match = re.search(r'\b(\d{3})[-.\s]?(\d{3})[-.\s]?(\d{4})\b', text)
        if phone_match:
            return f"{phone_match.group(1)}-{phone_match.group(2)}-{phone_match.group(3)}"
        
        return ""
    
    def get_city_from_domain(self, domain: str) -> str:
        """Get city name from domain"""
        city_mapping = {
            'vancouver.ca': 'Vancouver',
            'burnaby.ca': 'Burnaby',
            'richmond.ca': 'Richmond',
            'surrey.ca': 'Surrey',
            'recreation.ubc.ca': 'Vancouver',
            'sfu.ca': 'Burnaby'
        }
        return city_mapping.get(domain, 'Unknown')
    
    def calculate_confidence(self, name: str, address: str, phone: str, sports: List[str]) -> float:
        """Calculate confidence score for venue data"""
        score = 0.0
        
        if name and len(name) > 3:
            score += 0.4
        if address and len(address) > 10:
            score += 0.3
        if phone:
            score += 0.2
        if sports:
            score += 0.1
        
        return round(score, 2)
    
    async def store_venues(self, venues: List[RailwayVenue]) -> int:
        """Store venues in SQLite database"""
        if not venues:
            return 0
        
        stored_count = 0
        
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            for venue in venues:
                # Check if venue already exists
                cursor.execute(
                    'SELECT id FROM venues WHERE name = ? AND city = ?',
                    (venue.name, venue.city)
                )
                
                if cursor.fetchone():
                    continue  # Skip duplicates
                
                # Insert new venue
                cursor.execute('''
                    INSERT INTO venues (
                        name, address, city, latitude, longitude,
                        sports, phone, website, source, confidence, last_updated
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    venue.name,
                    venue.address,
                    venue.city,
                    venue.latitude,
                    venue.longitude,
                    json.dumps(venue.sports),
                    venue.phone,
                    venue.website,
                    venue.source,
                    venue.confidence,
                    venue.last_updated
                ))
                
                stored_count += 1
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            logger.error(f"Database storage error: {e}")
        
        return stored_count
    
    def get_venues_json(self) -> List[Dict]:
        """Get all venues as JSON for API response"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                SELECT name, address, city, latitude, longitude, sports, 
                       phone, website, source, confidence, last_updated
                FROM venues ORDER BY confidence DESC, name
            ''')
            
            venues = []
            for row in cursor.fetchall():
                venue = {
                    'name': row[0],
                    'address': row[1],
                    'city': row[2],
                    'latitude': row[3],
                    'longitude': row[4],
                    'sports': json.loads(row[5]) if row[5] else [],
                    'phone': row[6],
                    'website': row[7],
                    'source': row[8],
                    'confidence': row[9],
                    'last_updated': row[10]
                }
                venues.append(venue)
            
            conn.close()
            return venues
            
        except Exception as e:
            logger.error(f"Error retrieving venues: {e}")
            return []

# Railway integration functions
async def railway_harvest():
    """Railway-compatible harvest function"""
    async with RailwayHarvester() as harvester:
        return await harvester.harvest_venues()

def get_venues_api():
    """API endpoint for getting venues"""
    harvester = RailwayHarvester()
    return harvester.get_venues_json()

# Railway deployment script
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "harvest":
        # Run harvest
        result = asyncio.run(railway_harvest())
        print(json.dumps(result, indent=2))
    
    elif len(sys.argv) > 1 and sys.argv[1] == "api":
        # Return venues as JSON
        venues = get_venues_api()
        print(json.dumps(venues, indent=2))
    
    else:
        # Default: run harvest
        result = asyncio.run(railway_harvest())
        print(f"✅ Harvested {result['venues_stored']} venues")
        print(f"⏱️  Duration: {result['duration_seconds']:.1f} seconds")
        if result['errors']:
            print(f"❌ Errors: {len(result['errors'])}")