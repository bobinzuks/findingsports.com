#!/usr/bin/env python3
"""
Municipal Government Site Extractor
100% Automated extraction from BC municipal recreation websites
Research-based implementation for vancouver.ca, burnaby.ca, richmond.ca, etc.
"""

import asyncio
import aiohttp
import json
import re
from datetime import datetime
from typing import List, Dict, Optional, Any
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import PyPDF2
import io
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MunicipalSiteExtractor:
    """Specialized extractor for municipal recreation websites"""
    
    def __init__(self):
        self.session = None
        # Municipal site patterns based on research
        self.municipal_patterns = {
            'vancouver.ca': {
                'facility_list_url': '/parks-recreation-culture/recreation-facilities',
                'facility_selectors': {
                    'container': '.facility-item, .rec-facility, .program-item',
                    'name': 'h2, h3, .facility-name, .program-name',
                    'address': '.address, .location, .facility-address',
                    'phone': '.phone, .contact-phone, .telephone',
                    'hours': '.hours, .operating-hours, .schedule'
                },
                'sports_indicators': ['gymnasium', 'pool', 'arena', 'court', 'field'],
                'pdf_schedule_pattern': r'schedule.*\.pdf'
            },
            'burnaby.ca': {
                'facility_list_url': '/recreation-and-arts/recreation-centres',
                'facility_selectors': {
                    'container': '.facility-card, .rec-center-item',
                    'name': 'h2, h3, .center-name',
                    'address': '.address, .location-info',
                    'phone': '.phone-number, .contact',
                    'hours': '.hours-operation, .schedule-info'
                },
                'sports_indicators': ['recreation', 'fitness', 'sports', 'aquatic'],
                'pdf_schedule_pattern': r'(schedule|hours|programs).*\.pdf'
            },
            'richmond.ca': {
                'facility_list_url': '/recreation/recreation-centres',
                'facility_selectors': {
                    'container': '.facility-listing, .rec-facility',
                    'name': 'h2, h3, .facility-title',
                    'address': '.facility-address, .location',
                    'phone': '.contact-info .phone',
                    'hours': '.operating-hours, .facility-hours'
                },
                'sports_indicators': ['recreation', 'centre', 'facility', 'complex'],
                'pdf_schedule_pattern': r'schedule.*\.pdf'
            },
            'surrey.ca': {
                'facility_list_url': '/recreation-culture/recreation-centres-arenas',
                'facility_selectors': {
                    'container': '.facility-item, .recreation-facility',
                    'name': 'h2, h3, .facility-name',
                    'address': '.address, .facility-location',
                    'phone': '.phone, .contact-number',
                    'hours': '.hours, .schedule-info'
                },
                'sports_indicators': ['recreation', 'arena', 'pool', 'gymnasium'],
                'pdf_schedule_pattern': r'(schedule|program).*\.pdf'
            }
        }
        
        # Generic patterns for unknown municipal sites
        self.generic_patterns = {
            'facility_urls': [
                '/recreation', '/facilities', '/community-centres', '/parks-recreation',
                '/sports', '/programs', '/activities', '/arenas', '/pools'
            ],
            'facility_selectors': {
                'container': '.facility, .center, .recreation, .program, .venue, article, .card',
                'name': 'h1, h2, h3, h4, .title, .name, .facility-name, .center-name',
                'address': '.address, .location, .contact-info, .venue-address',
                'phone': '.phone, .telephone, .contact-phone, .tel',
                'hours': '.hours, .schedule, .operating-hours, .open-hours'
            },
            'sports_keywords': [
                'basketball', 'hockey', 'swimming', 'tennis', 'soccer', 'volleyball',
                'badminton', 'gymnasium', 'arena', 'pool', 'court', 'field', 'rink'
            ]
        }
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession(
            timeout=aiohttp.ClientTimeout(total=30),
            headers={'User-Agent': 'FindingSportsBot/1.0 (Educational Research)'}
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def extract_all_municipal_sites(self) -> List[Dict[str, Any]]:
        """Extract from all known municipal sites"""
        all_facilities = []
        
        for domain, config in self.municipal_patterns.items():
            try:
                logger.info(f"Extracting from {domain}")
                facilities = await self.extract_municipal_domain(domain, config)
                all_facilities.extend(facilities)
                logger.info(f"Found {len(facilities)} facilities from {domain}")
            except Exception as e:
                logger.error(f"Failed to extract from {domain}: {e}")
        
        return all_facilities
    
    async def extract_municipal_domain(self, domain: str, config: Dict) -> List[Dict[str, Any]]:
        """Extract facilities from a specific municipal domain"""
        base_url = f"https://{domain}"
        facility_urls = await self.discover_facility_pages(base_url, config)
        
        facilities = []
        for url in facility_urls:
            try:
                page_facilities = await self.extract_facilities_from_page(url, config)
                facilities.extend(page_facilities)
            except Exception as e:
                logger.debug(f"Failed to extract from {url}: {e}")
        
        return facilities
    
    async def discover_facility_pages(self, base_url: str, config: Dict) -> List[str]:
        """Discover all pages containing facility information"""
        discovered_pages = set()
        
        # Start with known facility list URL
        main_facility_url = base_url + config['facility_list_url']
        discovered_pages.add(main_facility_url)
        
        # Crawl main facility page for additional links
        try:
            async with self.session.get(main_facility_url) as response:
                if response.status == 200:
                    html = await response.text()
                    soup = BeautifulSoup(html, 'html.parser')
                    
                    # Find links to individual facility pages
                    for link in soup.find_all('a', href=True):
                        href = link['href']
                        if self.is_facility_link(href, config):
                            full_url = urljoin(main_facility_url, href)
                            discovered_pages.add(full_url)
        
        except Exception as e:
            logger.debug(f"Failed to discover pages from {main_facility_url}: {e}")
        
        return list(discovered_pages)
    
    def is_facility_link(self, href: str, config: Dict) -> bool:
        """Check if link points to a facility page"""
        facility_keywords = [
            'community-center', 'recreation-center', 'facility', 'arena',
            'pool', 'gymnasium', 'sports-center', 'aquatic'
        ]
        
        href_lower = href.lower()
        return any(keyword in href_lower for keyword in facility_keywords)
    
    async def extract_facilities_from_page(self, url: str, config: Dict) -> List[Dict[str, Any]]:
        """Extract facility data from a single page"""
        facilities = []
        
        try:
            async with self.session.get(url) as response:
                if response.status != 200:
                    return facilities
                
                html = await response.text()
                soup = BeautifulSoup(html, 'html.parser')
                
                # Use configured selectors to find facility containers
                selectors = config['facility_selectors']
                containers = soup.select(selectors['container'])
                
                for container in containers:
                    facility = await self.extract_facility_from_container(container, selectors, config, url)
                    if facility and facility.get('name'):
                        facilities.append(facility)
                
                # Also check for PDF schedules
                pdf_links = await self.find_pdf_schedules(soup, url, config)
                for facility in facilities:
                    facility['pdf_schedules'] = pdf_links
        
        except Exception as e:
            logger.debug(f"Error extracting from {url}: {e}")
        
        return facilities
    
    async def extract_facility_from_container(self, container, selectors: Dict, config: Dict, page_url: str) -> Dict[str, Any]:
        """Extract facility data from a container element"""
        facility = {
            'source_url': page_url,
            'extraction_method': 'municipal_specialized',
            'extracted_at': datetime.now().isoformat()
        }
        
        # Extract name
        name_elem = container.select_one(selectors['name'])
        if name_elem:
            facility['name'] = self.clean_text(name_elem.get_text())
        
        # Extract address
        address_elem = container.select_one(selectors['address'])
        if address_elem:
            facility['address'] = self.clean_text(address_elem.get_text())
        
        # Extract phone
        phone_elem = container.select_one(selectors['phone'])
        if phone_elem:
            phone_text = phone_elem.get_text()
            phone = self.extract_phone_number(phone_text)
            if phone:
                facility['phone'] = phone
        
        # Extract hours
        hours_elem = container.select_one(selectors['hours'])
        if hours_elem:
            facility['operating_hours'] = self.parse_hours(hours_elem.get_text())
        
        # Detect sports/activities
        container_text = container.get_text().lower()
        facility['sports_detected'] = []
        for sport in config['sports_indicators']:
            if sport in container_text:
                facility['sports_detected'].append(sport.title())
        
        # Extract links for more details
        links = container.find_all('a', href=True)
        facility['detail_links'] = []
        for link in links:
            href = urljoin(page_url, link['href'])
            facility['detail_links'].append({
                'url': href,
                'text': self.clean_text(link.get_text())
            })
        
        return facility
    
    async def find_pdf_schedules(self, soup: BeautifulSoup, base_url: str, config: Dict) -> List[Dict[str, str]]:
        """Find PDF schedules on the page"""
        pdf_schedules = []
        
        pdf_pattern = config.get('pdf_schedule_pattern', r'schedule.*\.pdf')
        
        for link in soup.find_all('a', href=True):
            href = link['href']
            if re.search(pdf_pattern, href, re.IGNORECASE):
                pdf_url = urljoin(base_url, href)
                pdf_schedules.append({
                    'url': pdf_url,
                    'title': self.clean_text(link.get_text()),
                    'type': 'schedule_pdf'
                })
        
        return pdf_schedules
    
    def clean_text(self, text: str) -> str:
        """Clean and normalize text"""
        if not text:
            return ""
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text.strip())
        
        # Remove common municipal prefixes
        text = re.sub(r'^(city of|district of|municipality of)\s+', '', text, flags=re.IGNORECASE)
        
        return text
    
    def extract_phone_number(self, text: str) -> Optional[str]:
        """Extract phone number from text"""
        phone_patterns = [
            r'\b(\d{3})[-.\s]?(\d{3})[-.\s]?(\d{4})\b',
            r'\((\d{3})\)\s*(\d{3})[-.\s]?(\d{4})\b'
        ]
        
        for pattern in phone_patterns:
            match = re.search(pattern, text)
            if match:
                groups = match.groups()
                if len(groups) == 3:
                    return f"{groups[0]}-{groups[1]}-{groups[2]}"
        
        return None
    
    def parse_hours(self, hours_text: str) -> Dict[str, str]:
        """Parse operating hours text into structured format"""
        hours = {}
        
        if not hours_text:
            return hours
        
        # Common day patterns
        day_patterns = {
            'monday': ['monday', 'mon'],
            'tuesday': ['tuesday', 'tue'],
            'wednesday': ['wednesday', 'wed'],
            'thursday': ['thursday', 'thu'],
            'friday': ['friday', 'fri'],
            'saturday': ['saturday', 'sat'],
            'sunday': ['sunday', 'sun']
        }
        
        # Time pattern
        time_pattern = r'(\d{1,2}):?(\d{2})?\s*(am|pm|a\.m\.|p\.m\.)'
        
        hours_lower = hours_text.lower()
        
        for day, patterns in day_patterns.items():
            for pattern in patterns:
                if pattern in hours_lower:
                    # Find times near this day mention
                    day_index = hours_lower.find(pattern)
                    context = hours_lower[day_index:day_index + 100]
                    
                    times = re.findall(time_pattern, context, re.IGNORECASE)
                    if len(times) >= 2:
                        start_time = self.format_time(times[0])
                        end_time = self.format_time(times[1])
                        hours[day] = f"{start_time} - {end_time}"
                    elif len(times) == 1:
                        hours[day] = self.format_time(times[0])
                    break
        
        return hours
    
    def format_time(self, time_tuple) -> str:
        """Format time tuple into readable string"""
        hour, minute, period = time_tuple
        minute = minute or "00"
        return f"{hour}:{minute} {period.upper()}"
    
    async def extract_pdf_schedule_data(self, pdf_url: str) -> Dict[str, Any]:
        """Extract data from PDF schedule documents"""
        try:
            async with self.session.get(pdf_url) as response:
                if response.status != 200:
                    return {}
                
                pdf_content = await response.read()
                pdf_reader = PyPDF2.PdfReader(io.BytesIO(pdf_content))
                
                text_content = ""
                for page in pdf_reader.pages:
                    text_content += page.extract_text()
                
                # Parse schedule information from PDF text
                schedule_data = self.parse_pdf_schedule_text(text_content)
                
                return {
                    'pdf_url': pdf_url,
                    'text_content': text_content[:1000],  # First 1000 chars
                    'schedule_data': schedule_data,
                    'extracted_at': datetime.now().isoformat()
                }
        
        except Exception as e:
            logger.debug(f"Failed to extract PDF data from {pdf_url}: {e}")
            return {}
    
    def parse_pdf_schedule_text(self, text: str) -> Dict[str, Any]:
        """Parse schedule information from PDF text"""
        schedule_info = {
            'programs': [],
            'facilities': [],
            'times': []
        }
        
        # Extract program names
        program_patterns = [
            r'(basketball|hockey|swimming|tennis|volleyball|badminton|soccer)',
            r'(drop.?in|adult|youth|senior|family)',
            r'(fitness|aqua|gym|court|rink|pool)'
        ]
        
        text_lower = text.lower()
        
        for pattern in program_patterns:
            matches = re.findall(pattern, text_lower)
            schedule_info['programs'].extend(matches)
        
        # Extract time information
        time_pattern = r'\b(\d{1,2}):(\d{2})\s*(am|pm)\b'
        times = re.findall(time_pattern, text_lower)
        
        for time_tuple in times[:10]:  # Limit to first 10 times
            formatted_time = self.format_time(time_tuple)
            schedule_info['times'].append(formatted_time)
        
        return schedule_info

# Example usage and testing
async def test_municipal_extractor():
    """Test the municipal site extractor"""
    async with MunicipalSiteExtractor() as extractor:
        # Test with Vancouver
        vancouver_config = extractor.municipal_patterns['vancouver.ca']
        facilities = await extractor.extract_municipal_domain('vancouver.ca', vancouver_config)
        
        print(f"Extracted {len(facilities)} facilities from Vancouver")
        
        if facilities:
            print("\nSample facility:")
            print(json.dumps(facilities[0], indent=2))

if __name__ == "__main__":
    asyncio.run(test_municipal_extractor())