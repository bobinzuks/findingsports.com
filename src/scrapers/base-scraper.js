const puppeteer = require('puppeteer');
const winston = require('winston');

class BaseScraper {
  constructor(config = {}) {
    this.config = {
      headless: true,
      timeout: 30000,
      retries: 3,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      ...config,
    };

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [new winston.transports.Console()],
    });

    this.browser = null;
  }

  async initialize() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: this.config.headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
        ],
      });
    }
  }

  async scrape(url, extractorFn) {
    await this.initialize();
    
    let retries = this.config.retries;
    let lastError;

    while (retries > 0) {
      const page = await this.browser.newPage();
      
      try {
        // Set user agent
        await page.setUserAgent(this.config.userAgent);
        
        // Set viewport
        await page.setViewport({ width: 1920, height: 1080 });
        
        // Navigate to page
        await page.goto(url, {
          waitUntil: 'networkidle2',
          timeout: this.config.timeout,
        });

        // Wait for content to load
        await this.waitForContent(page);

        // Extract data
        const data = await page.evaluate(extractorFn);
        
        await page.close();
        return data;
        
      } catch (error) {
        lastError = error;
        retries--;
        
        this.logger.warn(`Scraping failed for ${url}, retries left: ${retries}`, error);
        
        await page.close();
        
        if (retries > 0) {
          // Wait before retry
          await this.sleep(2000 * (this.config.retries - retries));
        }
      }
    }

    throw new Error(`Failed to scrape ${url} after ${this.config.retries} attempts: ${lastError.message}`);
  }

  async scrapeMultiple(urls, extractorFn, concurrency = 3) {
    await this.initialize();
    
    const results = [];
    const chunks = this.chunkArray(urls, concurrency);

    for (const chunk of chunks) {
      const chunkPromises = chunk.map(url => 
        this.scrape(url, extractorFn)
          .then(data => ({ url, success: true, data }))
          .catch(error => ({ url, success: false, error: error.message }))
      );

      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);
    }

    return results;
  }

  async waitForContent(page) {
    // Override in subclasses for specific wait conditions
    await page.waitForTimeout(1000);
  }

  async extractScheduleFromPDF(pdfUrl) {
    // Download and parse PDF
    const pdfParse = require('pdf-parse');
    const axios = require('axios');

    try {
      const response = await axios.get(pdfUrl, {
        responseType: 'arraybuffer',
      });

      const data = await pdfParse(response.data);
      return this.parseScheduleText(data.text);
    } catch (error) {
      this.logger.error(`Failed to parse PDF: ${pdfUrl}`, error);
      return null;
    }
  }

  parseScheduleText(text) {
    // Basic schedule parsing - override in subclasses for specific formats
    const lines = text.split('\n');
    const schedules = [];
    
    const timePattern = /(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)/gi;
    const dayPattern = /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (timePattern.test(line) && dayPattern.test(line)) {
        // Found a potential schedule line
        schedules.push({
          raw: line,
          parsed: this.parseScheduleLine(line),
        });
      }
    }

    return schedules;
  }

  parseScheduleLine(line) {
    // Override in subclasses for specific parsing logic
    return {
      text: line,
      times: line.match(/(\d{1,2}):(\d{2})\s*(am|pm|AM|PM)/gi),
      days: line.match(/(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi),
    };
  }

  normalizeAddress(address) {
    if (!address) return null;
    
    return address
      .replace(/\s+/g, ' ')
      .replace(/,\s*,/g, ',')
      .trim();
  }

  parseTimeString(timeStr, referenceDate = new Date()) {
    // Parse various time formats
    const formats = [
      /(\d{1,2}):(\d{2})\s*(am|pm)/i,
      /(\d{1,2})\s*(am|pm)/i,
      /(\d{1,2})h(\d{2})/i,
    ];

    for (const format of formats) {
      const match = timeStr.match(format);
      if (match) {
        let hours = parseInt(match[1]);
        const minutes = parseInt(match[2] || 0);
        const meridiem = match[3];

        if (meridiem) {
          if (meridiem.toLowerCase() === 'pm' && hours !== 12) {
            hours += 12;
          } else if (meridiem.toLowerCase() === 'am' && hours === 12) {
            hours = 0;
          }
        }

        const date = new Date(referenceDate);
        date.setHours(hours, minutes, 0, 0);
        return date;
      }
    }

    return null;
  }

  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

module.exports = BaseScraper;