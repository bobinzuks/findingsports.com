const BaseDataSource = require('./base-source');
const fetch = require('node-fetch');

class VancouverOpenDataSource extends BaseDataSource {
    constructor() {
        super('vancouver-open-data', 'api');
        this.baseUrl = 'https://opendata.vancouver.ca/api/v2';
        this.datasets = {
            // Parks facilities dataset
            parksFacilities: 'parks-facilities-2024',
            // Community centers
            communityCenters: 'community-centres',
            // Recreation features
            recreationFeatures: 'parks-recreation-features'
        };
    }

    async getFacilities() {
        try {
            const facilities = [];

            // Get parks with sports facilities
            const parksData = await this.fetchDataset(this.datasets.parksFacilities);

            for (const record of parksData) {
                const fields = record.fields || record;

                // Check if facility has sports features
                const sportsFacilities = this.extractSportsFacilities(fields);
                if (sportsFacilities.length > 0) {
                    facilities.push({
                        id: fields.parkid || fields.park_id,
                        name: fields.name || fields.park_name,
                        address: fields.streetaddress || fields.street_address,
                        coordinates: this.extractCoordinates(fields),
                        features: sportsFacilities,
                        raw: fields
                    });
                }
            }

            // Get community centers
            const centersData = await this.fetchDataset(this.datasets.communityCenters);

            for (const record of centersData) {
                const fields = record.fields || record;
                facilities.push({
                    id: `cc_${fields.id || fields.centre_id}`,
                    name: fields.name || fields.centre_name,
                    address: fields.address,
                    coordinates: this.extractCoordinates(fields),
                    features: ['community-center'],
                    type: 'community-center',
                    raw: fields
                });
            }

            this.lastUpdate = new Date();
            return facilities;
        } catch (error) {
            console.error('Error fetching Vancouver Open Data:', error);
            throw error;
        }
    }

    async fetchDataset(dataset) {
        const url = `${this.baseUrl}/catalog/datasets/${dataset}/records?limit=100`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (data.records) {
                return data.records;
            } else if (Array.isArray(data)) {
                return data;
            } else {
                console.warn(`Unexpected data format for dataset ${dataset}:`, data);
                return [];
            }
        } catch (error) {
            console.error(`Error fetching dataset ${dataset}:`, error);
            return [];
        }
    }

    extractSportsFacilities(fields) {
        const facilities = [];
        const sportsKeywords = {
            basketball: ['basketball', 'basketball court', 'basketball_court'],
            tennis: ['tennis', 'tennis court', 'tennis_court'],
            soccer: ['soccer', 'soccer field', 'soccer_field', 'football'],
            baseball: ['baseball', 'baseball diamond', 'baseball_diamond'],
            volleyball: ['volleyball', 'volleyball court', 'beach volleyball'],
            hockey: ['hockey', 'ice rink', 'hockey rink'],
            swimming: ['pool', 'swimming pool', 'aquatic'],
            fitness: ['fitness centre', 'gym', 'weight room']
        };

        // Check various facility fields
        const facilityFields = [
            fields.facilities,
            fields.features,
            fields.facility_type,
            fields.specialfeatures,
            fields.special_features
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

        for (const [sport, keywords] of Object.entries(sportsKeywords)) {
            if (keywords.some(keyword => facilityFields.includes(keyword))) {
                facilities.push(sport);
            }
        }

        return facilities;
    }

    extractCoordinates(fields) {
        // Try different coordinate field names
        if (fields.geom && fields.geom.coordinates) {
            return {
                lng: fields.geom.coordinates[0],
                lat: fields.geom.coordinates[1]
            };
        }

        if (fields.googlemapdest) {
            const coords = fields.googlemapdest.split(',').map(c => parseFloat(c.trim()));
            if (coords.length === 2) {
                return { lat: coords[0], lng: coords[1] };
            }
        }

        if (fields.latitude && fields.longitude) {
            return {
                lat: parseFloat(fields.latitude),
                lng: parseFloat(fields.longitude)
            };
        }

        if (fields.lat && fields.lon) {
            return {
                lat: parseFloat(fields.lat),
                lng: parseFloat(fields.lon)
            };
        }

        return null;
    }

    // Note: Vancouver Open Data doesn't provide schedule information
    // This would need to be combined with other sources
    normalize(facility) {
        return {
            venue: {
                id: facility.id,
                name: facility.name,
                address: facility.address,
                coordinates: facility.coordinates,
                type: facility.type || 'park',
                features: facility.features
            },
            source: {
                ...this.getSourceMeta(),
                url: 'https://opendata.vancouver.ca/',
                note: 'Facility data only - no schedules'
            }
        };
    }

    // Get all sports venues in Vancouver
    async getSportsVenues() {
        const facilities = await this.getFacilities();

        return facilities.map(f => this.normalize(f));
    }
}

module.exports = VancouverOpenDataSource;
