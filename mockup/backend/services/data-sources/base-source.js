// Base class for all data sources
class BaseDataSource {
    constructor(name, type) {
        this.name = name;
        this.type = type; // 'api', 'scrape', 'user'
        this.lastUpdate = null;
        this.reliability = 1.0;
    }

    // Convert raw data to normalized schema
    normalize(rawData) {
        throw new Error('normalize() must be implemented by subclass');
    }

    // Validate normalized data
    validate(data) {
        const required = ['title', 'sport', 'venue', 'startTime'];
        for (const field of required) {
            if (!data[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        // Validate coordinates
        if (data.venue.coordinates) {
            const { lat, lng } = data.venue.coordinates;
            if (typeof lat !== 'number' || typeof lng !== 'number') {
                throw new Error('Invalid coordinates');
            }
            if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
                throw new Error('Coordinates out of range');
            }
        }

        return true;
    }

    // Filter out league/closed games
    isDropIn(text) {
        const dropInKeywords = [
            'drop-in',
            'dropin',
            'drop in',
            'open play',
            'open gym',
            'public',
            'casual',
            'pickup',
            'pick-up',
            'free play',
            'all welcome',
            'no registration',
            'first come'
        ];
        const leagueKeywords = [
            'league',
            'team',
            'club',
            'members only',
            'registration required',
            'tryouts',
            'season',
            'tournament',
            'closed',
            'private',
            'membership',
            'roster'
        ];

        const lowerText = text.toLowerCase();

        // Check for league indicators
        if (leagueKeywords.some(keyword => lowerText.includes(keyword))) {
            // But allow if it explicitly says drop-in league
            if (!dropInKeywords.some(keyword => lowerText.includes(keyword))) {
                return false;
            }
        }

        // Prefer explicit drop-in mentions
        if (dropInKeywords.some(keyword => lowerText.includes(keyword))) {
            return true;
        }

        // Default to true for community center activities without league keywords
        return true;
    }

    // Common sport name normalization
    normalizeSport(sport) {
        const sportMap = {
            basketball: ['basketball', 'bball', 'hoops', '🏀'],
            soccer: ['soccer', 'football', 'futsal', 'indoor soccer', '⚽'],
            volleyball: ['volleyball', 'vball', 'beach volleyball', '🏐'],
            badminton: ['badminton', 'shuttlecock', '🏸'],
            tennis: ['tennis', '🎾'],
            hockey: ['hockey', 'ice hockey', 'floor hockey', 'ball hockey', '🏒'],
            pickleball: ['pickleball', 'pickle ball'],
            squash: ['squash', 'racquetball'],
            'table-tennis': ['table tennis', 'ping pong', 'table-tennis'],
            ultimate: ['ultimate', 'ultimate frisbee', 'frisbee']
        };

        const lowerSport = sport.toLowerCase().trim();

        for (const [normalized, variations] of Object.entries(sportMap)) {
            if (variations.some(v => lowerSport.includes(v))) {
                return normalized;
            }
        }

        return lowerSport; // Return as-is if not found
    }

    // Parse time strings
    parseTime(timeStr, baseDate = new Date()) {
        // Handle various time formats
        // "7:00 PM", "19:00", "7pm", etc.
        const cleaned = timeStr.replace(/\s+/g, ' ').trim();

        // Try different patterns
        const patterns = [/(\d{1,2}):(\d{2})\s*(am|pm)/i, /(\d{1,2})\s*(am|pm)/i, /(\d{1,2}):(\d{2})/];

        for (const pattern of patterns) {
            const match = cleaned.match(pattern);
            if (match) {
                let hours = parseInt(match[1], 10);
                const minutes = parseInt(match[2] || '0', 10);
                const period = match[3];

                if (period) {
                    if (period.toLowerCase() === 'pm' && hours !== 12) {
                        hours += 12;
                    } else if (period.toLowerCase() === 'am' && hours === 12) {
                        hours = 0;
                    }
                }

                const date = new Date(baseDate);
                date.setHours(hours, minutes, 0, 0);
                return date;
            }
        }

        throw new Error(`Unable to parse time: ${timeStr}`);
    }

    // Calculate reliability score based on data completeness
    calculateReliability(data) {
        let score = 1.0;
        const penalties = {
            missingEndTime: 0.1,
            missingCapacity: 0.1,
            missingCoordinates: 0.2,
            missingOrganizer: 0.1,
            oldData: 0.2
        };

        if (!data.endTime) {
            score -= penalties.missingEndTime;
        }
        if (!data.capacity?.max) {
            score -= penalties.missingCapacity;
        }
        if (!data.venue?.coordinates) {
            score -= penalties.missingCoordinates;
        }
        if (!data.organizer?.name) {
            score -= penalties.missingOrganizer;
        }

        // Penalize old data
        if (data.source?.lastUpdated) {
            const age = Date.now() - new Date(data.source.lastUpdated).getTime();
            const daysOld = age / (1000 * 60 * 60 * 24);
            if (daysOld > 7) {
                score -= penalties.oldData;
            }
        }

        return Math.max(0, Math.min(1, score));
    }

    // Get source metadata
    getSourceMeta() {
        return {
            type: this.type,
            name: this.name,
            lastUpdated: this.lastUpdate,
            reliability: this.reliability
        };
    }
}

module.exports = BaseDataSource;
