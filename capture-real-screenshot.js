const puppeteer = require('puppeteer');
const fs = require('fs');

async function captureRealScreenshots() {
    console.log('📸 CAPTURING REAL SCREENSHOTS...');
    console.log('================================');
    
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        // Regular mode screenshot
        console.log('\n1. Capturing REGULAR browser mode...');
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        
        // Clear all cookies and cache
        await page.setCacheEnabled(false);
        
        await page.goto('https://findingsports.com', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        
        // Wait for content to load
        await page.waitForTimeout(3000);
        
        // Take screenshot
        await page.screenshot({ 
            path: 'screenshot-regular.png',
            fullPage: false
        });
        
        // Get page content for analysis
        const regularContent = await page.content();
        const hasLanguageSelector = regularContent.includes('🌐 English') || regularContent.includes('Language');
        const hasHelpButton = regularContent.includes('? Help') || regularContent.includes('Help ?');
        const hasIncognitoFix = regularContent.includes('incognito-fix.js');
        
        console.log('Regular mode results:');
        console.log(`  Language Selector: ${hasLanguageSelector ? '❌ STILL VISIBLE' : '✅ Removed'}`);
        console.log(`  Help Button: ${hasHelpButton ? '❌ STILL VISIBLE' : '✅ Removed'}`);
        console.log(`  Incognito Fix: ${hasIncognitoFix ? '✅ Present' : '❌ Missing'}`);
        
        // Incognito mode screenshot
        console.log('\n2. Capturing INCOGNITO browser mode...');
        const incognitoContext = await browser.createIncognitoBrowserContext();
        const incognitoPage = await incognitoContext.newPage();
        await incognitoPage.setViewport({ width: 1280, height: 800 });
        
        await incognitoPage.goto('https://findingsports.com', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        
        // Wait for content to load
        await incognitoPage.waitForTimeout(3000);
        
        // Take screenshot
        await incognitoPage.screenshot({ 
            path: 'screenshot-incognito.png',
            fullPage: false
        });
        
        // Check if page is white/blank
        const incognitoContent = await incognitoPage.content();
        const bodyContent = await incognitoPage.$eval('body', el => el.innerText.trim());
        
        console.log('Incognito mode results:');
        console.log(`  Page content length: ${bodyContent.length} characters`);
        console.log(`  Is blank/white: ${bodyContent.length < 50 ? '❌ YES - WHITE PAGE' : '✅ No - Content visible'}`);
        
        // Get console errors
        const errors = [];
        incognitoPage.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });
        
        if (errors.length > 0) {
            console.log(`  JavaScript errors: ${errors.length} found`);
            errors.forEach(err => console.log(`    - ${err}`));
        }
        
        await incognitoContext.close();
        
        // Create visual report
        const report = `# 📸 REAL SCREENSHOT RESULTS

**Captured:** ${new Date().toISOString()}

## Screenshots Saved:
- **Regular Mode:** screenshot-regular.png
- **Incognito Mode:** screenshot-incognito.png

## Analysis:

### Regular Browser:
- Language Selector: ${hasLanguageSelector ? '❌ STILL VISIBLE' : '✅ Removed'}
- Help Button: ${hasHelpButton ? '❌ STILL VISIBLE' : '✅ Removed'}
- Incognito Fix Script: ${hasIncognitoFix ? '✅ Loaded' : '❌ Missing'}

### Incognito Mode:
- Page Status: ${bodyContent.length < 50 ? '❌ WHITE/BLANK PAGE' : '✅ Content Visible'}
- Content Length: ${bodyContent.length} characters
- JavaScript Errors: ${errors.length}

## Next Steps:
${bodyContent.length < 50 ? 
'The incognito mode is still showing a white page. The deployment may not have fully propagated yet.' :
'The site appears to be working in both modes!'}
`;

        fs.writeFileSync('REAL_SCREENSHOT_RESULTS.md', report);
        console.log('\n✅ Screenshots saved!');
        console.log('📄 Report saved to REAL_SCREENSHOT_RESULTS.md');
        
    } catch (error) {
        console.error('❌ Error capturing screenshots:', error);
    } finally {
        await browser.close();
    }
}

// Run it
captureRealScreenshots().catch(console.error);