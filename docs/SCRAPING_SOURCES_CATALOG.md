# Web Scraping Sources Catalog

## Overview

This catalog documents 20+ reliable sources for scraping sports venue and drop-in game data. Each source is categorized by type, difficulty, and recommended scraping approach.

## 1. Municipal Recreation Websites

### Toronto Parks & Recreation
- **URL Pattern**: `https://www.toronto.ca/data/parks/prd/facilities/complex/*/index.html`
- **Data Format**: HTML with structured data
- **Schedule Format**: HTML tables, some JSON endpoints
- **Anti-Scraping**: Minimal
- **Strategy**: Direct HTML parsing, check for JSON API endpoints
- **Example**: 
  ```javascript
  // JSON endpoint discovered
  https://www.toronto.ca/data/parks/prd/facilities/recreationcentres/{id}/dropin.json
  ```

### NYC Parks & Recreation
- **URL Pattern**: `https://www.nycgovparks.org/facilities/recreationcenters/*`
- **Data Format**: HTML with consistent structure
- **Schedule Format**: Seasonal PDFs, some HTML tables
- **Anti-Scraping**: robots.txt compliant
- **Strategy**: Combine HTML parsing with PDF extraction

### Chicago Park District
- **URL Pattern**: `https://www.chicagoparkdistrict.com/parks-facilities/*`
- **Data Format**: Dynamic JavaScript content
- **Schedule Format**: Calendar widgets, activity listings
- **Anti-Scraping**: Rate limiting in place
- **Strategy**: Puppeteer required for JS rendering

### Los Angeles Recreation and Parks
- **URL Pattern**: `https://www.laparks.org/recreationcenter/*`
- **Data Format**: Mixed HTML/PDF
- **Schedule Format**: Quarterly PDF schedules
- **Anti-Scraping**: None observed
- **Strategy**: PDF parsing primary, HTML for facility info

### Seattle Parks and Recreation
- **URL Pattern**: `https://www.seattle.gov/parks/find/centers/*`
- **Data Format**: WordPress-based HTML
- **Schedule Format**: Embedded calendars, some PDFs
- **Anti-Scraping**: Standard robots.txt
- **Strategy**: CSS selectors for WordPress structure

## 2. Community Centers

### YMCA Locations
- **National Directory**: Limited central access
- **Local Examples**:
  - Toronto: `https://ymcagta.org/find-a-y/*`
  - Chicago: `https://www.ymcachicago.org/locations/*`
  - NYC: `https://ymcanyc.org/locations/*`
- **Data Format**: Varies by region
- **Schedule Format**: Mix of HTML, PDFs, third-party booking systems
- **Anti-Scraping**: Some use Cloudflare
- **Strategy**: Region-specific scrapers, handle multiple formats

### YWCA Locations
- **Similar structure to YMCA**
- **Often simpler websites**
- **Better for testing scrapers**

### Boys & Girls Clubs
- **URL Pattern**: `https://www.bgc*.org/locations`
- **Data Format**: Usually simpler HTML
- **Schedule Format**: Often PDFs or images
- **Strategy**: Focus on contact info, call for schedules

### Jewish Community Centers (JCC)
- **Highly localized websites**
- **Good drop-in sports programs**
- **Example**: `https://www.jccmanhattan.org/`
- **Strategy**: Custom scraper per location

## 3. Arena/Rink Websites

### Municipal Arenas
- **Toronto**: `https://www.toronto.ca/data/parks/prd/facilities/arenas/index.html`
- **Data Format**: Structured HTML lists
- **Schedule Format**: Public skating times in tables
- **Strategy**: Table parsing, watch for schedule changes

### Private Ice Rinks
- **Example**: Canlan Ice Sports
- **URL**: `https://www.icesports.com/*/schedules`
- **Data Format**: Dynamic calendars
- **Anti-Scraping**: Session-based
- **Strategy**: API reverse engineering often possible

### Sports Complexes
- **Example**: Sportsplex facilities
- **Mixed sports offerings**
- **Often use booking systems like PerfectMind

## 4. University Recreation Centers

### Common Patterns
- **URL Structure**: `https://*.edu/recreation/*`
- **Access**: Often restricted to students/members
- **Public Hours**: Usually have community drop-in times
- **Examples**:
  - MIT: `https://mitrecsports.com/`
  - UCLA: `https://recreation.ucla.edu/`

### Scraping Challenges
- **Authentication**: Some require login
- **Dynamic Content**: Heavy JavaScript use
- **Mobile Apps**: Fusion Play, etc.
- **Strategy**: Focus on public/guest hours

## 5. Church Gymnasiums

### Characteristics
- **Simplest websites**: Often static HTML
- **Regular schedules**: Weekly patterns
- **Community-focused**: Open gym times
- **Examples**:
  - Large churches with recreation ministries
  - Catholic schools with evening programs

### Scraping Approach
- **Very straightforward**: Basic HTML parsing
- **Look for**: "Open Gym", "Community Hours"
- **Schedule Format**: Usually text or simple tables

## 6. Sports-Specific Facilities

### Tennis Clubs
- **Public courts** often have drop-in hours
- **Booking systems**: TennisBookings, CourtReserve
- **Strategy**: Check for API access

### Basketball Courts
- **Indoor facilities**: Community centers, gyms
- **Outdoor courts**: Use mapping data
- **Apps**: HoopMaps has some data

### Soccer Fields
- **Municipal fields**: City websites
- **Private facilities**: Indoor soccer centers
- **Booking**: Often through city systems

## Technical Implementation Details

### HTML Structure Patterns

#### Schedule Tables
```html
<!-- Common pattern -->
<table class="schedule">
  <tr>
    <td>Monday</td>
    <td>Basketball Drop-in</td>
    <td>6:00 PM - 8:00 PM</td>
  </tr>
</table>
```

#### Calendar Widgets
```javascript
// FullCalendar detection
if ($('.fc-event').length > 0) {
  // Extract from FullCalendar
}

// Google Calendar embed
if ($('iframe[src*="calendar.google.com"]').length > 0) {
  // Parse Google Calendar
}
```

### PDF Parsing Patterns

#### Common Schedule Formats
1. **Tabular PDFs**: Use tabula-py or pdf-tables
2. **Text PDFs**: Regular expression matching
3. **Scanned PDFs**: OCR required (Tesseract)

#### Example Patterns
```
Monday\s+(\d{1,2}:\d{2}\s*[AP]M)\s*-\s*(\d{1,2}:\d{2}\s*[AP]M)\s+(Basketball|Volleyball)
Drop-in\s+([\w\s]+)\s+([A-Za-z]+)\s+(\d{1,2}:\d{2})
```

### Anti-Scraping Mitigation

#### Rate Limiting
```javascript
class RateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.requests = [];
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async throttle() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.requests.push(now);
  }
}
```

#### User-Agent Rotation
```javascript
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
];

function getRandomUserAgent() {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}
```

### Data Extraction Patterns

#### Time Extraction
```javascript
function extractTimes(text) {
  const patterns = [
    /(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)/gi,
    /(\d{1,2})\s*(am|pm|AM|PM)/gi,
    /(\d{1,2})h(\d{2})/gi
  ];
  
  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    if (matches) return Array.from(matches);
  }
  return [];
}
```

#### Sport Detection
```javascript
const sportKeywords = {
  basketball: ['basketball', 'hoops', 'bball', '🏀'],
  volleyball: ['volleyball', 'vball', '🏐'],
  soccer: ['soccer', 'football', 'futbol', '⚽'],
  hockey: ['hockey', 'ice hockey', 'floor hockey', '🏒'],
  swimming: ['swim', 'aqua', 'pool', '🏊']
};

function detectSport(text) {
  const lower = text.toLowerCase();
  for (const [sport, keywords] of Object.entries(sportKeywords)) {
    if (keywords.some(keyword => lower.includes(keyword))) {
      return sport;
    }
  }
  return 'other';
}
```

## Scraping Priority Strategy

### Tier 1: High Value, Easy
1. Toronto recreation JSON endpoints
2. NYC open data feeds
3. Church gymnasiums
4. Community centers with static HTML

### Tier 2: High Value, Medium Difficulty
1. YMCA locations
2. University rec centers (public hours)
3. Municipal PDFs
4. Arena public skating schedules

### Tier 3: Lower Priority
1. Private facilities requiring auth
2. Heavily protected sites
3. Frequently changing formats
4. Low drop-in availability

## Maintenance Considerations

### Change Detection
- Monitor for format changes
- Set up alerts for scraping failures
- Version control scraping rules

### Legal Compliance
- Respect robots.txt
- Include source attribution
- Don't overload servers
- Contact sites for API access

### Data Quality
- Validate extracted data
- Cross-reference multiple sources
- User verification for accuracy
- Regular quality audits