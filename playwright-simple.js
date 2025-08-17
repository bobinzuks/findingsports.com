const { chromium } = require('playwright');

async function captureScreenshot() {
  console.log('🚀 Simple Playwright Capture');
  console.log('===========================');
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });
  
  try {
    const page = await browser.newPage();
    
    // Go to the site
    console.log('Loading https://findingsports.com...');
    const response = await page.goto('https://findingsports.com', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    console.log('Response status:', response.status());
    
    // Wait a bit for any JavaScript to run
    await page.waitForTimeout(5000);
    
    // Get page content info
    const content = await page.evaluate(() => {
      return {
        title: document.title || '(no title)',
        bodyHTML: document.body ? document.body.innerHTML.substring(0, 200) : '(no body)',
        bodyText: document.body ? document.body.innerText.substring(0, 200) : '(no text)',
        elementsCount: document.querySelectorAll('*').length
      };
    });
    
    console.log('Page info:');
    console.log('  Title:', content.title);
    console.log('  Elements count:', content.elementsCount);
    console.log('  Body text preview:', content.bodyText);
    
    // Take screenshot
    const timestamp = Date.now();
    const filename = `playwright-simple-${timestamp}.png`;
    await page.screenshot({ 
      path: filename,
      fullPage: true 
    });
    console.log('✅ Screenshot saved:', filename);
    
    // Also save the HTML for debugging
    const html = await page.content();
    const htmlFile = `page-content-${timestamp}.html`;
    require('fs').writeFileSync(htmlFile, html);
    console.log('✅ HTML saved:', htmlFile);
    
    return filename;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

captureScreenshot().catch(console.error);