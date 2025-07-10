const BaseDataSource = require('./base-source');
const fetch = require('node-fetch');
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

        // For now, return sample data to demonstrate the pipeline is working
        // In production, this would actually scrape the websites
        const sampleGames = [
            {
                title: 'Drop-in Basketball',
                sport: 'basketball',
                venue: {
                    name: 'Hillcrest Centre',
                    address: '4575 Clancy Loranger Way, Vancouver',
                    coordinates: { lat: 49.2445, lng: -123.1089 }
                },
                startTime: this.getNextDayTime(1, 18, 0), // Next Monday 6pm
                endTime: this.getNextDayTime(1, 20, 0), // 8pm
                capacity: { max: 20 },
                requirements: ['Indoor shoes required'],
                source: {
                    name: 'Hillcrest Centre',
                    type: 'community-center',
                    lastUpdated: new Date()
                },
                isIndoor: true,
                recurring: {
                    enabled: true,
                    frequency: 'weekly',
                    days: ['monday']
                }
            },
            {
                title: 'Drop-in Tennis',
                sport: 'tennis',
                venue: {
                    name: 'Kitsilano Beach Tennis Courts',
                    address: '1499 Arbutus St, Vancouver',
                    coordinates: { lat: 49.2738, lng: -123.1531 }
                },
                startTime: this.getNextDayTime(0, 9, 0), // Next Sunday 9am
                endTime: this.getNextDayTime(0, 11, 0), // 11am
                capacity: { max: 8 },
                requirements: ['Bring your own racquet', 'First come first served'],
                source: {
                    name: 'Vancouver Parks',
                    type: 'community-center',
                    lastUpdated: new Date()
                },
                isIndoor: false,
                recurring: {
                    enabled: true,
                    frequency: 'weekly',
                    days: ['sunday']
                }
            },
            {
                title: 'Drop-in Floor Hockey',
                sport: 'hockey',
                venue: {
                    name: 'Douglas Park Community Centre',
                    address: '801 West 22nd Ave, Vancouver',
                    coordinates: { lat: 49.2520, lng: -123.1235 }
                },
                startTime: this.getNextDayTime(5, 19, 30), // Next Friday 7:30pm
                endTime: this.getNextDayTime(5, 21, 0), // 9pm
                capacity: { max: 30 },
                requirements: ['Stick and gloves required', '$3 drop-in fee'],
                source: {
                    name: 'Douglas Park CC',
                    type: 'community-center',
                    lastUpdated: new Date()
                },
                isIndoor: true,
                recurring: {
                    enabled: true,
                    frequency: 'weekly',
                    days: ['friday']
                }
            },
            {
                title: 'Drop-in Soccer',
                sport: 'soccer',
                venue: {
                    name: 'Kerrisdale Community Centre',
                    address: '5851 West Boulevard, Vancouver',
                    coordinates: { lat: 49.2294, lng: -123.1559 }
                },
                startTime: this.getNextDayTime(3, 19, 0), // Next Wednesday 7pm
                endTime: this.getNextDayTime(3, 21, 0), // 9pm
                capacity: { max: 30 },
                requirements: ['All skill levels welcome'],
                source: {
                    name: 'Kerrisdale CC',
                    type: 'community-center',
                    lastUpdated: new Date()
                },
                isIndoor: true,
                recurring: {
                    enabled: true,
                    frequency: 'weekly',
                    days: ['wednesday']
                }
            },
            {
                title: 'Drop-in Volleyball',
                sport: 'volleyball',
                venue: {
                    name: 'Mount Pleasant Community Centre',
                    address: '1 Kingsway, Vancouver',
                    coordinates: { lat: 49.2634, lng: -123.1006 }
                },
                startTime: this.getNextDayTime(2, 20, 0), // Next Tuesday 8pm
                endTime: this.getNextDayTime(2, 22, 0), // 10pm
                capacity: { max: 16 },
                requirements: ['$5 drop-in fee'],
                source: {
                    name: 'Mount Pleasant CC',
                    type: 'community-center',
                    lastUpdated: new Date()
                },
                isIndoor: true,
                recurring: {
                    enabled: true,
                    frequency: 'weekly',
                    days: ['tuesday']
                }
            },
            {
                title: 'Drop-in Badminton',
                sport: 'badminton',
                venue: {
                    name: 'Trout Lake Community Centre',
                    address: '3360 Victoria Dr, Vancouver',
                    coordinates: { lat: 49.2572, lng: -123.0657 }
                },
                startTime: this.getNextDayTime(4, 18, 30), // Next Thursday 6:30pm
                endTime: this.getNextDayTime(4, 20, 30), // 8:30pm
                capacity: { max: 24 },
                requirements: ['Bring your own racquet', '$4 drop-in fee'],
                source: {
                    name: 'Trout Lake CC',
                    type: 'community-center',
                    lastUpdated: new Date()
                },
                isIndoor: true,
                recurring: {
                    enabled: true,
                    frequency: 'weekly',
                    days: ['thursday']
                }
            }
        ];

        // TODO: Implement actual web scraping here
        // For each center:
        // 1. Fetch the HTML content
        // 2. Parse with cheerio
        // 3. Extract drop-in schedules
        // 4. Convert to standardized game format

        this.lastUpdate = new Date();
        return sampleGames;
    }

    // Helper to get next occurrence of a weekday
    getNextDayTime(dayOfWeek, hour, minute) {
        const date = new Date();
        const currentDay = date.getDay();
        const daysUntilTarget = (dayOfWeek - currentDay + 7) % 7 || 7;
        date.setDate(date.getDate() + daysUntilTarget);
        date.setHours(hour, minute, 0, 0);
        return date;
    }

    // Future implementation for actual scraping
    async scrapeCenter(center) {
        // This would be implemented to actually fetch and parse the website
        // For now, it's a placeholder
        return [];
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
