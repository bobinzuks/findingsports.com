/**
 * Simulate what happens when user clicks "Play Now"
 * This shows the actual data flow and what the user would see
 */

// Simulate user location (Vancouver area)
const userLocation = {
    lat: 49.2827,
    lng: -123.1207,
    address: "Downtown Vancouver"
};

// Simulate current time
const now = new Date('2025-01-10T18:30:00'); // Friday 6:30 PM

console.log('🎮 USER CLICKS "PLAY NOW"');
console.log('=' .repeat(60));
console.log(`📍 User Location: ${userLocation.address}`);
console.log(`⏰ Current Time: ${now.toLocaleString()}`);
console.log(`🔍 Search Radius: 5 km`);
console.log('\n');

// Step 1: What's happening RIGHT NOW
console.log('🏃 GAMES HAPPENING NOW OR STARTING SOON:\n');

const gamesNow = [
    {
        id: 'hillcrest-basketball-now',
        sport: '🏀 Basketball',
        status: '🟢 IN PROGRESS',
        venue: 'Hillcrest Community Centre',
        time: '7:00 PM - 9:00 PM',
        started: '30 minutes ago',
        players: '~15-20 players',
        cost: '$5.50',
        distance: '2.1 km',
        waitTime: 'Jump in anytime',
        level: 'Mixed skill levels'
    },
    {
        id: 'kerrisdale-badminton-soon',
        sport: '🏸 Badminton', 
        status: '🟡 STARTING SOON',
        venue: 'Kerrisdale Community Centre',
        time: '7:00 PM - 9:00 PM',
        startsIn: '30 minutes',
        spotsOpen: 'Usually has space',
        cost: '$4.50',
        distance: '3.8 km',
        equipment: 'Racquets available',
        level: 'All welcome'
    },
    {
        id: 'ubc-volleyball-now',
        sport: '🏐 Volleyball',
        status: '🟢 IN PROGRESS',
        venue: 'UBC War Memorial Gym',
        time: '6:00 PM - 8:00 PM',
        started: '30 minutes ago',
        courts: '3 courts running',
        cost: '$8.00',
        distance: '8.2 km',
        parking: 'Paid parking available',
        level: 'Intermediate/Advanced'
    }
];

gamesNow.forEach((game, index) => {
    console.log(`${index + 1}. ${game.sport} ${game.status}`);
    console.log(`   📍 ${game.venue} (${game.distance} away)`);
    console.log(`   ⏰ ${game.time}`);
    if (game.started) {
        console.log(`   ⏱️ Started ${game.started}`);
    } else if (game.startsIn) {
        console.log(`   ⏱️ Starts in ${game.startsIn}`);
    }
    console.log(`   💰 ${game.cost} drop-in fee`);
    console.log(`   👥 ${game.players || game.spotsOpen || game.courts}`);
    console.log(`   🎯 ${game.level}`);
    if (game.equipment) console.log(`   🎾 ${game.equipment}`);
    if (game.parking) console.log(`   🚗 ${game.parking}`);
    console.log();
});

// Step 2: What's available TONIGHT
console.log('\n🌙 LATER TONIGHT:\n');

const gamesLater = [
    {
        sport: '🏒 Shinny Hockey',
        venue: 'Killarney Ice Rink',
        time: '9:00 PM - 10:30 PM',
        cost: '$8.00',
        distance: '4.5 km',
        note: 'Full equipment required'
    },
    {
        sport: '🏀 Late Night Basketball',
        venue: 'Britannia Community Centre',
        time: '9:00 PM - 11:00 PM',
        cost: '$5.50',
        distance: '3.2 km',
        note: 'Adult 19+ only'
    }
];

gamesLater.forEach(game => {
    console.log(`• ${game.sport} at ${game.venue}`);
    console.log(`  ${game.time} - ${game.cost} - ${game.distance} away`);
    if (game.note) console.log(`  Note: ${game.note}`);
});

// Step 3: What's open for free play
console.log('\n\n🏞️ OPEN COURTS/FIELDS (Free Play):\n');

const openFacilities = [
    {
        type: '🏀 Outdoor Basketball Courts',
        venue: 'David Lam Park',
        status: '✅ OPEN (Lit until 10 PM)',
        distance: '1.5 km',
        courts: '2 full courts',
        busy: 'Usually busy 6-8 PM'
    },
    {
        type: '🎾 Tennis Courts',
        venue: 'Queen Elizabeth Park',
        status: '✅ OPEN (First come, first served)',
        distance: '2.8 km',
        courts: '17 courts available',
        busy: 'Peak: 5-7 PM'
    },
    {
        type: '⚽ Soccer Field',
        venue: 'Trout Lake Park',
        status: '⚠️ FAIR (Muddy conditions)',
        distance: '3.1 km',
        note: 'Field 1 open, Field 2 closed'
    }
];

openFacilities.forEach(facility => {
    console.log(`${facility.type}`);
    console.log(`   📍 ${facility.venue} (${facility.distance})`);
    console.log(`   ${facility.status}`);
    if (facility.courts) console.log(`   🏟️ ${facility.courts}`);
    if (facility.busy) console.log(`   ⏰ ${facility.busy}`);
    if (facility.note) console.log(`   ℹ️ ${facility.note}`);
    console.log();
});

// Step 4: Pickup games from apps/social
console.log('\n👥 PICKUP GAMES (Organized by Players):\n');

const pickupGames = [
    {
        sport: '⚽ Soccer',
        organizer: 'Vancouver Pickup Soccer (Facebook)',
        location: 'Andy Livingstone Park',
        time: 'NOW - Looking for 3 more',
        skill: 'Casual/Intermediate',
        contact: 'Message on Facebook group'
    },
    {
        sport: '🏀 Basketball',
        app: 'OpenSports App',
        location: 'Sunset Community Centre',
        time: '8:00 PM (2 spots left)',
        skill: 'Competitive',
        action: 'Join via app'
    }
];

pickupGames.forEach(game => {
    console.log(`• ${game.sport} - ${game.time}`);
    console.log(`  📍 ${game.location}`);
    console.log(`  👥 ${game.organizer || game.app}`);
    console.log(`  🎯 ${game.skill} level`);
    console.log(`  📱 ${game.contact || game.action}`);
    console.log();
});

// Step 5: Tomorrow's schedule preview
console.log('\n📅 TOMORROW (Saturday) HIGHLIGHTS:\n');

const tomorrow = [
    '• 🏊 Lane Swim: 6:00 AM @ Multiple pools',
    '• 🏀 Youth Basketball: 10:00 AM @ Various centers',
    '• ⛸️ Public Skating: 2:00 PM @ All city rinks',
    '• ⚽ Drop-in Soccer: 10:00 AM @ Killarney',
    '• 🏸 Badminton: All day @ Various centers'
];

tomorrow.forEach(item => console.log(item));

// Summary
console.log('\n\n📊 PLAY NOW SUMMARY:');
console.log('=' .repeat(60));
console.log(`✅ ${gamesNow.length} games happening right now`);
console.log(`🌙 ${gamesLater.length} games later tonight`);
console.log(`🏞️ ${openFacilities.length} open courts/fields`);
console.log(`👥 ${pickupGames.length} pickup games via apps`);
console.log(`📍 All within 10 km of your location`);

console.log('\n💡 TIP: Friday evenings are peak times! Arrive early or check real-time updates.');

// Show what the UI would display
console.log('\n\n📱 MOBILE APP VIEW:');
console.log('┌─────────────────────────────────┐');
console.log('│        🎮 PLAY NOW              │');
console.log('├─────────────────────────────────┤');
console.log('│ 📍 Near Downtown Vancouver      │');
console.log('│                                 │');
console.log('│ 🟢 HAPPENING NOW (3)            │');
console.log('│ ├─ 🏀 Basketball @ Hillcrest   │');
console.log('│ ├─ 🏐 Volleyball @ UBC         │');
console.log('│ └─ ⚽ Pickup Soccer @ Andy Liv │');
console.log('│                                 │');
console.log('│ 🟡 STARTING SOON (1)            │');
console.log('│ └─ 🏸 Badminton @ Kerrisdale   │');
console.log('│                                 │');
console.log('│ 🏞️ OPEN COURTS (3)             │');
console.log('│ View all ➜                     │');
console.log('│                                 │');
console.log('│ [🗺️ Map View] [📋 List] [⚙️]   │');
console.log('└─────────────────────────────────┘');