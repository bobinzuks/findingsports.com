# Vancouver and North Vancouver Recreation Data Sources Research Report

## Executive Summary

This report provides a comprehensive analysis of recreation and sports data sources in Vancouver and North Vancouver, with a focus on drop-in sports, ice times, and field availability. The research reveals a fragmented landscape where data exists in various formats across multiple platforms, with limited API access and significant manual effort required for comprehensive data collection.

## Key Findings

### 1. Data Availability Overview

**Vancouver:**
- 24 community centers with varied data presentation
- Mix of HTML pages, PDFs, and proprietary booking systems
- Limited public API access despite open data initiatives
- Heavy reliance on phone calls and in-person inquiries

**North Vancouver:**
- Centralized through NVRC (North Vancouver Recreation & Culture)
- Uses PerfectMind booking platform
- Better online integration but still no public API
- Dynamic JavaScript-based calendar systems

### 2. Primary Data Sources

#### A. Municipal Recreation Systems

**Vancouver Parks & Recreation**
- **Website**: vancouver.ca/parks-recreation-culture/
- **Data Format**: HTML pages, PDF program guides
- **Booking System**: Active Communities (ca.apm.activecommunities.com/vancouver/)
- **API**: None publicly available
- **Update Frequency**: Weekly for facilities, varies for schedules
- **Key Challenge**: Each community center maintains separate schedules, often in PDF format

**North Vancouver Recreation Commission (NVRC)**
- **Website**: nvrc.ca
- **Data Format**: Dynamic JavaScript calendar (PerfectMind platform)
- **Booking System**: nvrc.perfectmind.com
- **API**: None publicly available
- **Update Frequency**: Real-time for bookings, weekly for schedules
- **Key URLs**:
  - Drop-in schedules: /drop-in-schedules
  - Sports & Open Gym: /drop-in-schedules/sports-open-gym
  - Skating schedules: /programs-memberships/program-directory/skating

#### B. Open Data Sources

**Vancouver Open Data Portal**
- **URL**: opendata.vancouver.ca
- **Available Datasets**:
  - Parks facilities (220+ parks, 40 major facilities)
  - Community centers (names and addresses only)
  - Recreation features
- **API**: RESTful API available (requires registration)
- **Limitation**: No schedule or availability data, only facility information
- **Format**: JSON via API

#### C. Ice Arenas

**Municipal Arenas:**
- Harry Jerome Community Recreation Centre (North Van)
- Karen Magnussen Community Recreation Centre (North Van)
- 8 indoor ice rinks across Vancouver
- Data typically embedded in facility pages, no centralized schedule

**Canlan Ice Sports North Shore**
- **Website**: canlansports.com/locations/ca/bc/north-shore/
- **Facilities**: 3 NHL-sized rinks
- **Data Format**: HTML schedules
- **Booking**: Online system available
- **API**: None found

#### D. Field Status Systems

**Vancouver Field Status**
- **URL**: covapp.vancouver.ca/parkfinder/FieldStatus.aspx
- **Update Schedule**: Every Friday by 1:00 PM
- **Data Format**: Static HTML (OutSystems framework)
- **API Potential**: AJAX endpoint found at "/ParkFinder/_status.aspx"
- **Information**: Weekend play status only

**North Vancouver Field Status**
- **URL**: nvrc.ca/facilities-fields/field-status-locations
- **Features**: Real-time closure updates
- **Data Format**: Dynamic web page

### 3. Third-Party Aggregators

**GoodRec**
- **Coverage**: Daily games in Vancouver
- **Venues**: Multiple locations including UBC, Empire Fields
- **API**: Potential partnership opportunity
- **Features**: Real-time availability, player counts

**Javelin Sports**
- **Focus**: Volleyball specific
- **Coverage**: Canada-wide
- **API**: App-based, no public API

**Urban Rec**
- **Type**: League-based (not drop-in focused)
- **API**: None found
- **Contact**: info@urbanrec.ca for partnership inquiries

### 4. Data Structure Analysis

#### NVRC PerfectMind System
```javascript
// Calendar structure observed:
{
  calendarId: "9290cb7e-d450-4972-b327-b89aa12b2a69",
  widgetId: "a28b2c65-61af-407f-80d1-eaa58f30a94a",
  eventData: {
    // Dynamically loaded via AJAX
    date: "${date_range}",
    events: [
      {
        title: "Event Name",
        time: "HH:MM - HH:MM",
        location: "Facility Name",
        instructor: "Name",
        price: "$XX.XX",
        spotsAvailable: X
      }
    ]
  }
}
```

#### Vancouver Community Center PDFs
- Format: Varies significantly by center
- Common elements:
  - Activity name
  - Day/time
  - Age group
  - Drop-in vs registered
  - Cost
- Challenge: No standardized format across centers

### 5. Technical Implementation Recommendations

#### A. Data Collection Strategy

**1. Automated Collection (Where Possible)**
```javascript
// Vancouver Open Data API
const facilities = await fetch('https://opendata.vancouver.ca/api/v2/catalog/datasets/parks-facilities-2024/records?limit=100');

// NVRC Calendar Scraping (requires dynamic content handling)
const puppeteer = require('puppeteer');
const browser = await puppeteer.launch();
const page = await browser.newPage();
await page.goto('https://nvrc.perfectmind.com/...');
// Wait for calendar to load
await page.waitForSelector('.calendar-event');
```

**2. Manual/Semi-Manual Collection**
- PDF parsing for community center schedules
- Regular phone calls to facilities for updates
- Crowdsourcing from users

**3. Hybrid Approach**
- Automated facility data from Open Data Portal
- Web scraping for NVRC schedules
- Manual updates for PDF-based schedules
- User submissions for real-time updates

#### B. Data Storage Schema
```json
{
  "facilityId": "unique-id",
  "facilityName": "Community Center Name",
  "facilityType": "community-center|arena|field",
  "location": {
    "address": "Full Address",
    "coordinates": { "lat": 49.xxx, "lng": -123.xxx }
  },
  "activities": [
    {
      "activityId": "unique-id",
      "sport": "basketball|volleyball|hockey|etc",
      "type": "drop-in|registered|league",
      "schedule": {
        "dayOfWeek": "Monday",
        "startTime": "19:00",
        "endTime": "21:00",
        "frequency": "weekly|biweekly|monthly"
      },
      "ageGroup": "adult|youth|all-ages",
      "cost": 5.00,
      "lastUpdated": "2024-01-10T10:00:00Z",
      "dataSource": "nvrc-scrape|pdf-manual|user-submission"
    }
  ]
}
```

### 6. Challenges and Limitations

**Technical Challenges:**
- No unified API across municipalities
- Dynamic JavaScript content requires browser automation
- PDF schedules require manual extraction or OCR
- Frequent changes without notification system

**Data Quality Issues:**
- Inconsistent update frequencies
- Varying data formats across facilities
- No real-time availability for drop-in activities
- Seasonal variations not always documented

**Legal Considerations:**
- Check robots.txt for each domain
- Respect rate limits on scraping
- Consider data usage agreements
- Privacy regulations for user data

### 7. Recommended Implementation Plan

**Phase 1: Foundation (Week 1-2)**
1. Set up Vancouver Open Data API integration
2. Implement NVRC calendar scraper using Puppeteer
3. Create unified data schema
4. Build basic data storage system

**Phase 2: Expansion (Week 3-4)**
1. Add PDF parsing for select community centers
2. Integrate Canlan Ice Sports schedules
3. Implement field status monitoring
4. Create data validation system

**Phase 3: Enhancement (Week 5-6)**
1. Add user submission system
2. Implement data freshness tracking
3. Create notification system for changes
4. Build API rate limiting and caching

**Phase 4: Optimization (Ongoing)**
1. Monitor data quality
2. Expand coverage to more facilities
3. Negotiate API access with providers
4. Implement machine learning for pattern detection

### 8. Alternative Approaches

**Partnership Strategy:**
- Contact recreation departments directly
- Negotiate data sharing agreements
- Offer value proposition (increased visibility)
- Consider revenue sharing models

**Crowdsourcing:**
- Build user submission features
- Implement verification system
- Gamify data contributions
- Create facility "ambassadors"

**Hybrid Commercial:**
- Partner with existing aggregators (GoodRec, Javelin)
- License data from commercial providers
- Build complementary features

### 9. Specific Source Details

#### Vancouver Community Centers (Sample)
- **Killarney**: PDF program guide
- **Carnegie**: PDF schedule, focus on low-income programs
- **Roundhouse**: HTML schedule on website
- **Each center**: Unique format and update schedule

#### North Vancouver Facilities
- **Harry Jerome**: Ice arena + recreation center
- **Karen Magnussen**: Wave pool + ice arena
- **Ron Andrews**: Gymnasium focus
- **Delbrook**: Multi-sport facility

### 10. Next Steps

1. **Immediate Actions:**
   - Contact Vancouver Parks & Rec for data partnership
   - Test NVRC scraping proof of concept
   - Analyze sample PDFs for common patterns

2. **Short-term Goals:**
   - Build MVP with 5-10 facilities
   - Test user submission features
   - Validate data accuracy

3. **Long-term Vision:**
   - Comprehensive coverage of Metro Vancouver
   - Real-time availability updates
   - Predictive availability based on patterns
   - Integration with booking systems

## Conclusion

While Vancouver and North Vancouver have extensive recreation facilities and programs, the data landscape is highly fragmented. Success will require a multi-pronged approach combining automated scraping, manual curation, partnerships, and user contributions. The technical challenges are significant but surmountable with the right combination of tools and strategies.

The most promising immediate opportunities are:
1. NVRC's PerfectMind system (most structured data)
2. Vancouver Open Data Portal (facility information)
3. Partnership with aggregators like GoodRec
4. User-submitted updates for real-time accuracy

Building a comprehensive recreation data platform will require ongoing effort, but the clear user need and limited existing solutions present a significant opportunity.