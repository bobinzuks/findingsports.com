const BaseScraper = require('./base-scraper');
const cheerio = require('cheerio');
const axios = require('axios');

class CommunityScraper extends BaseScraper {
  constructor(config = {}) {
    super(config);
    
    // Community center patterns and configurations
    this.scraperConfigs = [
      {
        name: 'toronto_community_centers',
        urlPattern: /toronto\.ca.*community-centre/i,
        selectors: {
          schedule: '.program-schedule, .drop-in-schedule',
          name: 'h1, .facility-name',
          address: '.address, .location-address',
        },
      },
      {
        name: 'nyc_recreation',
        urlPattern: /nycgovparks\.org/i,
        selectors: {
          schedule: '.recreation-schedule',
          programs: '.program-list',
        },
      },
      {
        name: 'chicago_park_district',
        urlPattern: /chicagoparkdistrict\.com/i,
        selectors: {
          activities: '.activity-schedule',
          facilities: '.facility-info',
        },
      },
    ];
  }

  async scrapeNearbyLocations(location, radius) {
    const results = [];
    
    // In a real implementation, you would:
    // 1. Use a geocoding service to find community centers near the location
    // 2. Get their websites
    // 3. Scrape each one
    
    // For this example, we'll use predefined community center URLs
    const communityCenter URLs = await this.findNearbyCommunityCenterURLs(location, radius);
    
    for (const url of communityCenterURLs) {
      try {
        const data = await this.scrapeCommunityCenter(url);
        if (data && data.games && data.games.length > 0) {
          results.push(data);
        }
      } catch (error) {
        this.logger.error(`Failed to scrape ${url}:`, error);
      }
    }

    return results;
  }

  async findNearbyCommunityCenterURLs(location, radius) {
    // This would normally query a database or API
    // For now, return example URLs based on location
    const urls = [];
    
    // Toronto area
    if (Math.abs(location.lat - 43.65) < 1) {
      urls.push(
        'https://www.toronto.ca/data/parks/prd/facilities/complex/1/index.html',
        'https://www.toronto.ca/data/parks/prd/facilities/complex/2/index.html',
        'https://www.toronto.ca/data/parks/prd/facilities/complex/3/index.html'
      );
    }
    
    // NYC area
    if (Math.abs(location.lat - 40.71) < 1) {
      urls.push(
        'https://www.nycgovparks.org/facilities/recreationcenters/M104',
        'https://www.nycgovparks.org/facilities/recreationcenters/B058',
        'https://www.nycgovparks.org/facilities/recreationcenters/Q099'
      );
    }

    return urls;
  }

  async scrapeCommunityCenter(url) {
    // Determine which scraper config to use
    const config = this.scraperConfigs.find(c => c.urlPattern.test(url));
    if (!config) {
      return this.scrapeGenericCommunityCenter(url);
    }

    return this.scrape(url, () => {
      const extractData = () => {
        const data = {
          url: window.location.href,
          name: '',
          address: '',
          games: [],
        };

        // Extract name
        const nameSelectors = config.selectors.name || 'h1';
        const nameElem = document.querySelector(nameSelectors);
        if (nameElem) {
          data.name = nameElem.textContent.trim();
        }

        // Extract address
        if (config.selectors.address) {
          const addressElem = document.querySelector(config.selectors.address);
          if (addressElem) {
            data.address = addressElem.textContent.trim();
          }
        }

        // Extract schedule
        const scheduleSelectors = config.selectors.schedule || '.schedule';
        const scheduleElements = document.querySelectorAll(scheduleSelectors);
        
        scheduleElements.forEach(elem => {
          const scheduleText = elem.textContent;
          
          // Look for drop-in activities
          if (scheduleText.toLowerCase().includes('drop-in') ||
              scheduleText.toLowerCase().includes('open gym') ||
              scheduleText.toLowerCase().includes('free play')) {
            
            // Extract activity details
            const lines = scheduleText.split('\n').filter(line => line.trim());
            
            lines.forEach(line => {
              const sportMatch = line.match(/(basketball|volleyball|badminton|pickleball|soccer|hockey)/i);
              const timeMatch = line.match(/(\d{1,2}):(\d{2})\s*(am|pm)/gi);
              const dayMatch = line.match(/(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i);
              
              if (sportMatch && timeMatch && dayMatch) {
                data.games.push({
                  raw: line,
                  sport: sportMatch[0].toLowerCase(),
                  times: timeMatch,
                  day: dayMatch[0].toLowerCase(),
                });
              }
            });
          }
        });

        // Look for PDF links
        const pdfLinks = Array.from(document.querySelectorAll('a[href$=".pdf"]'))
          .filter(link => {
            const text = link.textContent.toLowerCase();
            return text.includes('schedule') || text.includes('program') || text.includes('drop-in');
          })
          .map(link => link.href);

        data.pdfLinks = pdfLinks;

        return data;
      };

      return extractData();
    });
  }

  async scrapeGenericCommunityCenter(url) {
    try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);
      
      const data = {
        source: 'community_scraper',
        sourceId: `community_${Buffer.from(url).toString('base64').substring(0, 10)}`,
        name: $('h1').first().text().trim() || 'Community Center',
        address: this.extractAddress($),
        location: null, // Would need geocoding
        type: 'community_center',
        games: [],
      };

      // Look for schedule information
      const schedulePatterns = [
        'drop-in', 'open gym', 'free play', 'public skating',
        'recreational swim', 'open swim', 'fitness room'
      ];

      $('*').each((i, elem) => {
        const text = $(elem).text().toLowerCase();
        
        for (const pattern of schedulePatterns) {
          if (text.includes(pattern)) {
            const gameInfo = this.extractGameInfo($(elem), $);
            if (gameInfo) {
              data.games.push(gameInfo);
            }
          }
        }
      });

      // Check for schedule tables
      $('table').each((i, table) => {
        const headers = $(table).find('th').map((i, th) => $(th).text().toLowerCase()).get();
        
        if (headers.some(h => h.includes('time') || h.includes('schedule'))) {
          const games = this.parseScheduleTable($(table));
          data.games.push(...games);
        }
      });

      // Look for calendar widgets
      const calendarData = this.extractCalendarData($);
      if (calendarData) {
        data.games.push(...calendarData);
      }

      return data;
      
    } catch (error) {
      this.logger.error(`Error scraping ${url}:`, error);
      return null;
    }
  }

  extractAddress($) {
    const addressPatterns = [
      '.address', '.location', '.facility-address',
      '[itemprop="address"]', '[class*="address"]'
    ];

    for (const pattern of addressPatterns) {
      const elem = $(pattern).first();
      if (elem.length) {
        return this.normalizeAddress(elem.text());
      }
    }

    // Look for address in meta tags
    const metaAddress = $('meta[property="og:street-address"]').attr('content') ||
                       $('meta[name="address"]').attr('content');
    
    if (metaAddress) {
      return this.normalizeAddress(metaAddress);
    }

    return null;
  }

  extractGameInfo(elem, $) {
    const parent = elem.parent();
    const text = parent.text();
    
    // Extract sport
    const sportMatch = text.match(/(basketball|volleyball|badminton|pickleball|soccer|hockey|swimming)/i);
    if (!sportMatch) return null;

    // Extract time
    const timeMatch = text.match(/(\d{1,2}):(\d{2})\s*(am|pm)\s*[-–]\s*(\d{1,2}):(\d{2})\s*(am|pm)/i);
    if (!timeMatch) return null;

    // Extract day
    const dayMatch = text.match(/(monday|tuesday|wednesday|thursday|friday|saturday|sunday|daily|weekdays|weekends)/i);
    
    return {
      sport: sportMatch[0].toLowerCase(),
      gameType: 'drop-in',
      timeRange: timeMatch[0],
      dayPattern: dayMatch ? dayMatch[0].toLowerCase() : 'unknown',
      rawText: text.substring(0, 200),
    };
  }

  parseScheduleTable($table) {
    const games = [];
    const headers = $table.find('th').map((i, th) => $(th).text().toLowerCase()).get();
    
    const timeIndex = headers.findIndex(h => h.includes('time'));
    const activityIndex = headers.findIndex(h => h.includes('activity') || h.includes('program'));
    const dayIndex = headers.findIndex(h => h.includes('day'));

    if (timeIndex === -1 || activityIndex === -1) return games;

    $table.find('tr').each((i, row) => {
      const cells = $(row).find('td');
      if (cells.length === 0) return;

      const activity = $(cells[activityIndex]).text();
      const time = $(cells[timeIndex]).text();
      const day = dayIndex !== -1 ? $(cells[dayIndex]).text() : '';

      const sportMatch = activity.match(/(basketball|volleyball|badminton|pickleball|soccer|hockey|swimming)/i);
      if (sportMatch && time.includes(':')) {
        games.push({
          sport: sportMatch[0].toLowerCase(),
          gameType: 'drop-in',
          timeText: time,
          dayText: day,
          activity: activity,
        });
      }
    });

    return games;
  }

  extractCalendarData($) {
    const games = [];
    
    // Look for FullCalendar, Google Calendar, or other calendar widgets
    const calendarSelectors = [
      '[class*="calendar"]',
      '[id*="calendar"]',
      '.fc-event', // FullCalendar
      '.event-item',
    ];

    for (const selector of calendarSelectors) {
      $(selector).each((i, elem) => {
        const $elem = $(elem);
        const title = $elem.find('.event-title, .fc-event-title').text() ||
                     $elem.attr('title') ||
                     $elem.text();

        if (title && this.isSportsActivity(title)) {
          const timeText = $elem.find('.event-time, .fc-event-time').text();
          const dateText = $elem.attr('data-date') || $elem.find('.event-date').text();

          games.push({
            title,
            timeText,
            dateText,
            sport: this.extractSportFromTitle(title),
            gameType: 'drop-in',
          });
        }
      });
    }

    return games;
  }

  isSportsActivity(text) {
    const sportsKeywords = [
      'basketball', 'volleyball', 'badminton', 'pickleball',
      'soccer', 'hockey', 'swimming', 'gym', 'fitness',
      'drop-in', 'open play', 'free play'
    ];

    const lowerText = text.toLowerCase();
    return sportsKeywords.some(keyword => lowerText.includes(keyword));
  }

  extractSportFromTitle(title) {
    const sports = [
      'basketball', 'volleyball', 'badminton', 'pickleball',
      'soccer', 'hockey', 'swimming', 'tennis', 'football'
    ];

    const lowerTitle = title.toLowerCase();
    for (const sport of sports) {
      if (lowerTitle.includes(sport)) {
        return sport;
      }
    }

    return 'other';
  }
}

module.exports = CommunityScraper;