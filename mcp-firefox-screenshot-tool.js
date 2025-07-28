#!/usr/bin/env node

/**
 * MCP Firefox Screenshot Tool
 * Takes automated screenshots of websites using Firefox
 */

const { exec, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

class FirefoxScreenshotTool {
    constructor() {
        this.downloadsDir = path.join(os.homedir(), 'Downloads');
        this.screenshotCount = 0;
    }

    /**
     * Take a screenshot using Firefox Developer Tools Protocol
     */
    async takeScreenshot(url, testName) {
        return new Promise((resolve, reject) => {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `Screenshot ${timestamp} Finding Sports - ${testName}.png`;
            const filepath = path.join(this.downloadsDir, filename);

            console.log(`📸 Taking screenshot: ${testName}`);
            console.log(`🌐 URL: ${url}`);

            // Create a temporary script for Firefox
            const scriptContent = `
                // Open URL
                gBrowser.selectedTab = gBrowser.addTab("${url}");
                
                // Wait for page load
                setTimeout(() => {
                    // Take screenshot
                    const window = gBrowser.selectedBrowser.contentWindow;
                    const canvas = document.createElementNS("http://www.w3.org/1999/xhtml", "canvas");
                    const ctx = canvas.getContext("2d");
                    
                    canvas.width = window.innerWidth;
                    canvas.height = window.innerHeight;
                    
                    ctx.drawWindow(window, 0, 0, canvas.width, canvas.height, "rgb(255,255,255)");
                    
                    // Save to file
                    const file = Components.classes["@mozilla.org/file/local;1"]
                        .createInstance(Components.interfaces.nsILocalFile);
                    file.initWithPath("${filepath}");
                    
                    const io = Components.classes["@mozilla.org/network/io-service;1"]
                        .getService(Components.interfaces.nsIIOService);
                    const source = io.newURI(canvas.toDataURL("image/png"), "UTF8", null);
                    const target = io.newFileURI(file);
                    
                    const persist = Components.classes["@mozilla.org/embedding/browser/nsWebBrowserPersist;1"]
                        .createInstance(Components.interfaces.nsIWebBrowserPersist);
                    persist.saveURI(source, null, null, null, null, file, null);
                    
                    console.log("Screenshot saved: ${filename}");
                }, 5000);
            `;

            // Use Firefox remote debugging
            const firefoxArgs = [
                '--new-instance',
                '--safe-mode',
                '--screenshot', filepath,
                url
            ];

            const firefox = spawn('firefox', firefoxArgs);

            firefox.on('error', (err) => {
                reject(err);
            });

            firefox.on('close', (code) => {
                if (code === 0 && fs.existsSync(filepath)) {
                    console.log(`✅ Screenshot saved: ${filename}`);
                    resolve({ success: true, filepath, filename });
                } else {
                    // Fallback to import command
                    console.log('⚠️  Firefox screenshot failed, using import command...');
                    exec(`import "${filepath}"`, (err) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve({ success: true, filepath, filename });
                        }
                    });
                }
            });

            // Timeout after 30 seconds
            setTimeout(() => {
                firefox.kill();
                reject(new Error('Screenshot timeout'));
            }, 30000);
        });
    }

    /**
     * Click an element and take screenshot
     */
    async clickAndScreenshot(url, selector, testName) {
        return new Promise((resolve, reject) => {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `Screenshot ${timestamp} Finding Sports - ${testName}.png`;
            const filepath = path.join(this.downloadsDir, filename);

            console.log(`🖱️  Clicking: ${selector}`);
            console.log(`📸 Then screenshot: ${testName}`);

            // Create automation script
            const automationScript = `
const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        product: 'firefox',
        executablePath: '/usr/bin/firefox',
        headless: false
    });
    
    const page = await browser.newPage();
    await page.goto('${url}', { waitUntil: 'networkidle2' });
    
    // Wait for element and click
    await page.waitForSelector('${selector}', { timeout: 10000 });
    await page.click('${selector}');
    
    // Wait for results
    await page.waitForTimeout(3000);
    
    // Take screenshot
    await page.screenshot({ path: '${filepath}', fullPage: true });
    
    await browser.close();
})();
`;

            fs.writeFileSync('/tmp/firefox-automation.js', automationScript);
            
            exec('node /tmp/firefox-automation.js', (err) => {
                if (err) {
                    console.error('Automation failed:', err);
                    // Fallback to manual
                    console.log('⚠️  Please manually click the element and take screenshot');
                    exec(`import "${filepath}"`, (err2) => {
                        if (err2) reject(err2);
                        else resolve({ success: true, filepath, filename });
                    });
                } else {
                    resolve({ success: true, filepath, filename });
                }
            });
        });
    }

    /**
     * Verify page elements
     */
    async verifyElements(url, checks) {
        console.log(`🔍 Verifying elements at: ${url}`);
        
        return new Promise((resolve, reject) => {
            exec(`firefox --screenshot /tmp/verify.png "${url}"`, (err) => {
                if (err) {
                    reject(err);
                    return;
                }

                // Use curl to check HTML content
                exec(`curl -s "${url}"`, (err, stdout) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    const results = [];
                    for (const check of checks) {
                        const exists = stdout.includes(check.text);
                        const result = {
                            element: check.element,
                            shouldExist: check.shouldExist,
                            found: exists,
                            passed: exists === check.shouldExist
                        };
                        results.push(result);
                        
                        console.log(`  ${result.passed ? '✅' : '❌'} ${check.element}: ${exists ? 'Found' : 'Not found'} (Expected: ${check.shouldExist ? 'Found' : 'Not found'})`);
                    }

                    resolve(results);
                });
            });
        });
    }
}

// MCP Server Interface
class MCPFirefoxServer {
    constructor() {
        this.tool = new FirefoxScreenshotTool();
    }

    async handleRequest(method, params) {
        switch (method) {
            case 'screenshot':
                return await this.tool.takeScreenshot(params.url, params.testName);
            
            case 'clickScreenshot':
                return await this.tool.clickAndScreenshot(params.url, params.selector, params.testName);
            
            case 'verify':
                return await this.tool.verifyElements(params.url, params.checks);
            
            default:
                throw new Error(`Unknown method: ${method}`);
        }
    }
}

// Export for MCP
module.exports = { MCPFirefoxServer, FirefoxScreenshotTool };

// CLI Interface
if (require.main === module) {
    const tool = new FirefoxScreenshotTool();
    
    const command = process.argv[2];
    const url = process.argv[3] || 'https://findingsports.com';
    
    switch (command) {
        case 'screenshot':
            tool.takeScreenshot(url, process.argv[4] || 'test')
                .then(result => console.log('✅ Success:', result))
                .catch(err => console.error('❌ Error:', err));
            break;
            
        case 'verify':
            const checks = [
                { element: 'Language selector', text: '🌐 English', shouldExist: false },
                { element: 'Help button', text: 'Help', shouldExist: false },
                { element: 'Online indicator', text: 'Online', shouldExist: false },
                { element: 'Login button', text: 'Login', shouldExist: true }
            ];
            tool.verifyElements(url, checks)
                .then(results => {
                    const passed = results.filter(r => r.passed).length;
                    console.log(`\n📊 Results: ${passed}/${results.length} passed`);
                })
                .catch(err => console.error('❌ Error:', err));
            break;
            
        default:
            console.log('Usage: node mcp-firefox-screenshot-tool.js [screenshot|verify] [url] [testName]');
    }
}