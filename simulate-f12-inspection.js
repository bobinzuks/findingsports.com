const puppeteer = require('puppeteer-core');
const fs = require('fs');

async function simulateF12() {
    console.log('🔍 SIMULATING F12 DEVELOPER TOOLS INSPECTION');
    console.log('============================================\n');
    
    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/google-chrome',
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    });
    
    try {
        const page = await browser.newPage();
        
        // Enable console and error logging
        const logs = [];
        const errors = [];
        
        page.on('console', msg => {
            const text = msg.text();
            logs.push(`[${msg.type().toUpperCase()}] ${text}`);
            if (msg.type() === 'error') {
                errors.push(text);
            }
        });
        
        page.on('pageerror', err => {
            errors.push(`PAGE ERROR: ${err.toString()}`);
        });
        
        page.on('requestfailed', request => {
            errors.push(`REQUEST FAILED: ${request.url()} - ${request.failure().errorText}`);
        });
        
        console.log('Loading https://findingsports.com...\n');
        
        await page.goto('https://findingsports.com', {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        
        // Wait for any JavaScript to execute
        await page.waitForTimeout(3000);
        
        // Get computed styles and DOM info
        const diagnostics = await page.evaluate(() => {
            const body = document.body;
            const html = document.documentElement;
            
            // Check if body is hidden
            const bodyStyle = window.getComputedStyle(body);
            const htmlStyle = window.getComputedStyle(html);
            
            // Get all elements with display:none
            const hiddenElements = [];
            document.querySelectorAll('*').forEach(el => {
                const style = window.getComputedStyle(el);
                if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
                    hiddenElements.push({
                        tag: el.tagName,
                        id: el.id,
                        class: el.className,
                        display: style.display,
                        visibility: style.visibility,
                        opacity: style.opacity
                    });
                }
            });
            
            // Check what's visible
            const visibleText = document.body.innerText || '';
            
            // Get all stylesheets
            const stylesheets = Array.from(document.styleSheets).map(sheet => {
                try {
                    return {
                        href: sheet.href,
                        rules: sheet.cssRules ? sheet.cssRules.length : 0
                    };
                } catch (e) {
                    return { href: sheet.href, error: 'Cannot access' };
                }
            });
            
            // Check for specific issues
            return {
                bodyDisplay: bodyStyle.display,
                bodyVisibility: bodyStyle.visibility,
                bodyOpacity: bodyStyle.opacity,
                bodyBackground: bodyStyle.backgroundColor,
                htmlDisplay: htmlStyle.display,
                htmlBackground: htmlStyle.backgroundColor,
                visibleTextLength: visibleText.length,
                visibleTextSample: visibleText.substring(0, 100),
                hiddenElementsCount: hiddenElements.length,
                hiddenElements: hiddenElements.slice(0, 10),
                stylesheets: stylesheets,
                documentTitle: document.title,
                bodyClasses: body.className,
                bodyId: body.id,
                hasContent: body.children.length > 0,
                firstError: window.__firstError || null
            };
        });
        
        // Check for Nuclear Fix execution
        const nuclearFixActive = await page.evaluate(() => {
            return typeof window.NUCLEAR_FIX_ACTIVE !== 'undefined';
        });
        
        // Take a screenshot with DevTools open simulation
        await page.screenshot({ path: 'f12-screenshot.png', fullPage: true });
        
        // Generate F12 report
        console.log('📊 F12 DEVELOPER TOOLS REPORT');
        console.log('=============================\n');
        
        console.log('🎨 BODY STYLES:');
        console.log(`  Display: ${diagnostics.bodyDisplay}`);
        console.log(`  Visibility: ${diagnostics.bodyVisibility}`);
        console.log(`  Opacity: ${diagnostics.bodyOpacity}`);
        console.log(`  Background: ${diagnostics.bodyBackground}`);
        console.log(`  Classes: ${diagnostics.bodyClasses || 'none'}`);
        
        console.log('\n📝 CONTENT:');
        console.log(`  Visible text length: ${diagnostics.visibleTextLength} characters`);
        console.log(`  Has DOM content: ${diagnostics.hasContent ? 'Yes' : 'No'}`);
        console.log(`  Document title: ${diagnostics.documentTitle}`);
        
        if (diagnostics.visibleTextLength > 0) {
            console.log(`  Text sample: "${diagnostics.visibleTextSample}"`);
        }
        
        console.log('\n🚫 HIDDEN ELEMENTS:');
        console.log(`  Total hidden: ${diagnostics.hiddenElementsCount}`);
        if (diagnostics.hiddenElements.length > 0) {
            diagnostics.hiddenElements.forEach(el => {
                console.log(`  - <${el.tag}> ${el.id ? `#${el.id}` : ''} ${el.class ? `.${el.class}` : ''}`);
                console.log(`    display: ${el.display}, visibility: ${el.visibility}, opacity: ${el.opacity}`);
            });
        }
        
        console.log('\n🔴 CONSOLE ERRORS:');
        if (errors.length === 0) {
            console.log('  No errors found');
        } else {
            errors.forEach(err => console.log(`  ❌ ${err}`));
        }
        
        console.log('\n📜 CONSOLE LOGS:');
        if (logs.length === 0) {
            console.log('  No console output');
        } else {
            logs.slice(0, 20).forEach(log => console.log(`  ${log}`));
        }
        
        console.log('\n💉 SCRIPT INJECTION:');
        console.log(`  Nuclear Fix Active: ${nuclearFixActive ? 'Yes' : 'No'}`);
        
        // The smoking gun - find what's making it white
        console.log('\n🔍 ROOT CAUSE ANALYSIS:');
        
        if (diagnostics.bodyDisplay === 'none' || diagnostics.htmlDisplay === 'none') {
            console.log('  ❌ BODY OR HTML IS HIDDEN!');
        } else if (diagnostics.visibleTextLength === 0) {
            console.log('  ❌ NO VISIBLE TEXT - All content is hidden!');
        } else if (!diagnostics.hasContent) {
            console.log('  ❌ BODY HAS NO CONTENT!');
        } else {
            console.log('  ✅ Page structure seems OK');
        }
        
        // Save detailed report
        const report = {
            timestamp: new Date().toISOString(),
            url: 'https://findingsports.com',
            diagnostics,
            errors,
            logs: logs.slice(0, 50),
            nuclearFixActive
        };
        
        fs.writeFileSync('f12-inspection-report.json', JSON.stringify(report, null, 2));
        console.log('\n💾 Full report saved to f12-inspection-report.json');
        
    } catch (error) {
        console.error('❌ Error during inspection:', error);
    } finally {
        await browser.close();
    }
}

simulateF12().catch(console.error);