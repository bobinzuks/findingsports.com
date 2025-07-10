const fetch = require('node-fetch');
const cheerio = require('cheerio');
const https = require('https');

// Create agent that ignores SSL errors for testing
const httpsAgent = new https.Agent({
    rejectUnauthorized: false
});

/**
 * Test Vancouver recreation data with corrected endpoints
 */

// Test 1: Mock Vancouver Community Center Data
async function getMockVancouverData() {
    console.log('\n🏢 Mock Vancouver Community Centers Data:\n');
    
    const mockCenters = [
        {
            name: "Hillcrest Community Centre",
            address: "4575 Clancy Loranger Way, Vancouver",
            coordinates: { lat: 49.2435, lng: -123.1089 },
            dropInActivities: [
                {
                    sport: "basketball",
                    type: "drop-in",
                    schedule: "Monday & Wednesday 7:00-9:00 PM",
                    cost: "$5.50",
                    ageGroup: "Adult (19+)"
                },
                {
                    sport: "volleyball",
                    type: "drop-in", 
                    schedule: "Tuesday & Thursday 7:00-9:00 PM",
                    cost: "$5.50",
                    ageGroup: "Adult (19+)"
                }
            ]
        },
        {
            name: "Kerrisdale Community Centre",
            address: "5851 West Boulevard, Vancouver",
            coordinates: { lat: 49.2344, lng: -123.1597 },
            dropInActivities: [
                {
                    sport: "badminton",
                    type: "drop-in",
                    schedule: "Friday 10:00 AM-12:00 PM",
                    cost: "$4.50",
                    ageGroup: "All Ages"
                }
            ]
        },
        {
            name: "Killarney Community Centre", 
            address: "6260 Killarney Street, Vancouver",
            coordinates: { lat: 49.2292, lng: -123.0465 },
            dropInActivities: [
                {
                    sport: "basketball",
                    type: "drop-in",
                    schedule: "Saturday 2:00-4:00 PM",
                    cost: "$3.50",
                    ageGroup: "Youth (13-18)"
                },
                {
                    sport: "soccer",
                    type: "drop-in indoor",
                    schedule: "Sunday 10:00 AM-12:00 PM", 
                    cost: "$5.50",
                    ageGroup: "Adult (19+)"
                }
            ]
        }
    ];
    
    mockCenters.forEach((center, index) => {
        console.log(`${index + 1}. ${center.name}`);
        console.log(`   📍 ${center.address}`);
        console.log(`   🎯 Drop-in Activities:`);
        center.dropInActivities.forEach(activity => {
            console.log(`      - ${activity.sport} (${activity.ageGroup})`);
            console.log(`        ${activity.schedule} - ${activity.cost}`);
        });
        console.log();
    });
    
    return mockCenters;
}

// Test 2: Mock NVRC (North Vancouver) Data
async function getMockNVRCData() {
    console.log('\n🏊 Mock NVRC Drop-in Schedule Data:\n');
    
    const nvrcData = [
        {
            facility: "Harry Jerome Community Recreation Centre",
            address: "123 23rd St E, North Vancouver",
            activities: [
                {
                    sport: "basketball",
                    type: "drop-in",
                    day: "Monday",
                    time: "7:00 PM - 9:00 PM",
                    cost: "$6.75",
                    level: "All Levels"
                },
                {
                    sport: "pickleball",
                    type: "drop-in",
                    day: "Wednesday", 
                    time: "10:00 AM - 12:00 PM",
                    cost: "$5.50",
                    level: "Beginner/Intermediate"
                },
                {
                    sport: "public skating",
                    type: "drop-in",
                    day: "Saturday",
                    time: "2:00 PM - 4:00 PM", 
                    cost: "$5.50 Adult, $3.75 Child",
                    level: "All Ages"
                }
            ]
        },
        {
            facility: "Karen Magnussen Community Recreation Centre",
            address: "2300 Kirkstone Rd, North Vancouver",
            activities: [
                {
                    sport: "swimming",
                    type: "lane swim",
                    day: "Daily",
                    time: "6:00 AM - 8:00 AM",
                    cost: "$6.75",
                    level: "All Levels"
                },
                {
                    sport: "volleyball",
                    type: "drop-in",
                    day: "Thursday",
                    time: "7:30 PM - 9:30 PM",
                    cost: "$6.75", 
                    level: "Intermediate/Advanced"
                }
            ]
        }
    ];
    
    nvrcData.forEach(facility => {
        console.log(`📍 ${facility.facility}`);
        console.log(`   ${facility.address}`);
        console.log(`   Activities:`);
        facility.activities.forEach(activity => {
            console.log(`   🏃 ${activity.sport} - ${activity.day} ${activity.time}`);
            console.log(`      Cost: ${activity.cost} | Level: ${activity.level}`);
        });
        console.log();
    });
    
    return nvrcData;
}

// Test 3: Mock Field Status Data
async function getMockFieldStatus() {
    console.log('\n⚽ Mock Vancouver Field Status:\n');
    
    const fieldStatus = [
        {
            park: "Trout Lake Park",
            fields: [
                {
                    name: "Field 1 (Soccer)",
                    status: "OPEN",
                    condition: "Good - Playable",
                    notes: "Minor wear in goal areas"
                },
                {
                    name: "Field 2 (All Purpose)", 
                    status: "CLOSED",
                    condition: "Poor - Standing Water",
                    notes: "Closed due to rain"
                }
            ]
        },
        {
            park: "Memorial South Park",
            fields: [
                {
                    name: "Soccer Field A",
                    status: "OPEN",
                    condition: "Fair - Use Caution", 
                    notes: "Muddy in corners"
                }
            ]
        },
        {
            park: "Kerrisdale Centennial Park",
            fields: [
                {
                    name: "Baseball Diamond 1",
                    status: "OPEN",
                    condition: "Good",
                    notes: "Recently maintained"
                },
                {
                    name: "Tennis Courts 1-4",
                    status: "OPEN", 
                    condition: "Excellent",
                    notes: "First come, first served"
                }
            ]
        }
    ];
    
    console.log(`Last Updated: ${new Date().toLocaleString()}\n`);
    
    fieldStatus.forEach(park => {
        console.log(`🌳 ${park.park}`);
        park.fields.forEach(field => {
            const statusEmoji = field.status === 'OPEN' ? '✅' : '❌';
            console.log(`   ${statusEmoji} ${field.name}: ${field.status}`);
            console.log(`      Condition: ${field.condition}`);
            if (field.notes) {
                console.log(`      Notes: ${field.notes}`);
            }
        });
        console.log();
    });
    
    return fieldStatus;
}

// Test 4: Mock Ice Arena Schedule
async function getMockIceArenaData() {
    console.log('\n🏒 Mock Ice Arena Schedules:\n');
    
    const iceSchedules = [
        {
            arena: "Killarney Ice Rink",
            address: "6260 Killarney St, Vancouver",
            schedule: [
                {
                    type: "Public Skate",
                    day: "Saturday",
                    time: "2:00 PM - 4:00 PM",
                    cost: "$5.50 Adult, $3.75 Child"
                },
                {
                    type: "Shinny Hockey (Drop-in)",
                    day: "Sunday", 
                    time: "5:00 PM - 6:30 PM",
                    cost: "$8.00",
                    note: "Full equipment required"
                }
            ]
        },
        {
            arena: "Britannia Ice Rink",
            address: "1661 Napier St, Vancouver",
            schedule: [
                {
                    type: "Adult Hockey Drop-in",
                    day: "Tuesday",
                    time: "12:00 PM - 1:30 PM", 
                    cost: "$10.00",
                    note: "19+ only"
                },
                {
                    type: "Family Skate",
                    day: "Sunday",
                    time: "1:00 PM - 3:00 PM",
                    cost: "$4.50 per person"
                }
            ]
        }
    ];
    
    iceSchedules.forEach(arena => {
        console.log(`🏟️ ${arena.arena}`);
        console.log(`   ${arena.address}`);
        arena.schedule.forEach(session => {
            console.log(`   ⛸️ ${session.type}`);
            console.log(`      ${session.day} ${session.time} - ${session.cost}`);
            if (session.note) {
                console.log(`      Note: ${session.note}`);
            }
        });
        console.log();
    });
    
    return iceSchedules;
}

// Test 5: Aggregate all data into unified format
async function getAggregatedData() {
    console.log('\n📊 Aggregated Drop-in Sports Data:\n');
    
    const allActivities = [];
    
    // Add community center activities
    const centers = await getMockVancouverData();
    centers.forEach(center => {
        center.dropInActivities.forEach(activity => {
            allActivities.push({
                id: `${center.name.toLowerCase().replace(/\s+/g, '-')}-${activity.sport}`,
                sport: activity.sport,
                type: activity.type,
                venue: {
                    name: center.name,
                    address: center.address,
                    coordinates: center.coordinates
                },
                schedule: activity.schedule,
                cost: activity.cost,
                ageGroup: activity.ageGroup,
                source: 'vancouver-community-centers'
            });
        });
    });
    
    // Add NVRC activities
    const nvrcData = await getMockNVRCData();
    nvrcData.forEach(facility => {
        facility.activities.forEach(activity => {
            allActivities.push({
                id: `${facility.facility.toLowerCase().replace(/\s+/g, '-')}-${activity.sport}`,
                sport: activity.sport,
                type: activity.type,
                venue: {
                    name: facility.facility,
                    address: facility.address
                },
                schedule: `${activity.day} ${activity.time}`,
                cost: activity.cost,
                skillLevel: activity.level,
                source: 'nvrc'
            });
        });
    });
    
    // Sort by sport
    allActivities.sort((a, b) => a.sport.localeCompare(b.sport));
    
    console.log(`Total Drop-in Activities Found: ${allActivities.length}\n`);
    
    // Group by sport
    const bySport = {};
    allActivities.forEach(activity => {
        if (!bySport[activity.sport]) {
            bySport[activity.sport] = [];
        }
        bySport[activity.sport].push(activity);
    });
    
    Object.keys(bySport).sort().forEach(sport => {
        console.log(`\n🏃 ${sport.toUpperCase()} (${bySport[sport].length} locations)`);
        console.log('-'.repeat(50));
        bySport[sport].forEach(activity => {
            console.log(`📍 ${activity.venue.name}`);
            console.log(`   ${activity.schedule} - ${activity.cost}`);
            if (activity.ageGroup) console.log(`   Age: ${activity.ageGroup}`);
            if (activity.skillLevel) console.log(`   Level: ${activity.skillLevel}`);
        });
    });
    
    return allActivities;
}

// Run all tests
async function runAllTests() {
    console.log('🚀 Vancouver/North Vancouver Recreation Data Collection\n');
    console.log('=' .repeat(60));
    
    // Run tests sequentially to show organized output
    await getMockVancouverData();
    console.log('-'.repeat(60));
    
    await getMockNVRCData();
    console.log('-'.repeat(60));
    
    await getMockFieldStatus();
    console.log('-'.repeat(60));
    
    await getMockIceArenaData();
    console.log('-'.repeat(60));
    
    const aggregated = await getAggregatedData();
    
    console.log('\n\n✅ Data Collection Summary:');
    console.log('=' .repeat(60));
    console.log(`Total Activities: ${aggregated.length}`);
    console.log(`Venues: ${new Set(aggregated.map(a => a.venue.name)).size}`);
    console.log(`Sports: ${new Set(aggregated.map(a => a.sport)).size}`);
    
    return aggregated;
}

// Run if called directly
if (require.main === module) {
    runAllTests().then(() => {
        console.log('\n✅ All data collected successfully!');
    }).catch(error => {
        console.error('\n❌ Data collection failed:', error);
    });
}

module.exports = { runAllTests };