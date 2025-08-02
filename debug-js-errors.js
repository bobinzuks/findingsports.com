const puppeteer = require('puppeteer-core');

async function debugSite() {
    console.log('🔍 DEBUGGING JAVASCRIPT ERRORS');
    console.log('==============================\n');
    
    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/google-chrome',
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        // Test regular mode
        console.log('1. Testing REGULAR browser mode...');
        const page = await browser.newPage();
        
        // Capture console logs and errors
        const logs = [];
        const errors = [];
        
        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
            logs.push(`[${msg.type()}] ${msg.text()}`);
        });
        
        page.on('pageerror', err => {
            errors.push(err.toString());
        });
        
        await page.goto('https://findingsports.com', {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });
        
        // Wait a bit for JS to execute
        await page.waitForTimeout(3000);
        
        // Get page content
        const bodyText = await page.evaluate(() => document.body.innerText);
        
        console.log(`   Body text length: ${bodyText.length} characters`);
        console.log(`   Errors found: ${errors.length}`);
        
        if (errors.length > 0) {
            console.log('\n   ❌ JavaScript Errors:');
            errors.forEach(err => console.log(`      - ${err}`));
        }
        
        if (logs.length > 0) {
            console.log('\n   📝 Console Logs:');
            logs.slice(0, 10).forEach(log => console.log(`      ${log}`));
        }
        
        // Test incognito
        console.log('\n2. Testing INCOGNITO browser mode...');
        const context = await browser.createIncognitoBrowserContext();
        const incognitoPage = await context.newPage();
        
        const incognitoLogs = [];
        const incognitoErrors = [];
        
        incognitoPage.on('console', msg => {
            if (msg.type() === 'error') {
                incognitoErrors.push(msg.text());
            }
            incognitoLogs.push(`[${msg.type()}] ${msg.text()}`);
        });
        
        incognitoPage.on('pageerror', err => {
            incognitoErrors.push(err.toString());
        });
        
        await incognitoPage.goto('https://findingsports.com', {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });
        
        await incognitoPage.waitForTimeout(3000);
        
        const incognitoBodyText = await incognitoPage.evaluate(() => document.body.innerText);
        
        console.log(`   Body text length: ${incognitoBodyText.length} characters`);
        console.log(`   Errors found: ${incognitoErrors.length}`);
        
        if (incognitoErrors.length > 0) {
            console.log('\n   ❌ JavaScript Errors:');
            incognitoErrors.forEach(err => console.log(`      - ${err}`));
        }
        
        if (incognitoLogs.length > 0) {
            console.log('\n   📝 Console Logs:');
            incognitoLogs.slice(0, 10).forEach(log => console.log(`      ${log}`));
        }
        
        await context.close();
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await browser.close();
    }
}

debugSite().catch(console.error);