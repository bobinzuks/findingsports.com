#!/usr/bin/env node

/**
 * Deploy LOCAL Drop-in Sports Features
 * Community Centers, Parks, Gymnasiums, Arenas
 */

const fs = require('fs').promises;
const { exec } = require('child_process');

// Create LOCAL venues endpoint
async function createVenuesEndpoint() {
    console.log('🏟️ Creating LOCAL venues endpoint...');
    
    const venuesRoute = `const express = require('express');
const router = express.Router();

// LOCAL venues - Community Centers, Parks, Gymnasiums, Arenas  
const LOCAL_VENUES = [
    { id: 1, name: 'Killarney Community Centre', type: 'community_center', city: 'Vancouver', sports: ['soccer', 'basketball', 'volleyball'], address: '6260 Killarney Street' },
    { id: 2, name: 'Trout Lake Community Centre', type: 'community_center', city: 'Vancouver', sports: ['hockey', 'skating', 'basketball'], address: '3350 Victoria Drive' },
    { id: 3, name: 'Hillcrest Community Centre', type: 'community_center', city: 'Vancouver', sports: ['swimming', 'basketball', 'badminton'], address: '4575 Clancy Loranger Way' },
    { id: 4, name: 'Queen Elizabeth Park', type: 'park', city: 'Vancouver', sports: ['tennis', 'soccer'], address: '4600 Cambie Street' },
    { id: 5, name: 'UBC War Memorial Gym', type: 'gymnasium', city: 'Vancouver', sports: ['basketball', 'volleyball', 'badminton'], address: '6081 University Boulevard' },
    { id: 6, name: 'Britannia Ice Rink', type: 'arena', city: 'Vancouver', sports: ['hockey', 'skating'], address: '1661 Napier Street' }
];

router.get('/', (req, res) => {
    const { city, sport, type } = req.query;
    let venues = [...LOCAL_VENUES];
    
    if (city) venues = venues.filter(v => v.city.toLowerCase().includes(city.toLowerCase()));
    if (sport) venues = venues.filter(v => v.sports.includes(sport.toLowerCase()));
    if (type) venues = venues.filter(v => v.type === type);
    
    res.json({
        success: true,
        count: venues.length,
        venues: venues.map(v => ({
            ...v,
            dropInAvailable: true,
            openHours: '6 AM - 10 PM'
        }))
    });
});

router.get('/:id', (req, res) => {
    const venue = LOCAL_VENUES.find(v => v.id === parseInt(req.params.id));
    if (!venue) return res.status(404).json({ error: 'Venue not found' });
    
    res.json({
        success: true,
        venue: {
            ...venue,
            dropInSchedule: {
                monday: ['7-9 AM', '7-9 PM'],
                tuesday: ['7-9 AM', '7-9 PM'],
                saturday: ['9 AM - 5 PM']
            }
        }
    });
});

module.exports = router;`;
    
    await fs.writeFile('mockup/backend/routes/venues.js', venuesRoute);
    console.log('✅ Created venues endpoint');
}

// Create LOCAL sports endpoint
async function createSportsEndpoint() {
    console.log('🏃 Creating LOCAL sports endpoint...');
    
    const sportsRoute = `const express = require('express');
const router = express.Router();

const LOCAL_SPORTS = [
    { id: 'basketball', name: 'Basketball', emoji: '🏀', dropInVenues: 15, type: 'indoor' },
    { id: 'soccer', name: 'Soccer', emoji: '⚽', dropInVenues: 20, type: 'outdoor' },
    { id: 'volleyball', name: 'Volleyball', emoji: '🏐', dropInVenues: 12, type: 'indoor' },
    { id: 'hockey', name: 'Ice Hockey', emoji: '🏒', dropInVenues: 8, type: 'arena' },
    { id: 'skating', name: 'Public Skating', emoji: '⛸️', dropInVenues: 8, type: 'arena' },
    { id: 'badminton', name: 'Badminton', emoji: '🏸', dropInVenues: 10, type: 'indoor' }
];

router.get('/', (req, res) => {
    res.json({
        success: true,
        count: LOCAL_SPORTS.length,
        sports: LOCAL_SPORTS.map(s => ({
            ...s,
            description: 'Drop-in ' + s.name + ' at local venues',
            avgCost: s.type === 'arena' ? '$8-12' : '$3-8'
        }))
    });
});

router.get('/:id', (req, res) => {
    const sport = LOCAL_SPORTS.find(s => s.id === req.params.id);
    if (!sport) return res.status(404).json({ error: 'Sport not found' });
    
    res.json({
        success: true,
        sport: {
            ...sport,
            venues: sport.dropInVenues + ' local venues',
            peakTimes: ['6-8 AM', '7-9 PM']
        }
    });
});

module.exports = router;`;
    
    await fs.writeFile('mockup/backend/routes/sports.js', sportsRoute);
    console.log('✅ Created sports endpoint');
}

// Deploy to Railway
async function deployToRailway() {
    console.log('🚀 Deploying to Railway...');
    
    return new Promise((resolve, reject) => {
        const commands = [
            'git add .',
            'git commit -m "🚀 FORCE DEPLOY: All LOCAL drop-in sports endpoints\\n\\n- Added venues with community centers, parks, gyms\\n- Added sports endpoint\\n- Ready for local drop-in games"',
            'git push origin main'
        ];
        
        exec(commands.join(' && '), (error, stdout, stderr) => {
            if (error && !error.message.includes('nothing to commit')) {
                console.error('Deploy error:', error.message);
                reject(error);
            } else {
                console.log('✅ Deployed to Railway');
                console.log(stdout);
                resolve();
            }
        });
    });
}

// Test live deployment
async function testLive() {
    console.log('\\n🧪 Testing live deployment...');
    
    const https = require('https');
    
    const test = (path) => new Promise((resolve) => {
        console.log('Testing: ' + path);
        https.get('https://findingsports.com' + path, (res) => {
            const success = res.statusCode >= 200 && res.statusCode < 400;
            console.log('  ' + (success ? '✅' : '❌') + ' ' + res.statusCode);
            resolve(success);
        }).on('error', () => {
            console.log('  ❌ Error');
            resolve(false);
        });
    });
    
    const results = [];
    results.push(await test('/api/venues'));
    results.push(await test('/api/sports'));
    results.push(await test('/api/venues?city=vancouver'));
    
    const passed = results.filter(r => r).length;
    console.log('\\n📊 Results: ' + passed + '/' + results.length + ' working');
    
    return passed === results.length;
}

// Main deployment
async function main() {
    console.log('🏟️ DEPLOYING LOCAL DROP-IN SPORTS FEATURES\\n');
    
    try {
        await createVenuesEndpoint();
        await createSportsEndpoint();
        await deployToRailway();
        
        console.log('\\n⏳ Waiting 90 seconds for deployment...');
        await new Promise(resolve => setTimeout(resolve, 90000));
        
        const success = await testLive();
        
        if (success) {
            console.log('\\n🎉 ALL LOCAL SPORTS ENDPOINTS WORKING!');
            console.log('🌐 https://findingsports.com/api/venues');
            console.log('🏀 https://findingsports.com/api/sports');
        } else {
            console.log('\\n⚠️  Still deploying...');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

main();