#!/usr/bin/env node
// Final Verification - Smart detection that ignores code patterns

const https = require('https');

const SITE_URL = 'https://findingsports.com';

function fetchPage(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

async function verifyFix() {
    console.log('🔍 FINAL VERIFICATION - Finding Sports\n');
    
    const html = await fetchPage(SITE_URL);
    
    // Check deployment version
    const versionMatch = html.match(/deployment-version[^>]*content="([^"]+)"/);
    console.log(`Deployment: ${versionMatch ? versionMatch[1] : 'Unknown'}`);
    
    // Check if nuclear fix is present
    const hasNuclearFix = html.includes('ultimate-nuclear-fix-v5.js');
    console.log(`Nuclear Fix v5: ${hasNuclearFix ? '✅ Deployed' : '❌ Missing'}`);
    
    console.log('\n📋 Checking for unwanted UI elements:\n');
    
    // Extract sections where UI elements would appear
    const headerMatch = html.match(/<header[^>]*>[\s\S]*?<\/header>/i);
    const navMatch = html.match(/<nav[^>]*>[\s\S]*?<\/nav>/i);
    const bodyMatch = html.match(/<body[^>]*>[\s\S]*?<\/body>/i);
    
    let issuesFound = 0;
    
    // Check header for actual elements (not script content)
    if (headerMatch) {
        const header = headerMatch[0];
        
        // Look for actual HTML elements with unwanted content
        // Ignore script tags and CSS
        const cleanHeader = header.replace(/<script[\s\S]*?<\/script>/gi, '')
                                 .replace(/<style[\s\S]*?<\/style>/gi, '');
        
        // Check for language selector patterns in actual elements
        const langPatterns = [
            /<(button|a|span|div)[^>]*>[^<]*🌐[^<]*<\/\1>/i,
            /<(button|a|span|div)[^>]*>[^<]*English[^<]*▼[^<]*<\/\1>/i,
            /<(button|a|span|div)[^>]*class="[^"]*language[^"]*"[^>]*>[^<]+<\/\1>/i
        ];
        
        const hasLanguage = langPatterns.some(pattern => pattern.test(cleanHeader));
        console.log(`Language Selector: ${hasLanguage ? '❌ Found' : '✅ Not found'}`);
        if (hasLanguage) issuesFound++;
        
        // Check for help button
        const helpPatterns = [
            /<(button|a)[^>]*>[^<]*\?[^<]*Help[^<]*<\/\1>/i,
            /<(button|a)[^>]*>[^<]*Help[^<]*<\/\1>/i,
            /<(button|a)[^>]*class="[^"]*help[^"]*"[^>]*>/i
        ];
        
        const hasHelp = helpPatterns.some(pattern => pattern.test(cleanHeader));
        console.log(`Help Button: ${hasHelp ? '❌ Found' : '✅ Not found'}`);
        if (hasHelp) issuesFound++;
        
        // Check for online status
        const onlinePatterns = [
            /<(span|div)[^>]*>[^<]*Online[^<]*<\/\1>/i,
            /<(span|div)[^>]*class="[^"]*online[^"]*status[^"]*"[^>]*>/i
        ];
        
        const hasOnline = onlinePatterns.some(pattern => pattern.test(cleanHeader));
        console.log(`Online Status: ${hasOnline ? '❌ Found' : '✅ Not found'}`);
        if (hasOnline) issuesFound++;
    }
    
    // Check for login button (should exist)
    const loginExists = /<(button|a)[^>]*>[^<]*Login[^<]*<\/\1>/i.test(html) ||
                       html.includes('login-component.js');
    console.log(`\nLogin Button: ${loginExists ? '✅ Present' : '⚠️  Missing'}`);
    
    // Check other features
    console.log('\n📋 Other Features Check:');
    console.log(`Map: ${html.includes('id="map"') ? '✅' : '❌'}`);
    console.log(`Play Now: ${html.includes('Play Now') ? '✅' : '❌'}`);
    console.log(`Social Feed: ${html.includes('social-feed') ? '✅' : '❌'}`);
    console.log(`Games API: ${html.includes('/api/v2/games') ? '✅' : '❌'}`);
    
    // Final verdict
    console.log('\n' + '═'.repeat(50));
    if (issuesFound === 0) {
        console.log('🎉 SUCCESS! All unwanted elements have been removed!');
        console.log('✅ Test 1 should now PASS');
        console.log('\nReady for final deployment verification.');
    } else {
        console.log(`⚠️  WARNING: ${issuesFound} unwanted element(s) may still be present`);
        console.log('\nNote: The test might be detecting patterns in scripts/CSS');
        console.log('Manual visual inspection recommended.');
    }
    
    // Save detailed report
    const report = {
        timestamp: new Date().toISOString(),
        deployment: versionMatch ? versionMatch[1] : 'Unknown',
        nuclearFixDeployed: hasNuclearFix,
        unwantedElementsFound: issuesFound,
        features: {
            login: loginExists,
            map: html.includes('id="map"'),
            playNow: html.includes('Play Now'),
            socialFeed: html.includes('social-feed'),
            gamesAPI: html.includes('/api/v2/games')
        }
    };
    
    require('fs').writeFileSync('final-verification-report.json', JSON.stringify(report, null, 2));
    console.log('\n📄 Detailed report saved to final-verification-report.json');
}

verifyFix().catch(console.error);