#!/usr/bin/env node

// Quick test script for rapid nuclear fix validation
const { chromium } = require('playwright');
const chalk = require('chalk');
const path = require('path');

async function quickTest() {
    console.log(chalk.bold.cyan('⚡ Finding Sports - Quick Nuclear Fix Test\n'));
    
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    try {
        // Navigate to local mockup
        const url = 'file://' + path.join(__dirname, '..', 'mockup', 'index.html');
        console.log(chalk.gray(`Testing: ${url}\n`));
        
        await page.goto(url, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);
        
        // Quick checks
        const checks = {
            'No Language Elements': async () => {
                const langElements = await page.$$('[class*="language"], [id*="language"], .help-btn');
                return langElements.length === 0;
            },
            'Map Container Exists': async () => {
                const map = await page.$('#map');
                return !!map;
            },
            'Nuclear Fix Active': async () => {
                return await page.evaluate(() => {
                    return typeof window.NUCLEAR_DOM_CLEANUP !== 'undefined';
                });
            },
            'No Console Errors': async () => {
                const errors = [];
                page.on('console', msg => {
                    if (msg.type() === 'error') errors.push(msg.text());
                });
                await page.reload();
                await page.waitForTimeout(1000);
                return errors.length === 0;
            }
        };
        
        // Run checks
        let passed = 0;
        let total = 0;
        
        for (const [name, check] of Object.entries(checks)) {
            total++;
            try {
                const result = await check();
                if (result) {
                    console.log(chalk.green(`✅ ${name}`));
                    passed++;
                } else {
                    console.log(chalk.red(`❌ ${name}`));
                }
            } catch (error) {
                console.log(chalk.red(`❌ ${name} - Error: ${error.message}`));
            }
        }
        
        // Summary
        const passRate = (passed / total * 100).toFixed(0);
        console.log(chalk.bold(`\n📊 Quick Test Result: ${passRate}% (${passed}/${total})\n`));
        
        if (passed === total) {
            console.log(chalk.green.bold('✅ Nuclear fix is working! Safe to proceed.\n'));
            process.exit(0);
        } else {
            console.log(chalk.red.bold('❌ Issues detected! Run full test suite for details.\n'));
            process.exit(1);
        }
        
    } catch (error) {
        console.error(chalk.red('Test failed:'), error);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

// Run if called directly
if (require.main === module) {
    quickTest().catch(console.error);
}

module.exports = quickTest;