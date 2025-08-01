#!/usr/bin/env node

const https = require('https');

console.log('🔍 Debugging Incognito White Screen Issue');
console.log('========================================\n');

// Test with Incognito-like headers
const options = {
    hostname: 'findingsports.com',
    path: '/',
    method: 'GET',
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
    }
};

https.get(options, (res) => {
    let data = '';
    
    res.on('data', chunk => data += chunk);
    
    res.on('end', () => {
        console.log('Response Status:', res.statusCode);
        console.log('Content-Type:', res.headers['content-type']);
        console.log('');
        
        // Check for common issues
        const checks = {
            'Has <html> tag': data.includes('<html'),
            'Has <body> tag': data.includes('<body'),
            'Has visible content': data.includes('Finding Sports'),
            'CSS loaded': data.includes('css/styles.css'),
            'JS loaded': data.includes('js/app.js'),
            'Has nuclear fix': data.includes('nuclear-fix'),
            'Has display:none on body': data.includes('body{display:none'),
            'Has visibility:hidden': data.includes('visibility:hidden'),
            'Has white background override': data.includes('background:white!important') || data.includes('background: white !important'),
            'Script errors': (data.match(/console\.error/g) || []).length
        };
        
        console.log('Page Analysis:');
        Object.entries(checks).forEach(([check, result]) => {
            console.log(`${result ? '✅' : '❌'} ${check}: ${result}`);
        });
        
        // Check for blocking styles
        const styleMatches = data.match(/<style[^>]*>[\s\S]*?<\/style>/g) || [];
        let foundBlockingStyles = false;
        
        console.log('\nChecking inline styles...');
        styleMatches.forEach(style => {
            if (style.includes('display:none') || style.includes('display: none') || 
                style.includes('visibility:hidden') || style.includes('visibility: hidden') ||
                style.includes('opacity:0') || style.includes('opacity: 0')) {
                console.log('⚠️  Found potentially blocking style:');
                console.log(style.substring(0, 200) + '...');
                foundBlockingStyles = true;
            }
        });
        
        if (!foundBlockingStyles) {
            console.log('✅ No blocking inline styles found');
        }
        
        // Check body content
        const bodyMatch = data.match(/<body[^>]*>([\s\S]*?)<\/body>/);
        if (bodyMatch) {
            const bodyContent = bodyMatch[1];
            const visibleText = bodyContent.replace(/<[^>]*>/g, '').trim();
            console.log('\nBody content length:', bodyContent.length);
            console.log('Visible text length:', visibleText.length);
            
            if (visibleText.length < 100) {
                console.log('⚠️  WARNING: Very little visible text in body!');
            }
        }
        
        // Save response for manual inspection
        require('fs').writeFileSync('incognito-response.html', data);
        console.log('\nFull response saved to: incognito-response.html');
        
        // Suggest fix
        console.log('\n🔧 Suggested Fix:');
        if (foundBlockingStyles || checks['Has display:none on body'] || checks['Has visibility:hidden']) {
            console.log('The nuclear fix script may be hiding the entire page.');
            console.log('Check for overly aggressive CSS rules or JavaScript that hides content.');
        } else if (!checks['Has visible content']) {
            console.log('Content may not be loading properly.');
            console.log('Check for JavaScript errors or API failures.');
        } else {
            console.log('Page appears to be loading correctly.');
            console.log('Issue may be browser-specific or related to extensions.');
        }
    });
}).on('error', (err) => {
    console.error('Request failed:', err);
});