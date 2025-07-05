const BaseDataSource = require('./base-source');
const puppeteer = require('puppeteer');
const cheerio = require('cheerio');

class CommunityCenterScraper extends BaseDataSource {
    constructor() {
        super('community-centers', 'scrape');

        // List of Vancouver community centers with drop-in sports
        this.centers = [
            {
                name: 'Kerrisdale Community Centre',
                url: 'https://kerrisdalecc.com/programs/drop-in/',
                address: '5851 West Boulevard, Vancouver',
                coordinates: { lat: 49.2294, lng: -123.1559 }
            },
            {
                name: 'Killarney Community Centre',
                url: 'https://www.killarney.org/programs/adult-programs/drop-in-sports/',
                address: '6260 Killarney St, Vancouver',
                coordinates: { lat: 49.2297, lng: -123.042 }
            },
            {
                name: 'Trout Lake Community Centre',
                url: 'https://troutlakecc.ca/programs/adult-drop-in/',
                address: '3360 Victoria Dr, Vancouver',
                coordinates: { lat: 49.2572, lng: -123.0657 }
            },
            {
                name: 'Hillcrest Centre',
                url: 'https://vancouver.ca/parks-recreation-culture/hillcrest-centre.aspx',
                address: '4575 Clancy Loranger Way, Vancouver',
                coordinates: { lat: 49.2445, lng: -123.1089 }
            },
            {
                name: 'Mount Pleasant Community Centre',
                url: 'https://www.mountpleasantcc.ca/adults/drop-in-sports/',
                address: '1 Kingsway, Vancouver',
                coordinates: { lat: 49.2634, lng: -123.1006 }
            },
            {
                name: 'Sunset Community Centre',
                url: 'https://www.sunsetcc.ca/drop-in-schedules/',
                address: '6810 Main St, Vancouver',
                coordinates: { lat: 49.2109, lng: -123.1013 }
            }
        ];
    }

    async scrapeAllCenters() {
        const allGames = [];
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        try {
            for (const center of this.centers) {
                console.log(`Scraping ${center.name}...`);
                try {
                    const games = await this.scrapeCenter(browser, center);
                    allGames.push(...games);
                } catch (error) {
                    console.error(`Error scraping ${center.name}:`, error.message);
                    // Continue with other centers
                }
            }
        } finally {
            await browser.close();
        }

        this.lastUpdate = new Date();
        return allGames;
    }

    async scrapeCenter(browser, center) {
        const page = await browser.newPage();
        const games = [];

        try {
            // Set a reasonable timeout
            await page.goto(center.url, {
                waitUntil: 'networkidle2',
                timeout: 30000
            });

            // Get page content
            const content = await page.content();
            const $ = cheerio.load(content);

            // Try multiple selectors for drop-in schedules
            const scheduleSelectors = [
                '.drop-in-schedule',
                '.schedule-table',
                '.dropin-table',
                'table:contains("Drop")',
                'table:contains("drop")',
                '.program-schedule'
            ];

            let scheduleFound = false;

            for (const selector of scheduleSelectors) {
                const element = $(selector);
                if (element.length > 0) {
                    scheduleFound = true;
                    const extractedGames = this.parseScheduleTable($, element, center);
                    games.push(...extractedGames);
                    break;
                }
            }

            // If no table found, try to parse text content
            if (!scheduleFound) {
                const textGames = this.parseTextSchedule($, center);
                games.push(...textGames);
            }
        } catch (error) {
            console.error(`Page error for ${center.name}:`, error.message);
        } finally {
            await page.close();
        }

        return games;
    }

    parseScheduleTable($, table, center) {
        const games = [];
        const rows = $(table).find('tr');

        rows.each((index, row) => {
            const cells = $(row).find('td, th');
            if (cells.length >= 3 && index > 0) {
                // Skip header row
                const dayText = $(cells[0]).text().trim();
                const timeText = $(cells[1]).text().trim();
                const activityText = $(cells[2]).text().trim();

                // Check if it's a drop-in activity
                if (!this.isDropIn(activityText)) {
                    return; // Skip leagues and closed activities
                }

                const sport = this.extractSportFromText(activityText);
                if (sport) {
                    const gameData = this.createGameFromSchedule(dayText, timeText, sport, center, activityText);
                    if (gameData) {
                        games.push(gameData);
                    }
                }
            }
        });

        return games;
    }

    parseTextSchedule($, center) {
        const games = [];
        const content = $('body').text();

        // Look for patterns like "Basketball: Monday 7-9pm"
        const patterns = [
            /(\w+):\s*(\w+day)\s+(\d{1,2}(?::\d{2})?(?:\s*[ap]m)?)\s*[-–]\s*(\d{1,2}(?::\d{2})?(?:\s*[ap]m)?)/gi,
            /(\w+day)\s+(\d{1,2}(?::\d{2})?(?:\s*[ap]m)?)\s*[-–]\s*(\d{1,2}(?::\d{2})?(?:\s*[ap]m)?)\s*[-–]?\s*(\w+)/gi
        ];

        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                const sport = this.extractSportFromText(match[1] || match[4]);
                if (sport) {
                    const dayText = match[2] || match[1];
                    const startTime = match[3] || match[2];
                    const endTime = match[4] || match[3];

                    const gameData = this.createGameFromSchedule(
                        dayText,
                        `${startTime}-${endTime}`,
                        sport,
                        center,
                        match[0]
                    );
                    if (gameData) {
                        games.push(gameData);
                    }
                }
            }
        }

        return games;
    }

    extractSportFromText(text) {
        const sportKeywords = {
            basketball: ['basketball', 'hoops', 'bball'],
            volleyball: ['volleyball', 'vball'],
            badminton: ['badminton'],
            pickleball: ['pickleball', 'pickle ball'],
            soccer: ['soccer', 'futsal', 'indoor soccer'],
            hockey: ['floor hockey', 'ball hockey'],
            'table-tennis': ['table tennis', 'ping pong']
        };

        const lowerText = text.toLowerCase();

        for (const [sport, keywords] of Object.entries(sportKeywords)) {
            if (keywords.some(keyword => lowerText.includes(keyword))) {
                return sport;
            }
        }

        return null;
    }

    createGameFromSchedule(dayText, timeText, sport, center, rawText) {
        try {
            const nextDate = this.getNextDateForDay(dayText);
            const times = this.parseTimeRange(timeText);

            if (!nextDate || !times) {
                return null;
            }

            const startTime = new Date(nextDate);
            startTime.setHours(times.start.hours, times.start.minutes, 0, 0);

            const endTime = new Date(nextDate);
            endTime.setHours(times.end.hours, times.end.minutes, 0, 0);

            return this.normalize({
                title: `Drop-in ${this.normalizeSport(sport)}`,
                sport: this.normalizeSport(sport),
                type: 'drop-in',
                venue: {
                    name: center.name,
                    address: center.address,
                    coordinates: center.coordinates
                },
                startTime,
                endTime,
                recurring: {
                    enabled: true,
                    pattern: 'weekly',
                    dayOfWeek: dayText.toLowerCase()
                },
                cost: 0, // Most drop-ins are free or nominal fee
                capacity: {
                    min: 2,
                    max: null // Unknown
                },
                requirements: ['First come, first served', 'All skill levels welcome'],
                source: {
                    ...this.getSourceMeta(),
                    url: center.url,
                    rawText
                }
            });
        } catch (error) {
            console.error('Error creating game:', error);
            return null;
        }
    }

    getNextDateForDay(dayName) {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const today = new Date();
        const todayIndex = today.getDay();

        const targetDay = dayName.toLowerCase().replace(/s$/, ''); // Remove plural
        const targetIndex = days.findIndex(d => d.includes(targetDay));

        if (targetIndex === -1) {
            return null;
        }

        let daysUntilTarget = targetIndex - todayIndex;
        if (daysUntilTarget <= 0) {
            daysUntilTarget += 7;
        }

        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + daysUntilTarget);
        return targetDate;
    }

    parseTimeRange(timeStr) {
        // Parse "7:00pm - 9:00pm" or "19:00-21:00" format
        const match = timeStr.match(/(\d{1,2}(?::\d{2})?)\s*(?:am|pm)?\s*[-–]\s*(\d{1,2}(?::\d{2})?)\s*(?:am|pm)?/i);

        if (!match) {
            return null;
        }

        const parseTimeComponent = (timeComponent, isPM = false) => {
            const parts = timeComponent.split(':');
            let hours = parseInt(parts[0], 10);
            const minutes = parts[1] ? parseInt(parts[1], 10) : 0;

            // Handle PM times
            if (isPM && hours !== 12) {
                hours += 12;
            } else if (!isPM && hours === 12) {
                hours = 0;
            }

            return { hours, minutes };
        };

        const isPM = timeStr.toLowerCase().includes('pm');
        const start = parseTimeComponent(match[1], isPM);
        const end = parseTimeComponent(match[2], isPM);

        // If end time is before start time, assume it's PM
        if (end.hours < start.hours) {
            end.hours += 12;
        }

        return { start, end };
    }
}

module.exports = CommunityCenterScraper;
