const { chromium } = require('playwright');
const fs = require('fs');

async function captureEvidence() {
    console.log('🎭 PLAYWRIGHT EVIDENCE CAPTURE');
    console.log('==============================\n');
    
    const browser = await chromium.launch({ 
        headless: true,
        args: ['--disable-blink-features=AutomationControlled']
    });
    
    const evidence = {
        timestamp: new Date().toISOString(),
        tests: [],
        screenshots: []
    };
    
    try {
        // Test 1: Regular Browser Mode
        console.log('📸 Test 1: Regular Browser Mode');
        const context = await browser.newContext({
            viewport: { width: 1280, height: 800 },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        });
        
        const page = await context.newPage();
        
        // Navigate to site
        console.log('  → Navigating to https://findingsports.com...');
        const response = await page.goto('https://findingsports.com', {
            waitUntil: 'networkidle',
            timeout: 30000
        });
        
        // Wait for content to load
        await page.waitForTimeout(3000);
        
        // Check HTTP status
        const status = response.status();
        console.log(`  → HTTP Status: ${status}`);
        evidence.tests.push({ name: 'HTTP Status', value: status, pass: status === 200 });
        
        // Check page title
        const title = await page.title();
        console.log(`  → Page Title: ${title}`);
        evidence.tests.push({ name: 'Page Title', value: title, pass: title.includes('Finding Sports') });
        
        // Check for white screen (is body visible and has content?)
        const bodyVisible = await page.evaluate(() => {
            const body = document.body;
            const style = window.getComputedStyle(body);
            return {
                display: style.display,
                visibility: style.visibility,
                opacity: style.opacity,
                backgroundColor: style.backgroundColor,
                hasContent: body.innerText.length > 0,
                contentLength: body.innerText.length
            };
        });
        
        console.log(`  → Body Display: ${bodyVisible.display}`);
        console.log(`  → Body Visibility: ${bodyVisible.visibility}`);
        console.log(`  → Body Opacity: ${bodyVisible.opacity}`);
        console.log(`  → Background Color: ${bodyVisible.backgroundColor}`);
        console.log(`  → Has Content: ${bodyVisible.hasContent} (${bodyVisible.contentLength} chars)`);
        
        evidence.tests.push({ 
            name: 'Page Visible', 
            value: bodyVisible.display !== 'none' && bodyVisible.visibility !== 'hidden',
            pass: bodyVisible.display !== 'none' && bodyVisible.visibility !== 'hidden'
        });
        
        evidence.tests.push({ 
            name: 'Has Content', 
            value: bodyVisible.contentLength,
            pass: bodyVisible.contentLength > 100
        });
        
        // Check for language selector
        const hasLanguageSelector = await page.evaluate(() => {
            const text = document.body.innerText;
            return text.includes('🌐 English') || text.includes('Language');
        });
        console.log(`  → Language Selector: ${hasLanguageSelector ? '❌ Present' : '✅ Removed'}`);
        evidence.tests.push({ name: 'Language Selector Removed', value: !hasLanguageSelector, pass: !hasLanguageSelector });
        
        // Check for help button
        const hasHelpButton = await page.evaluate(() => {
            const text = document.body.innerText;
            return text.includes('? Help') || text.includes('Help ?');
        });
        console.log(`  → Help Button: ${hasHelpButton ? '❌ Present' : '✅ Removed'}`);
        evidence.tests.push({ name: 'Help Button Removed', value: !hasHelpButton, pass: !hasHelpButton });
        
        // Check for template tag (white screen cause)
        const hasTemplateTag = await page.content().then(html => html.includes('<%=Date.now()%>'));
        console.log(`  → Template Tag: ${hasTemplateTag ? '❌ Present' : '✅ Removed'}`);
        evidence.tests.push({ name: 'Template Tag Removed', value: !hasTemplateTag, pass: !hasTemplateTag });
        
        // Take screenshot
        const regularScreenshot = `evidence-regular-${Date.now()}.png`;
        await page.screenshot({ path: regularScreenshot, fullPage: false });
        console.log(`  → Screenshot saved: ${regularScreenshot}`);
        evidence.screenshots.push({ mode: 'regular', file: regularScreenshot });
        
        // Get visible text sample
        const visibleText = await page.evaluate(() => {
            return document.body.innerText.substring(0, 200);
        });
        console.log(`  → Visible Text Sample: "${visibleText.substring(0, 50)}..."`);
        evidence.visibleText = visibleText;
        
        await context.close();
        
        // Test 2: Incognito Mode
        console.log('\n📸 Test 2: Incognito/Private Mode');
        const incognitoContext = await browser.newContext({
            viewport: { width: 1280, height: 800 },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Private Mode'
        });
        
        const incognitoPage = await incognitoContext.newPage();
        
        console.log('  → Navigating in incognito mode...');
        await incognitoPage.goto('https://findingsports.com', {
            waitUntil: 'networkidle',
            timeout: 30000
        });
        
        await incognitoPage.waitForTimeout(3000);
        
        // Check incognito content
        const incognitoContent = await incognitoPage.evaluate(() => {
            return {
                hasContent: document.body.innerText.length > 0,
                contentLength: document.body.innerText.length,
                isWhite: window.getComputedStyle(document.body).backgroundColor === 'rgb(255, 255, 255)' && 
                         document.body.innerText.length < 50
            };
        });
        
        console.log(`  → Incognito Has Content: ${incognitoContent.hasContent} (${incognitoContent.contentLength} chars)`);
        console.log(`  → Is White/Blank: ${incognitoContent.isWhite ? '❌ Yes' : '✅ No'}`);
        
        evidence.tests.push({ 
            name: 'Incognito Mode Works', 
            value: incognitoContent.contentLength > 100,
            pass: incognitoContent.contentLength > 100
        });
        
        // Take incognito screenshot
        const incognitoScreenshot = `evidence-incognito-${Date.now()}.png`;
        await incognitoPage.screenshot({ path: incognitoScreenshot, fullPage: false });
        console.log(`  → Screenshot saved: ${incognitoScreenshot}`);
        evidence.screenshots.push({ mode: 'incognito', file: incognitoScreenshot });
        
        await incognitoContext.close();
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        evidence.error = error.message;
    } finally {
        await browser.close();
    }
    
    // Generate report
    console.log('\n📊 EVIDENCE REPORT');
    console.log('==================');
    
    const passedTests = evidence.tests.filter(t => t.pass).length;
    const totalTests = evidence.tests.length;
    const allPassed = passedTests === totalTests;
    
    console.log(`Tests Passed: ${passedTests}/${totalTests}`);
    evidence.tests.forEach(test => {
        console.log(`  ${test.pass ? '✅' : '❌'} ${test.name}: ${test.value}`);
    });
    
    // Save evidence to JSON
    fs.writeFileSync('playwright-evidence.json', JSON.stringify(evidence, null, 2));
    console.log('\n💾 Evidence saved to: playwright-evidence.json');
    console.log('📸 Screenshots saved:');
    evidence.screenshots.forEach(s => {
        console.log(`  - ${s.file} (${s.mode} mode)`);
    });
    
    // Final verdict
    console.log('\n🎯 FINAL VERDICT:');
    if (allPassed) {
        console.log('✅ ✅ ✅ SITE IS FULLY FUNCTIONAL! ✅ ✅ ✅');
        console.log('All tests passed - no white screen, no unwanted elements!');
    } else {
        console.log('⚠️ Some issues detected - check the failed tests above');
    }
    
    return evidence;
}

// Run the evidence capture
captureEvidence().catch(console.error);