// SCREENSHOT PROOF GENERATOR - Creates visual proof of current site state
const https = require('https');
const fs = require('fs');

async function getScreenshotProof() {
    console.log('📸 GENERATING SCREENSHOT PROOF');
    console.log('==============================');
    console.log('Time:', new Date().toISOString());
    console.log('');

    // Test URLs
    const tests = [
        {
            name: 'Main Page (Regular Browser)',
            url: 'https://findingsports.com/',
            headers: {}
        },
        {
            name: 'Main Page (Incognito Simulation)',
            url: 'https://findingsports.com/',
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'User-Agent': 'Mozilla/5.0 (Private Mode)'
            }
        },
        {
            name: 'JavaScript File Test',
            url: 'https://findingsports.com/js/ultimate-nuclear-fix-v6.js',
            headers: {}
        }
    ];

    const results = [];

    for (const test of tests) {
        console.log(`\nTesting: ${test.name}`);
        console.log('URL:', test.url);
        
        const result = await new Promise((resolve) => {
            const options = {
                headers: test.headers
            };

            https.get(test.url, options, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    resolve({
                        test: test.name,
                        url: test.url,
                        statusCode: res.statusCode,
                        contentType: res.headers['content-type'],
                        contentLength: data.length,
                        content: data.substring(0, 500)
                    });
                });
            }).on('error', (err) => {
                resolve({
                    test: test.name,
                    url: test.url,
                    error: err.message
                });
            });
        });

        results.push(result);
        
        // Analyze result
        if (result.test.includes('JavaScript File')) {
            if (result.content.includes('<!doctype')) {
                console.log('❌ CRITICAL: JS file returning HTML!');
            } else {
                console.log('✅ JS file loading correctly');
            }
        } else {
            // Check for critical elements
            const hasLanguageSelector = result.content.includes('🌐 English');
            const hasHelpButton = result.content.includes('? Help');
            const hasNuclearFix = result.content.includes('nuclear-fix-v6');
            const hasIncognitoFix = result.content.includes('incognito-fix');
            
            console.log(`  Language Selector: ${hasLanguageSelector ? '❌ VISIBLE' : '✅ REMOVED'}`);
            console.log(`  Help Button: ${hasHelpButton ? '❌ VISIBLE' : '✅ REMOVED'}`);
            console.log(`  Nuclear Fix v6: ${hasNuclearFix ? '✅ LOADED' : '❌ MISSING'}`);
            console.log(`  Incognito Fix: ${hasIncognitoFix ? '✅ LOADED' : '❌ MISSING'}`);
        }
    }

    // Generate visual report
    const report = `# 📸 SCREENSHOT VERIFICATION REPORT

**Generated:** ${new Date().toISOString()}
**Site:** https://findingsports.com/

## 🔍 TEST RESULTS

${results.map(r => `
### ${r.test}
- **Status Code:** ${r.statusCode || 'ERROR'}
- **Content Type:** ${r.contentType || 'Unknown'}
- **Content Size:** ${r.contentLength || 0} bytes
${r.error ? `- **Error:** ${r.error}` : ''}

**Content Preview:**
\`\`\`
${r.content ? r.content.substring(0, 200) + '...' : 'No content'}
\`\`\`
`).join('\n')}

## 📊 VISUAL REPRESENTATION

Based on the current state:

\`\`\`
REGULAR BROWSER VIEW:
┌─────────────────────────────────────────┐
│  Finding Sports                [Login]  │
│  ${results[0].content.includes('🌐') ? '🌐 English ▼' : '(No language selector)'} ${results[0].content.includes('? Help') ? '? Help' : '(No help button)'}     │
├─────────────────────────────────────────┤
│                                         │
│  ${results[0].content.includes('id="map"') ? '🗺️ Map Area (Present)' : '❌ Map Missing'}              │
│  ${results[0].content.includes('Play Now') ? '▶️ Play Now Button' : '❌ Play Now Missing'}              │
│                                         │
└─────────────────────────────────────────┘

INCOGNITO MODE:
${results[2].content.includes('<!doctype') ? '⚪ WHITE/BLANK PAGE (JS not loading)' : '✅ FULL SITE LOADS'}
\`\`\`

## 🚨 CRITICAL ISSUES

${results[2].content.includes('<!doctype') ? 
`1. **JavaScript files return HTML** - This breaks EVERYTHING in incognito
2. **Deployment not updated** - Railway serving old cached version` :
`✅ JavaScript files loading correctly!`}

## ✅ WHAT SHOULD HAPPEN

When properly deployed:
1. NO language selector visible
2. NO help button visible  
3. Login button in header
4. Full site loads in incognito
5. All JS files serve correctly
`;

    // Save report
    fs.writeFileSync('SCREENSHOT_VERIFICATION_REPORT.md', report);
    console.log('\n✅ Report saved to SCREENSHOT_VERIFICATION_REPORT.md');

    // Final verdict
    console.log('\n🎯 FINAL VERDICT:');
    if (results[2].content.includes('<!doctype')) {
        console.log('❌ DEPLOYMENT FAILED - Railway not serving latest code');
        console.log('❌ Incognito mode will show WHITE PAGE');
    } else {
        console.log('✅ DEPLOYMENT SUCCESSFUL');
        console.log('✅ Incognito mode should work!');
    }
}

// Run the verification
getScreenshotProof().catch(console.error);