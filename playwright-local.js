const { chromium } = require('playwright');

async function captureScreenshot() {
  console.log('🚀 Capturing Local Site');
  console.log('========================');
  
  const browser = await chromium.launch({
    headless: false, // Show browser to see what's happening
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Try local site first
    console.log('Loading http://localhost:8080...');
    const response = await page.goto('http://localhost:8080', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    console.log('Response status:', response.status());
    
    // Wait for content to load
    await page.waitForTimeout(3000);
    
    // Get page info
    const content = await page.evaluate(() => {
      return {
        title: document.title || '(no title)',
        bodyText: document.body ? document.body.innerText.substring(0, 500) : '(no text)',
        hasContent: document.querySelector('main') || document.querySelector('.container') || document.querySelector('#app'),
        elementsCount: document.querySelectorAll('*').length,
        backgroundColor: window.getComputedStyle(document.body).backgroundColor
      };
    });
    
    console.log('Page info:');
    console.log('  Title:', content.title);
    console.log('  Elements count:', content.elementsCount);
    console.log('  Has main content:', !!content.hasContent);
    console.log('  Background color:', content.backgroundColor);
    console.log('  Body text preview:', content.bodyText.substring(0, 100));
    
    // Take screenshot
    const timestamp = Date.now();
    const localFile = `local-working-${timestamp}.png`;
    await page.screenshot({ 
      path: localFile,
      fullPage: true 
    });
    console.log('✅ Local screenshot saved:', localFile);
    
    // Now try the production site
    console.log('\nLoading https://findingsports.com...');
    const prodResponse = await page.goto('https://findingsports.com', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    console.log('Production response status:', prodResponse.status());
    
    await page.waitForTimeout(3000);
    
    const prodContent = await page.evaluate(() => {
      return {
        title: document.title || '(no title)',
        bodyText: document.body ? document.body.innerText.substring(0, 500) : '(no text)',
        hasContent: document.querySelector('main') || document.querySelector('.container') || document.querySelector('#app'),
        elementsCount: document.querySelectorAll('*').length,
        backgroundColor: window.getComputedStyle(document.body).backgroundColor
      };
    });
    
    console.log('\nProduction page info:');
    console.log('  Title:', prodContent.title);
    console.log('  Elements count:', prodContent.elementsCount);
    console.log('  Has main content:', !!prodContent.hasContent);
    console.log('  Background color:', prodContent.backgroundColor);
    console.log('  Body text preview:', prodContent.bodyText.substring(0, 100));
    
    const prodFile = `production-${timestamp}.png`;
    await page.screenshot({ 
      path: prodFile,
      fullPage: true 
    });
    console.log('✅ Production screenshot saved:', prodFile);
    
    console.log('\n📊 COMPARISON:');
    console.log('Local elements:', content.elementsCount, 'vs Production:', prodContent.elementsCount);
    console.log('Local has content:', !!content.hasContent, 'vs Production:', !!prodContent.hasContent);
    
    // Keep browser open for 5 seconds to see the page
    await page.waitForTimeout(5000);
    
    return { localFile, prodFile };
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

captureScreenshot().catch(console.error);