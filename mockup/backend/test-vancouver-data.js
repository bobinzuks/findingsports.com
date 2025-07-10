const fetch = require('node-fetch');
const cheerio = require('cheerio');

/**
 * Test Vancouver and North Vancouver recreation data collection
 */

// Test 1: Vancouver Open Data API - Facilities
async function testVancouverOpenData() {
    console.log('\n📊 Testing Vancouver Open Data API...\n');
    
    try {
        const response = await fetch(
            'https://opendata.vancouver.ca/api/v2/catalog/datasets/parks-facilities/records?limit=10&where=facility_t%20%3D%20%22Community%20Centre%22'
        );
        
        if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
        }
        
        const data = await response.json();
        
        console.log(`Found ${data.total_count} total facilities`);
        console.log('\nSample Community Centers:');
        
        data.records.forEach((record, index) => {
            const facility = record.fields;
            console.log(`\n${index + 1}. ${facility.name}`);
            console.log(`   Address: ${facility.address}`);
            console.log(`   Type: ${facility.facilityty}`);
            if (facility.geo_point_2d) {
                console.log(`   Coordinates: ${facility.geo_point_2d[0]}, ${facility.geo_point_2d[1]}`);
            }
        });
        
        return data.records;
    } catch (error) {
        console.error('❌ Vancouver Open Data API Error:', error.message);
        return [];
    }
}

// Test 2: Vancouver Field Status
async function testFieldStatus() {
    console.log('\n🏃 Testing Vancouver Field Status...\n');
    
    try {
        const response = await fetch('https://covapp.vancouver.ca/parkfinder/FieldStatus.aspx');
        const html = await response.text();
        const $ = cheerio.load(html);
        
        console.log('Field Status Page Title:', $('title').text());
        
        // Look for field status data
        const fields = [];
        
        // Try different possible selectors
        const tables = $('table');
        console.log(`Found ${tables.length} tables on page`);
        
        // Look for field information in various formats
        $('tr').each((i, row) => {
            const cells = $(row).find('td');
            if (cells.length >= 3) {
                const text = $(row).text().trim();
                if (text && !text.includes('Field Status') && text.length > 10) {
                    fields.push(text.replace(/\s+/g, ' '));
                }
            }
        });
        
        console.log(`\nFound ${fields.length} potential field entries`);
        fields.slice(0, 5).forEach(field => {
            console.log(`- ${field.substring(0, 100)}...`);
        });
        
        return fields;
    } catch (error) {
        console.error('❌ Field Status Error:', error.message);
        return [];
    }
}

// Test 3: NVRC Website Structure
async function testNVRCStructure() {
    console.log('\n🏊 Testing NVRC Website Structure...\n');
    
    try {
        const response = await fetch('https://www.nvrc.ca/facilities-fields/facilities');
        const html = await response.text();
        const $ = cheerio.load(html);
        
        console.log('NVRC Page Title:', $('title').text());
        
        // Look for facility links
        const facilities = [];
        $('a').each((i, link) => {
            const href = $(link).attr('href');
            const text = $(link).text().trim();
            
            if (href && href.includes('/facilities/') && text) {
                facilities.push({
                    name: text,
                    url: href.startsWith('http') ? href : `https://www.nvrc.ca${href}`
                });
            }
        });
        
        // Remove duplicates
        const uniqueFacilities = [...new Map(facilities.map(f => [f.name, f])).values()];
        
        console.log(`\nFound ${uniqueFacilities.length} NVRC facilities:`);
        uniqueFacilities.forEach(facility => {
            console.log(`- ${facility.name}`);
            console.log(`  ${facility.url}`);
        });
        
        return uniqueFacilities;
    } catch (error) {
        console.error('❌ NVRC Structure Error:', error.message);
        return [];
    }
}

// Test 4: Sample Drop-in Data (from existing scrapers)
async function testExistingScrapers() {
    console.log('\n🏀 Testing Existing Drop-in Data Collection...\n');
    
    try {
        // Import existing data pipeline
        const { getInstance } = require('./services/data-aggregation-pipeline');
        const pipeline = getInstance();
        
        // Get some games from existing sources
        const games = await pipeline.searchGames({
            sport: 'basketball',
            location: 'vancouver'
        });
        
        console.log(`Found ${games.length} basketball games in Vancouver`);
        
        // Show first 5 games
        games.slice(0, 5).forEach((game, index) => {
            console.log(`\n${index + 1}. ${game.title}`);
            console.log(`   Sport: ${game.sport}`);
            console.log(`   Venue: ${game.venue?.name || 'Unknown'}`);
            console.log(`   Time: ${new Date(game.startTime).toLocaleString()}`);
            console.log(`   Type: ${game.type || 'Unknown'}`);
            console.log(`   Source: ${game.source || 'Unknown'}`);
        });
        
        return games;
    } catch (error) {
        console.error('❌ Existing Scrapers Error:', error.message);
        return [];
    }
}

// Test 5: Check Canlan Ice Sports
async function testCanlanIceSports() {
    console.log('\n🏒 Testing Canlan Ice Sports North Shore...\n');
    
    try {
        const response = await fetch('https://www.icesports.com/northshore/public/');
        const html = await response.text();
        const $ = cheerio.load(html);
        
        console.log('Canlan Page Title:', $('title').text());
        
        // Look for schedule information
        const scheduleInfo = [];
        $('h2, h3, h4').each((i, heading) => {
            const text = $(heading).text().trim();
            if (text.toLowerCase().includes('public') || 
                text.toLowerCase().includes('skate') ||
                text.toLowerCase().includes('shinny')) {
                scheduleInfo.push(text);
            }
        });
        
        console.log('\nFound schedule headings:');
        scheduleInfo.forEach(info => console.log(`- ${info}`));
        
        return scheduleInfo;
    } catch (error) {
        console.error('❌ Canlan Ice Sports Error:', error.message);
        return [];
    }
}

// Run all tests
async function runAllTests() {
    console.log('🚀 Starting Vancouver Recreation Data Tests...');
    console.log('=' .repeat(50));
    
    const results = {
        vancouverOpenData: await testVancouverOpenData(),
        fieldStatus: await testFieldStatus(),
        nvrcStructure: await testNVRCStructure(),
        existingGames: await testExistingScrapers(),
        canlanIce: await testCanlanIceSports()
    };
    
    console.log('\n\n📊 SUMMARY OF RESULTS:');
    console.log('=' .repeat(50));
    console.log(`✅ Vancouver Open Data: ${results.vancouverOpenData.length} facilities found`);
    console.log(`✅ Field Status: ${results.fieldStatus.length} field entries found`);
    console.log(`✅ NVRC Structure: ${results.nvrcStructure.length} facilities found`);
    console.log(`✅ Existing Games: ${results.existingGames.length} games found`);
    console.log(`✅ Canlan Ice: ${results.canlanIce.length} schedule items found`);
    
    return results;
}

// Run if called directly
if (require.main === module) {
    runAllTests().then(() => {
        console.log('\n✅ All tests completed!');
    }).catch(error => {
        console.error('\n❌ Test suite failed:', error);
    });
}

module.exports = { runAllTests };