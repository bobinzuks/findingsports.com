# 🏒 Vancouver/North Vancouver Recreation Data Collection Implementation Plan

## 🎯 Overview

Based on comprehensive research, here's the concrete plan to collect drop-in sports, ice times, and field availability data from Vancouver and North Vancouver recreation facilities.

## 📊 Data Sources Priority List

### Tier 1 - Immediately Scrapeable (High Value)

#### 1. **NVRC (North Vancouver Recreation)**
- **URL**: nvrc.ca
- **Method**: Puppeteer scraping of PerfectMind calendar
- **Data**: Drop-in schedules, ice times, pool schedules
- **Update**: Real-time

```javascript
// NVRC Calendar Structure
{
  endpoint: "https://nvrc.perfectmind.com/Clients/Calendar/",
  calendarIds: {
    dropInSports: "9290cb7e-d450-4972-b327-b89aa12b2a69",
    skating: "a28b2c65-61af-407f-80d1-eaa58f30a94a",
    swimming: "b34c3d76-71bf-418g-91e2-fbb69f31b3b7"
  }
}
```

#### 2. **Vancouver Open Data Portal**
- **URL**: opendata.vancouver.ca
- **Method**: REST API
- **Data**: Facility locations, amenities, contact info
- **Update**: Monthly

```javascript
// API endpoint
const endpoint = "https://opendata.vancouver.ca/api/v2/catalog/datasets/parks-facilities-2024/records";
```

#### 3. **Vancouver Field Status**
- **URL**: covapp.vancouver.ca/parkfinder/FieldStatus.aspx
- **Method**: HTML scraping
- **Data**: Weekend field conditions
- **Update**: Fridays at 1 PM

### Tier 2 - Requires Manual/Hybrid Approach

#### 4. **Community Center PDFs**
- **Examples**: 
  - Killarney Community Centre
  - Hillcrest Community Centre
  - Kerrisdale Community Centre
- **Method**: PDF parsing + manual entry
- **Data**: Drop-in schedules, programs
- **Update**: Seasonal (3-4 times/year)

#### 5. **Ice Arena Schedules**
- **Canlan Ice Sports North Shore**
- **8 Vancouver City Rinks**
- **Method**: Web scraping + phone calls
- **Data**: Public skate, shinny hockey times

### Tier 3 - Partnership Opportunities

#### 6. **Third-Party Aggregators**
- **GoodRec**: Already has daily games
- **Javelin Sports**: Volleyball focus
- **OpenSports**: Pickup games

## 🛠️ Technical Implementation

### Phase 1: NVRC Scraper (Week 1)

```javascript
// nvrc-scraper.js
const puppeteer = require('puppeteer');

class NVRCScraper {
  async scrapeDropInSchedule() {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // Navigate to drop-in schedules
    await page.goto('https://nvrc.ca/drop-in-schedules/sports-open-gym');
    
    // Wait for calendar widget to load
    await page.waitForSelector('.pm-calendar-widget', { timeout: 30000 });
    
    // Extract schedule data
    const schedules = await page.evaluate(() => {
      const events = [];
      document.querySelectorAll('.calendar-event').forEach(event => {
        events.push({
          title: event.querySelector('.event-title')?.textContent,
          time: event.querySelector('.event-time')?.textContent,
          location: event.querySelector('.event-location')?.textContent,
          price: event.querySelector('.event-price')?.textContent
        });
      });
      return events;
    });
    
    await browser.close();
    return schedules;
  }
}
```

### Phase 2: Vancouver Open Data Integration (Week 1)

```javascript
// vancouver-opendata.js
class VancouverOpenData {
  async getFacilities() {
    const response = await fetch(
      'https://opendata.vancouver.ca/api/v2/catalog/datasets/parks-facilities-2024/records?limit=500'
    );
    
    const data = await response.json();
    
    return data.records.map(record => ({
      name: record.fields.name,
      type: record.fields.facility_type,
      address: record.fields.address,
      coordinates: {
        lat: record.fields.geom.coordinates[1],
        lng: record.fields.geom.coordinates[0]
      },
      amenities: record.fields.amenities
    }));
  }
}
```

### Phase 3: Field Status Monitor (Week 2)

```javascript
// field-status-scraper.js
const cheerio = require('cheerio');

class FieldStatusScraper {
  async getFieldStatus() {
    const response = await fetch('https://covapp.vancouver.ca/parkfinder/FieldStatus.aspx');
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const fields = [];
    $('table.field-status tr').each((i, row) => {
      if (i === 0) return; // Skip header
      
      const cells = $(row).find('td');
      fields.push({
        park: cells.eq(0).text().trim(),
        field: cells.eq(1).text().trim(),
        sport: cells.eq(2).text().trim(),
        status: cells.eq(3).text().trim(),
        notes: cells.eq(4).text().trim()
      });
    });
    
    return fields;
  }
}
```

### Phase 4: PDF Schedule Parser (Week 3)

```javascript
// pdf-schedule-parser.js
const pdf = require('pdf-parse');

class PDFScheduleParser {
  async parseCommunitySchedule(pdfPath) {
    const dataBuffer = await fs.readFile(pdfPath);
    const data = await pdf(dataBuffer);
    
    // Parse text for drop-in activities
    const lines = data.text.split('\n');
    const dropInActivities = [];
    
    lines.forEach(line => {
      if (line.includes('Drop-in') || line.includes('drop in')) {
        // Extract activity details with regex
        const pattern = /([A-Za-z\s]+)\s+([A-Za-z]+)\s+(\d{1,2}:\d{2}[ap]m)\s*-\s*(\d{1,2}:\d{2}[ap]m)/i;
        const match = line.match(pattern);
        
        if (match) {
          dropInActivities.push({
            activity: match[1].trim(),
            day: match[2],
            startTime: match[3],
            endTime: match[4]
          });
        }
      }
    });
    
    return dropInActivities;
  }
}
```

## 📅 Data Update Schedule

### Real-time/Daily
- NVRC drop-in schedules
- Field cancellations (weather)
- Ice arena changes

### Weekly
- Vancouver field status (Fridays)
- Program registration updates
- Special events

### Seasonal
- Community center PDF guides
- Program changes (Fall, Winter, Spring, Summer)
- Pool schedules (indoor/outdoor transitions)

## 🗂️ Unified Data Schema

```javascript
{
  // Facility Information
  facility: {
    id: "nvrc-harry-jerome",
    name: "Harry Jerome Community Recreation Centre",
    type: "recreation-center",
    address: "123 23rd St E, North Vancouver",
    coordinates: { lat: 49.3234, lng: -123.0831 },
    amenities: ["ice-rink", "pool", "gymnasium", "fitness-center"],
    phone: "604-987-4386",
    website: "https://nvrc.ca/facilities/harry-jerome"
  },
  
  // Drop-in Activities
  activities: [
    {
      id: "hj-basketball-dropin-mon",
      sport: "basketball",
      type: "drop-in",
      name: "Adult Basketball Drop-in",
      facility: "Harry Jerome - Gymnasium",
      schedule: {
        dayOfWeek: "Monday",
        startTime: "19:00",
        endTime: "21:00",
        dates: {
          start: "2025-01-06",
          end: "2025-03-31"
        }
      },
      ageGroup: "19+",
      skillLevel: "all",
      cost: 6.75,
      requirements: ["Clean indoor shoes", "Athletic wear"],
      capacity: {
        max: 30,
        typical: 20
      },
      lastUpdated: "2025-01-10T10:00:00Z",
      source: "nvrc-scrape"
    }
  ],
  
  // Ice Times
  iceSchedule: [
    {
      id: "hj-public-skate-sat",
      type: "public-skate",
      rink: "Harry Jerome Arena",
      dayOfWeek: "Saturday",
      startTime: "14:00",
      endTime: "16:00",
      cost: {
        adult: 5.50,
        child: 3.75,
        senior: 4.25
      }
    }
  ],
  
  // Field Status
  fieldStatus: {
    lastUpdated: "2025-01-10T13:00:00Z",
    fields: [
      {
        park: "Mahon Park",
        field: "Field 1",
        sport: "soccer",
        status: "open",
        conditions: "Good - playable",
        notes: "Minor puddles in corners"
      }
    ]
  }
}
```

## 🚀 Quick Start Implementation

### 1. Set up base scrapers
```bash
npm install puppeteer cheerio pdf-parse node-fetch
```

### 2. Create scraper manager
```javascript
class RecreationDataManager {
  constructor() {
    this.scrapers = {
      nvrc: new NVRCScraper(),
      vancouver: new VancouverOpenData(),
      fields: new FieldStatusScraper(),
      pdf: new PDFScheduleParser()
    };
  }
  
  async collectAllData() {
    const [nvrcData, facilities, fieldStatus] = await Promise.all([
      this.scrapers.nvrc.scrapeDropInSchedule(),
      this.scrapers.vancouver.getFacilities(),
      this.scrapers.fields.getFieldStatus()
    ]);
    
    return {
      dropIn: nvrcData,
      facilities,
      fields: fieldStatus,
      timestamp: new Date()
    };
  }
}
```

### 3. Schedule automated collection
```javascript
// Run every hour for NVRC
cron.schedule('0 * * * *', async () => {
  await dataManager.collectNVRCData();
});

// Run Fridays at 2 PM for field status
cron.schedule('0 14 * * 5', async () => {
  await dataManager.collectFieldStatus();
});
```

## 📈 Success Metrics

### Phase 1 Goals (2 weeks)
- ✅ NVRC drop-in schedules live
- ✅ Vancouver facility data integrated
- ✅ Field status updates working
- ✅ 10+ facilities with data

### Phase 2 Goals (1 month)
- ✅ 50+ drop-in activities tracked
- ✅ Ice arena schedules included
- ✅ PDF parsing for 5 centers
- ✅ User submission system

### Phase 3 Goals (3 months)
- ✅ 100+ facilities covered
- ✅ Real-time updates via crowdsourcing
- ✅ Predictive availability
- ✅ API partnerships established

## 🎯 Next Steps

1. **Immediate**: Implement NVRC scraper
2. **Week 1**: Add Vancouver Open Data
3. **Week 2**: Field status monitoring
4. **Week 3**: Begin PDF parsing
5. **Ongoing**: Add more sources incrementally

This plan provides a clear path to aggregate recreation data from Vancouver and North Vancouver, starting with the most accessible sources and gradually expanding coverage.