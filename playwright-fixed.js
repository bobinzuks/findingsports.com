const { chromium } = require('playwright');
const fs = require('fs');

async function captureScreenshot() {
  console.log('🚀 Fixed Playwright Capture');
  console.log('============================');
  
  const browser = await chromium.launch({
    headless: false, // Show browser
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Try local site
    console.log('\n1. TESTING LOCAL SITE (http://localhost:8080)');
    console.log('------------------------------------------------');
    
    try {
      await page.goto('http://localhost:8080', {
        waitUntil: 'load',
        timeout: 30000
      });
      
      // Wait for body to exist
      await page.waitForSelector('body', { timeout: 5000 }).catch(() => {
        console.log('  ⚠️ No body element found');
      });
      
      await page.waitForTimeout(3000);
      
      // Check what we have
      const localInfo = await page.evaluate(() => {
        const body = document.body;
        if (!body) {
          return { error: 'No body element' };
        }
        
        return {
          title: document.title || '(empty)',
          hasBody: !!body,
          bodyText: body.innerText ? body.innerText.substring(0, 200) : '(no text)',
          bodyHTML: body.innerHTML ? body.innerHTML.substring(0, 200) : '(no HTML)',
          elementsCount: document.querySelectorAll('*').length,
          backgroundColor: body ? window.getComputedStyle(body).backgroundColor : 'unknown'
        };
      });
      
      console.log('  Local site info:', JSON.stringify(localInfo, null, 2));
      
      const localFile = `local-${Date.now()}.png`;
      await page.screenshot({ path: localFile, fullPage: true });
      console.log('  ✅ Screenshot:', localFile);
      
    } catch (error) {
      console.log('  ❌ Local site error:', error.message);
    }
    
    // Try production site
    console.log('\n2. TESTING PRODUCTION SITE (https://findingsports.com)');
    console.log('--------------------------------------------------------');
    
    try {
      await page.goto('https://findingsports.com', {
        waitUntil: 'load',
        timeout: 30000
      });
      
      // Wait for body
      await page.waitForSelector('body', { timeout: 5000 }).catch(() => {
        console.log('  ⚠️ No body element found');
      });
      
      await page.waitForTimeout(3000);
      
      const prodInfo = await page.evaluate(() => {
        const body = document.body;
        if (!body) {
          return { error: 'No body element' };
        }
        
        return {
          title: document.title || '(empty)',
          hasBody: !!body,
          bodyText: body.innerText ? body.innerText.substring(0, 200) : '(no text)',
          bodyHTML: body.innerHTML ? body.innerHTML.substring(0, 200) : '(no HTML)',
          elementsCount: document.querySelectorAll('*').length,
          backgroundColor: body ? window.getComputedStyle(body).backgroundColor : 'unknown'
        };
      });
      
      console.log('  Production site info:', JSON.stringify(prodInfo, null, 2));
      
      const prodFile = `production-${Date.now()}.png`;
      await page.screenshot({ path: prodFile, fullPage: true });
      console.log('  ✅ Screenshot:', prodFile);
      
      // If still white, try injecting content
      if (!prodInfo.bodyText || prodInfo.bodyText === '(no text)') {
        console.log('\n3. ATTEMPTING TO FIX PRODUCTION SITE');
        console.log('--------------------------------------');
        
        await page.evaluate(() => {
          // Create basic content if missing
          if (!document.body || !document.body.innerHTML) {
            document.body = document.createElement('body');
            document.body.innerHTML = '<h1>Finding Sports - Site Loading Issue</h1><p>The site appears to be having loading issues.</p>';
          }
          
          // Force visibility
          document.body.style.display = 'block';
          document.body.style.visibility = 'visible';
          document.body.style.opacity = '1';
          document.body.style.backgroundColor = '#f0f0f0';
        });
        
        await page.waitForTimeout(1000);
        
        const fixedFile = `production-fixed-${Date.now()}.png`;
        await page.screenshot({ path: fixedFile, fullPage: true });
        console.log('  ✅ Fixed screenshot:', fixedFile);
      }
      
    } catch (error) {
      console.log('  ❌ Production site error:', error.message);
    }
    
    // Keep browser open for manual inspection
    console.log('\n⏰ Keeping browser open for 10 seconds for inspection...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
  } finally {
    await browser.close();
    console.log('\n✅ Browser closed');
  }
}

captureScreenshot().catch(console.error);