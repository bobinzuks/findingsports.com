const { chromium } = require('playwright');

async function debugSite() {
  console.log('🔍 Debug Capture with Console Monitoring');
  console.log('=========================================\n');
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Capture all console messages and errors
    const logs = [];
    const errors = [];
    
    page.on('console', msg => {
      const text = msg.text();
      logs.push(`[${msg.type()}] ${text}`);
      if (msg.type() === 'error') {
        console.log('  ❌ Console Error:', text);
        errors.push(text);
      }
    });
    
    page.on('pageerror', error => {
      console.log('  ❌ Page Error:', error.message);
      errors.push(error.message);
    });
    
    page.on('requestfailed', request => {
      console.log('  ❌ Request Failed:', request.url());
      errors.push(`Failed to load: ${request.url()}`);
    });
    
    // Test local site
    console.log('Testing http://localhost:8080');
    console.log('-----------------------------');
    
    const localResponse = await page.goto('http://localhost:8080', {
      waitUntil: 'networkidle',
      timeout: 15000
    });
    
    console.log('Response status:', localResponse.status());
    
    // Wait a bit
    await page.waitForTimeout(3000);
    
    // Check page state
    const pageState = await page.evaluate(() => {
      const result = {
        hasDocument: !!document,
        hasBody: !!document.body,
        bodyChildren: document.body ? document.body.children.length : 0,
        firstError: null
      };
      
      // Check if body is hidden
      if (document.body) {
        const styles = window.getComputedStyle(document.body);
        result.bodyDisplay = styles.display;
        result.bodyVisibility = styles.visibility;
        result.bodyOpacity = styles.opacity;
        
        // Check for any elements
        const allElements = document.querySelectorAll('*');
        result.totalElements = allElements.length;
        
        // Find first visible element
        for (let el of allElements) {
          const s = window.getComputedStyle(el);
          if (s.display !== 'none' && s.visibility !== 'hidden') {
            result.firstVisible = el.tagName + (el.className ? '.' + el.className : '');
            break;
          }
        }
      }
      
      return result;
    });
    
    console.log('\nPage State:', JSON.stringify(pageState, null, 2));
    console.log('\nErrors found:', errors.length);
    errors.forEach(e => console.log('  -', e));
    
    // Take screenshot
    const timestamp = Date.now();
    const screenshotFile = `debug-local-${timestamp}.png`;
    await page.screenshot({ path: screenshotFile, fullPage: true });
    console.log('\n✅ Screenshot saved:', screenshotFile);
    
    // Save the rendered HTML
    const html = await page.content();
    const htmlFile = `debug-local-${timestamp}.html`;
    require('fs').writeFileSync(htmlFile, html);
    console.log('✅ HTML saved:', htmlFile);
    console.log('   HTML size:', html.length, 'bytes');
    
    // Now test production
    console.log('\n\nTesting https://findingsports.com');
    console.log('----------------------------------');
    
    errors.length = 0; // Clear errors
    
    const prodResponse = await page.goto('https://findingsports.com', {
      waitUntil: 'networkidle',
      timeout: 15000
    });
    
    console.log('Response status:', prodResponse.status());
    
    await page.waitForTimeout(3000);
    
    const prodState = await page.evaluate(() => {
      const result = {
        hasDocument: !!document,
        hasBody: !!document.body,
        bodyChildren: document.body ? document.body.children.length : 0
      };
      
      if (document.body) {
        const styles = window.getComputedStyle(document.body);
        result.bodyDisplay = styles.display;
        result.bodyVisibility = styles.visibility;
        result.bodyOpacity = styles.opacity;
        result.totalElements = document.querySelectorAll('*').length;
      }
      
      return result;
    });
    
    console.log('\nPage State:', JSON.stringify(prodState, null, 2));
    console.log('\nErrors found:', errors.length);
    errors.forEach(e => console.log('  -', e));
    
    const prodScreenshot = `debug-production-${timestamp}.png`;
    await page.screenshot({ path: prodScreenshot, fullPage: true });
    console.log('\n✅ Screenshot saved:', prodScreenshot);
    
    const prodHtml = await page.content();
    const prodHtmlFile = `debug-production-${timestamp}.html`;
    require('fs').writeFileSync(prodHtmlFile, prodHtml);
    console.log('✅ HTML saved:', prodHtmlFile);
    console.log('   HTML size:', prodHtml.length, 'bytes');
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
  } finally {
    await browser.close();
  }
}

debugSite().catch(console.error);