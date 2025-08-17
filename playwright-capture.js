const { chromium } = require('playwright');
const fs = require('fs');

async function captureScreenshot() {
  console.log('🚀 Playwright Screenshot Capture');
  console.log('================================');
  console.log('Time:', new Date().toISOString());
  console.log();
  
  // Launch browser
  const browser = await chromium.launch({
    headless: false, // Set to false to see what's happening
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    // Regular mode
    console.log('📸 REGULAR MODE:');
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 }
    });
    
    const page = await context.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('  ❌ Console Error:', msg.text());
      }
    });
    
    page.on('pageerror', error => {
      console.log('  ❌ Page Error:', error.message);
    });
    
    console.log('  Loading https://findingsports.com...');
    await page.goto('https://findingsports.com', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    // Wait for potential content to load
    await page.waitForTimeout(3000);
    
    // Check what's visible
    const title = await page.title();
    console.log('  Page Title:', title || '(empty)');
    
    // Check for body content
    const bodyText = await page.evaluate(() => document.body?.innerText || '');
    console.log('  Body Text Length:', bodyText.length, 'chars');
    console.log('  First 100 chars:', bodyText.substring(0, 100));
    
    // Check background color
    const bgColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor;
    });
    console.log('  Body Background:', bgColor);
    
    // Check for hidden elements
    const hiddenCount = await page.evaluate(() => {
      return document.querySelectorAll('[style*="display: none"], [style*="visibility: hidden"]').length;
    });
    console.log('  Hidden Elements:', hiddenCount);
    
    // Take screenshot
    const regularFile = `playwright-regular-${Date.now()}.png`;
    await page.screenshot({ 
      path: regularFile,
      fullPage: true 
    });
    console.log('  ✅ Screenshot saved:', regularFile);
    
    // Open DevTools and capture console
    console.log('  Opening DevTools...');
    const cdpSession = await context.newCDPSession(page);
    await cdpSession.send('Runtime.enable');
    
    // Get console logs
    const consoleAPI = await cdpSession.send('Runtime.evaluate', {
      expression: 'console.log("DevTools active"); Array.from(document.querySelectorAll("*")).length'
    });
    console.log('  Total DOM Elements:', consoleAPI.result.value);
    
    await context.close();
    
    // Incognito mode
    console.log();
    console.log('🥸 INCOGNITO MODE:');
    const incognitoContext = await browser.newContext({
      viewport: { width: 1280, height: 800 }
    });
    
    const incognitoPage = await incognitoContext.newPage();
    
    console.log('  Loading https://findingsports.com...');
    await incognitoPage.goto('https://findingsports.com', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    await incognitoPage.waitForTimeout(3000);
    
    const incognitoFile = `playwright-incognito-${Date.now()}.png`;
    await incognitoPage.screenshot({ 
      path: incognitoFile,
      fullPage: true 
    });
    console.log('  ✅ Screenshot saved:', incognitoFile);
    
    await incognitoContext.close();
    
    // Try to inject content if still white
    console.log();
    console.log('🔧 ATTEMPTING CONTENT INJECTION:');
    const fixContext = await browser.newContext({
      viewport: { width: 1280, height: 800 }
    });
    
    const fixPage = await fixContext.newPage();
    
    // Intercept and modify response if needed
    await fixPage.route('**/*', route => {
      route.continue();
    });
    
    await fixPage.goto('https://findingsports.com', {
      waitUntil: 'domcontentloaded'
    });
    
    // Force remove any hiding styles
    await fixPage.evaluate(() => {
      // Remove all display:none and visibility:hidden
      document.querySelectorAll('*').forEach(el => {
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') {
          el.style.display = '';
          el.style.visibility = '';
        }
      });
      
      // Force body to be visible
      document.body.style.display = 'block';
      document.body.style.visibility = 'visible';
      document.body.style.opacity = '1';
      document.body.style.backgroundColor = '#ffffff';
      
      // Look for main content containers
      const possibleContainers = ['main', '.container', '#app', '#root', '.content'];
      possibleContainers.forEach(selector => {
        const el = document.querySelector(selector);
        if (el) {
          el.style.display = 'block';
          el.style.visibility = 'visible';
          el.style.opacity = '1';
        }
      });
    });
    
    await fixPage.waitForTimeout(2000);
    
    const fixedFile = `playwright-fixed-${Date.now()}.png`;
    await fixPage.screenshot({ 
      path: fixedFile,
      fullPage: true 
    });
    console.log('  ✅ Fixed screenshot saved:', fixedFile);
    
    await fixContext.close();
    
    console.log();
    console.log('✅ ALL SCREENSHOTS CAPTURED');
    console.log('Files created:');
    console.log('  -', regularFile);
    console.log('  -', incognitoFile);
    console.log('  -', fixedFile);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

// Run the capture
captureScreenshot().catch(console.error);