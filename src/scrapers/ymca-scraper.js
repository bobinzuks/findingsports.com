const BaseScraper = require('./base-scraper');
const cheerio = require('cheerio');
const axios = require('axios');

class YMCAScraper extends BaseScraper {
  constructor(config = {}) {
    super(config);
    
    // YMCA-specific configurations
    this.baseUrls = {
      toronto: 'https://ymcagta.org/find-a-y',
      chicago: 'https://www.ymcachicago.org/locations',
      // Add more YMCA regions as needed
    };

    this.scheduleSelectors = {
      calendar: '.schedule-calendar',
      dropIn: '.drop-in-schedule',
      programs: '.program-schedule',
      pdf: 'a[href*="schedule.pdf"]',
    };
  }

  async scrapeNearbyLocations(location, radius) {
    const results = [];
    
    // Determine which YMCA region to scrape based on location
    const region = this.determineRegion(location);
    if (!region || !this.baseUrls[region]) {
      this.logger.warn(`No YMCA scraper configured for location: ${JSON.stringify(location)}`);
      return results;
    }

    try {
      // First, get list of YMCA locations
      const locations = await this.scrapeLocationsList(region);
      
      // Filter by distance
      const nearbyLocations = locations.filter(loc => {
        if (!loc.coordinates) return false;
        const distance = this.calculateDistance(
          location.lat, location.lng,
          loc.coordinates.lat, loc.coordinates.lng
        );
        return distance <= radius;
      });

      // Scrape schedule for each nearby location
      for (const ymcaLocation of nearbyLocations) {
        try {
          const schedule = await this.scrapeLocationSchedule(ymcaLocation);
          results.push({
            source: 'ymca_scraper',
            sourceId: `ymca_${region}_${ymcaLocation.id}`,
            name: ymcaLocation.name,
            address: ymcaLocation.address,
            location: ymcaLocation.coordinates,
            type: 'community_center',
            games: schedule,
          });
        } catch (error) {
          this.logger.error(`Failed to scrape YMCA location ${ymcaLocation.name}:`, error);
        }
      }
    } catch (error) {
      this.logger.error(`YMCA scraper error for region ${region}:`, error);
    }

    return results;
  }

  determineRegion(location) {
    // Simple region determination based on coordinates
    // In production, use proper geocoding
    const regions = {
      toronto: { lat: 43.6532, lng: -79.3832, radius: 50 },
      chicago: { lat: 41.8781, lng: -87.6298, radius: 50 },
    };

    for (const [region, center] of Object.entries(regions)) {
      const distance = this.calculateDistance(
        location.lat, location.lng,
        center.lat, center.lng
      );
      if (distance <= center.radius) {
        return region;
      }
    }

    return null;
  }

  async scrapeLocationsList(region) {
    const url = this.baseUrls[region];
    const locations = [];

    try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);

      // Parse location listings - this varies by region
      $('.location-item, .ymca-location').each((i, elem) => {
        const $elem = $(elem);
        
        const location = {
          id: $elem.attr('data-location-id') || i,
          name: $elem.find('.location-name, h3').text().trim(),
          address: $elem.find('.location-address, .address').text().trim(),
          url: $elem.find('a').attr('href'),
          coordinates: this.extractCoordinates($elem),
        };

        if (location.name && location.url) {
          locations.push(location);
        }
      });
    } catch (error) {
      this.logger.error(`Failed to scrape YMCA locations list for ${region}:`, error);
    }

    return locations;
  }

  async scrapeLocationSchedule(location) {
    if (!location.url) return [];

    const games = [];
    
    try {
      // Use Puppeteer for dynamic content
      const scheduleData = await this.scrape(location.url, () => {
        const extractSchedule = () => {
          const schedule = [];
          
          // Look for drop-in schedules
          const dropInElements = document.querySelectorAll('.drop-in-item, .schedule-item, .program-item');
          
          dropInElements.forEach(elem => {
            const text = elem.textContent;
            const timeMatch = text.match(/(\d{1,2}):(\d{2})\s*(am|pm)/gi);
            const sportMatch = text.match(/(basketball|volleyball|swimming|badminton|pickleball)/gi);
            
            if (timeMatch && sportMatch) {
              schedule.push({
                raw: text,
                element: elem.outerHTML,
              });
            }
          });

          // Check for PDF schedules
          const pdfLinks = Array.from(document.querySelectorAll('a[href*=".pdf"]'))
            .filter(link => link.href.toLowerCase().includes('schedule'))
            .map(link => link.href);

          return { schedule, pdfLinks };
        };

        return extractSchedule();
      });

      // Parse extracted schedule data
      for (const item of scheduleData.schedule) {
        const parsed = this.parseScheduleItem(item.raw);
        if (parsed) {
          games.push(...parsed);
        }
      }

      // Handle PDF schedules
      for (const pdfUrl of scheduleData.pdfLinks) {
        const pdfGames = await this.extractScheduleFromPDF(pdfUrl);
        if (pdfGames) {
          games.push(...pdfGames);
        }
      }

    } catch (error) {
      this.logger.error(`Failed to scrape schedule for ${location.name}:`, error);
    }

    return games;
  }

  parseScheduleItem(text) {
    const games = [];
    const today = new Date();
    
    // Extract day of week
    const dayMatch = text.match(/(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi);
    if (!dayMatch) return games;

    // Extract times
    const timeMatches = text.match(/(\d{1,2}):(\d{2})\s*(am|pm)\s*-\s*(\d{1,2}):(\d{2})\s*(am|pm)/gi);
    if (!timeMatches) return games;

    // Extract sport
    const sportMatch = text.match(/(basketball|volleyball|swimming|badminton|pickleball|soccer|hockey)/gi);
    const sport = sportMatch ? sportMatch[0].toLowerCase() : 'other';

    // Extract other details
    const skillMatch = text.match(/(beginner|intermediate|advanced|all levels)/gi);
    const skillLevel = skillMatch ? skillMatch[0].toLowerCase().replace(' levels', '') : 'all';

    const priceMatch = text.match(/\$(\d+(?:\.\d{2})?)|free/gi);
    const price = priceMatch ? 
      (priceMatch[0].toLowerCase() === 'free' ? 0 : parseFloat(priceMatch[0].replace('$', ''))) : 
      0;

    // Create game entries for next 7 days
    for (const day of dayMatch) {
      const dayIndex = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
        .indexOf(day.toLowerCase());
      
      for (const timeMatch of timeMatches) {
        const [startStr, endStr] = timeMatch.split('-').map(t => t.trim());
        
        // Calculate next occurrence of this day
        const daysUntil = (dayIndex - today.getDay() + 7) % 7 || 7;
        const gameDate = new Date(today);
        gameDate.setDate(gameDate.getDate() + daysUntil);
        
        const startTime = this.parseTimeString(startStr, gameDate);
        const endTime = this.parseTimeString(endStr, gameDate);
        
        if (startTime && endTime) {
          games.push({
            sport,
            gameType: 'drop-in',
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            skillLevel,
            price,
            metadata: {
              rawText: text,
              dayOfWeek: day,
            },
          });
        }
      }
    }

    return games;
  }

  extractCoordinates($elem) {
    // Try to extract coordinates from data attributes or nearby elements
    const lat = $elem.attr('data-lat') || $elem.find('[data-lat]').attr('data-lat');
    const lng = $elem.attr('data-lng') || $elem.find('[data-lng]').attr('data-lng');
    
    if (lat && lng) {
      return {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
      };
    }

    // Try to extract from Google Maps link
    const mapLink = $elem.find('a[href*="maps.google.com"], a[href*="google.com/maps"]').attr('href');
    if (mapLink) {
      const coords = this.extractCoordsFromMapLink(mapLink);
      if (coords) return coords;
    }

    return null;
  }

  extractCoordsFromMapLink(url) {
    // Extract coordinates from Google Maps URL
    const patterns = [
      /@(-?\d+\.\d+),(-?\d+\.\d+)/,
      /ll=(-?\d+\.\d+),(-?\d+\.\d+)/,
      /q=(-?\d+\.\d+),(-?\d+\.\d+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return {
          lat: parseFloat(match[1]),
          lng: parseFloat(match[2]),
        };
      }
    }

    return null;
  }

  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}

module.exports = YMCAScraper;