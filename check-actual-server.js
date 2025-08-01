const https = require('https');
const fs = require('fs');

console.log('🔍 CHECKING ACTUAL SERVER RESPONSE');
console.log('==================================');
console.log('This shows EXACTLY what the server returns RIGHT NOW\n');

// Test with aggressive no-cache headers
const options = {
    headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Clear-Site-Data': '"cache", "storage"',
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
    }
};

https.get('https://findingsports.com/', options, (res) => {
    let html = '';
    res.on('data', chunk => html += chunk);
    res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        console.log('Headers:', JSON.stringify(res.headers, null, 2));
        console.log('\n--- CHECKING FOR PROBLEMS ---\n');
        
        // Check for language selector
        const langMatches = html.match(/🌐.*?English.*?▼/g) || [];
        if (langMatches.length > 0) {
            console.log('❌ LANGUAGE SELECTOR FOUND:');
            langMatches.forEach(match => {
                const index = html.indexOf(match);
                const context = html.substring(index - 50, index + 100);
                console.log('   Location:', context.replace(/\n/g, ' '));
            });
        } else {
            console.log('✅ No language selector found');
        }
        
        // Check for help button
        const helpMatches = html.match(/\?\s*Help/gi) || [];
        if (helpMatches.length > 0) {
            console.log('\n❌ HELP BUTTON FOUND:');
            helpMatches.forEach(match => {
                const index = html.indexOf(match);
                const context = html.substring(index - 50, index + 100);
                console.log('   Location:', context.replace(/\n/g, ' '));
            });
        } else {
            console.log('✅ No help button found');
        }
        
        // Check if Nuclear Fix is present
        console.log('\n--- NUCLEAR FIX STATUS ---');
        if (html.includes('ultimate-nuclear-fix-v6.js')) {
            console.log('✅ Nuclear Fix v6 is referenced');
            const scriptTag = html.match(/<script.*?ultimate-nuclear-fix-v6\.js.*?>/);
            console.log('   Script tag:', scriptTag ? scriptTag[0] : 'Not found');
        } else {
            console.log('❌ Nuclear Fix v6 NOT referenced!');
        }
        
        // Check if Incognito Fix is present
        if (html.includes('incognito-fix.js')) {
            console.log('✅ Incognito Fix is referenced');
            const scriptTag = html.match(/<script.*?incognito-fix\.js.*?>/);
            console.log('   Script tag:', scriptTag ? scriptTag[0] : 'Not found');
        } else {
            console.log('❌ Incognito Fix NOT referenced!');
        }
        
        // Extract visible text
        console.log('\n--- VISIBLE TEXT IN HEADER ---');
        const headerMatch = html.match(/<header.*?>(.*?)<\/header>/s);
        if (headerMatch) {
            const headerText = headerMatch[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            console.log(headerText.substring(0, 200));
        }
        
        // Save full HTML for inspection
        fs.writeFileSync('current-server-response.html', html);
        console.log('\n💾 Full HTML saved to: current-server-response.html');
        
        // Create visual representation
        console.log('\n--- WHAT YOUR BROWSER SHOWS ---');
        if (langMatches.length > 0 || helpMatches.length > 0) {
            console.log('┌─────────────────────────────────────────────────┐');
            console.log('│  Finding Sports     [🌐 English ▼] [? Help]    │');
            console.log('│                                        [Login]  │');
            console.log('└─────────────────────────────────────────────────┘');
            console.log('         ⬆️ THESE ARE STILL VISIBLE! ⬆️');
        } else {
            console.log('┌─────────────────────────────────────────────────┐');
            console.log('│  Finding Sports                       [Login]  │');
            console.log('└─────────────────────────────────────────────────┘');
            console.log('         ✅ CLEAN - No unwanted elements!');
        }
    });
});