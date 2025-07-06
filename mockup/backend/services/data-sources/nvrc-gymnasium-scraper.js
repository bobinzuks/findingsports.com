const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');

class NVRCGymnasiumScraper {
    constructor() {
        this.baseUrl = 'https://www.nvrc.ca';
        this.facilitiesUrl = '/facilities-fields/locations-hours/gymnasiums';
        this.csvPath = path.join(__dirname, '../../data/nvrc-dropin-schedule.csv');
    }

    async scrapeGymnasiumSchedules() {
        try {
            console.log('Fetching NVRC gymnasium schedules...');
            const response = await axios.get(this.baseUrl + this.facilitiesUrl);
            const $ = cheerio.load(response.data);

            const schedules = [];
            const dropInGames = [];

            // Similar to Rust script - find facility titles and hours
            $('.facility-item, .location-item, .gym-facility').each((index, element) => {
                const $elem = $(element);

                // Try multiple selectors for facility names
                const facilityName = $elem.find('.facility-title, .location-name, h3, h4').first().text().trim() ||
                                   $elem.find('strong').first().text().trim();

                // Try multiple selectors for schedules
                const scheduleText = $elem.find('.facility-hours, .schedule-text, .hours-info').text().trim() ||
                                   $elem.find('p').text().trim();

                if (facilityName && scheduleText) {
                    schedules.push({
                        centre: facilityName,
                        schedule: scheduleText
                    });

                    // Parse for drop-in activities
                    const dropInActivities = this.parseDropInActivities(facilityName, scheduleText);
                    dropInGames.push(...dropInActivities);
                }
            });

            // Also check for table-based schedules
            $('table.schedule-table, table.gym-schedule').each((index, table) => {
                const $table = $(table);
                const facilityName = $table.prev('h3, h4').text().trim() ||
                                   $table.closest('.facility-section').find('.facility-name').text().trim();

                $table.find('tr').each((rowIndex, row) => {
                    const $row = $(row);
                    const cells = $row.find('td');

                    if (cells.length >= 2) {
                        const activity = $(cells[0]).text().trim();
                        const time = $(cells[1]).text().trim();

                        if (this.isDropInActivity(activity)) {
                            const dropInGame = this.parseTableRow(facilityName, activity, time, $row);
                            if (dropInGame) {
                                dropInGames.push(dropInGame);
                            }
                        }
                    }
                });
            });

            // Save to CSV like the Rust script
            await this.saveToCSV(schedules);

            // Also save parsed drop-in games
            await this.saveDropInGames(dropInGames);

            console.log(`Found ${schedules.length} facility schedules`);
            console.log(`Found ${dropInGames.length} drop-in activities`);

            return {
                schedules,
                dropInGames,
                scrapedAt: new Date()
            };
        } catch (error) {
            console.error('Error scraping NVRC gymnasiums:', error);
            throw error;
        }
    }

    parseDropInActivities(facility, scheduleText) {
        const activities = [];
        const lines = scheduleText.split(/\n|;|,/);

        // Keywords indicating drop-in activities
        const dropInKeywords = [
            'drop-in', 'drop in', 'dropin',
            'open gym', 'public', 'all ages',
            'casual', 'recreational', 'free play'
        ];

        // Sport keywords
        const sportKeywords = {
            basketball: ['basketball', 'hoops', 'bball'],
            volleyball: ['volleyball', 'vball'],
            badminton: ['badminton'],
            pickleball: ['pickleball', 'pickle ball'],
            soccer: ['soccer', 'futsal', 'football'],
            'floor hockey': ['floor hockey', 'hockey']
        };

        lines.forEach(line => {
            const lowerLine = line.toLowerCase();

            // Check if it's a drop-in activity
            const isDropIn = dropInKeywords.some(keyword => lowerLine.includes(keyword));
            if (!isDropIn) { return; }

            // Identify the sport
            let sport = 'general';
            for (const [sportName, keywords] of Object.entries(sportKeywords)) {
                if (keywords.some(keyword => lowerLine.includes(keyword))) {
                    sport = sportName;
                    break;
                }
            }

            // Parse time information
            const timeMatch = line.match(/(\d{1,2}:\d{2}\s*[ap]m\s*-\s*\d{1,2}:\d{2}\s*[ap]m)/i) ||
                            line.match(/(\d{1,2}\s*[ap]m\s*-\s*\d{1,2}\s*[ap]m)/i);

            // Parse day information
            const dayMatch = line.match(/(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)/i);

            if (timeMatch || dayMatch) {
                activities.push({
                    facility,
                    sport,
                    type: 'drop-in',
                    description: line.trim(),
                    time: timeMatch ? timeMatch[1] : null,
                    day: dayMatch ? dayMatch[1] : null,
                    source: 'NVRC Gymnasiums',
                    venueType: 'community-center'
                });
            }
        });

        return activities;
    }

    parseTableRow(facility, activity, time, $row) {
        const $ = cheerio.load($row.html());

        // Extract additional info from the row
        const day = $row.find('.day-column').text().trim() ||
                   $row.prev('tr').find('.day-header').text().trim();

        const cost = $row.find('.cost-column').text().trim() || 'Free';
        const ages = $row.find('.ages-column').text().trim() || 'All ages';

        // Determine sport from activity name
        let sport = 'general';
        const activityLower = activity.toLowerCase();

        if (activityLower.includes('basketball')) { sport = 'basketball'; } else if (activityLower.includes('volleyball')) { sport = 'volleyball'; } else if (activityLower.includes('badminton')) { sport = 'badminton'; } else if (activityLower.includes('pickleball')) { sport = 'pickleball'; } else if (activityLower.includes('soccer') || activityLower.includes('futsal')) { sport = 'soccer'; }

        return {
            facility,
            sport,
            type: 'drop-in',
            title: activity,
            time,
            day,
            cost,
            ages,
            source: 'NVRC Gymnasiums',
            venueType: 'community-center'
        };
    }

    isDropInActivity(text) {
        const dropInPatterns = [
            /drop[\s-]?in/i,
            /open\s+gym/i,
            /public\s+\w+/i,
            /recreational\s+\w+/i,
            /casual\s+\w+/i,
            /all\s+ages/i
        ];

        return dropInPatterns.some(pattern => pattern.test(text));
    }

    async saveToCSV(schedules) {
        try {
            // Ensure data directory exists
            const dataDir = path.dirname(this.csvPath);
            await fs.mkdir(dataDir, { recursive: true });

            // Create CSV content similar to Rust script
            let csvContent = 'Centre,Schedule\n';

            schedules.forEach(({ centre, schedule }) => {
                // Escape quotes and commas in CSV
                const escapedCentre = centre.includes(',') || centre.includes('"') ?
                    `"${centre.replace(/"/g, '""')}"` :
                    centre;
                const escapedSchedule = schedule.includes(',') || schedule.includes('"') ?
                    `"${schedule.replace(/"/g, '""')}"` :
                    schedule;

                csvContent += `${escapedCentre},${escapedSchedule}\n`;
            });

            await fs.writeFile(this.csvPath, csvContent);
            console.log(`Schedule saved to ${this.csvPath}`);
        } catch (error) {
            console.error('Error saving to CSV:', error);
        }
    }

    async saveDropInGames(games) {
        try {
            const jsonPath = path.join(path.dirname(this.csvPath), 'nvrc-dropin-games.json');
            await fs.writeFile(jsonPath, JSON.stringify(games, null, 2));
            console.log(`Drop-in games saved to ${jsonPath}`);
        } catch (error) {
            console.error('Error saving drop-in games:', error);
        }
    }

    // Additional method to check field availability
    async scrapeFieldAvailability() {
        try {
            const fieldsUrl = '/facilities-fields/locations-hours/sports-fields';
            const response = await axios.get(this.baseUrl + fieldsUrl);
            const $ = cheerio.load(response.data);

            const fields = [];

            $('.field-status, .field-item').each((index, element) => {
                const $elem = $(element);
                const fieldName = $elem.find('.field-name').text().trim();
                const status = $elem.find('.status').text().trim() || 'Unknown';
                const nextAvailable = $elem.find('.next-available').text().trim();

                if (fieldName) {
                    fields.push({
                        name: fieldName,
                        status,
                        nextAvailable,
                        type: 'outdoor-field',
                        lastChecked: new Date()
                    });
                }
            });

            return fields;
        } catch (error) {
            console.error('Error scraping field availability:', error);
            return [];
        }
    }
}

module.exports = NVRCGymnasiumScraper;
