#!/usr/bin/env node
// Visual Element Test - Check for actual visible elements, not code

const https = require('https');
const { JSDOM } = require('jsdom');

const SITE_URL = 'https://findingsports.com';

async function fetchAndParse(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

async function testVisualElements() {
    console.log('🔍 Visual Element Test - Checking actual rendered elements\n');
    
    try {
        const html = await fetchAndParse(SITE_URL);
        
        // Check if we're getting the nuclear fix
        const hasNuclearFix = html.includes('ultimate-nuclear-fix-v5.js');
        console.log(`Nuclear Fix v5 deployed: ${hasNuclearFix ? '✅ YES' : '❌ NO'}`);
        
        // Look for actual UI elements in header/nav areas
        const headerMatch = html.match(/<header[^>]*>([\s\S]*?)<\/header>/i);
        const navMatch = html.match(/<nav[^>]*>([\s\S]*?)<\/nav>/i);
        
        if (headerMatch || navMatch) {
            const headerContent = (headerMatch ? headerMatch[1] : '') + (navMatch ? navMatch[1] : '');
            
            // Check for visible button/link elements with unwanted text
            const visibleLanguage = /<(button|a|span|div)[^>]*>[^<]*🌐[^<]*<\/\1>/.test(headerContent) ||
                                   /<(button|a|span|div)[^>]*>[^<]*English[^<]*▼[^<]*<\/\1>/.test(headerContent);
            
            const visibleHelp = /<(button|a|span|div)[^>]*>[^<]*\?[^<]*Help[^<]*<\/\1>/.test(headerContent) ||
                               /<(button|a|span|div)[^>]*>[^<]*Help[^<]*<\/\1>/.test(headerContent);
            
            const visibleOnline = /<(button|a|span|div)[^>]*>[^<]*Online[^<]*<\/\1>/.test(headerContent);
            
            console.log('\nHeader/Nav Analysis:');
            console.log(`Language selector visible: ${visibleLanguage ? '❌ YES' : '✅ NO'}`);
            console.log(`Help button visible: ${visibleHelp ? '❌ YES' : '✅ NO'}`);
            console.log(`Online status visible: ${visibleOnline ? '❌ YES' : '✅ NO'}`);
            
            if (!visibleLanguage && !visibleHelp && !visibleOnline) {
                console.log('\n✅ SUCCESS: No unwanted elements found in header!');
                return true;
            }
        }
        
        // Check the actual header content
        console.log('\nActual header content preview:');
        const headerPreview = html.match(/<header[^>]*>[\s\S]{0,500}/);
        if (headerPreview) {
            console.log(headerPreview[0].replace(/<[^>]+>/g, ' ').trim().substring(0, 200) + '...');
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

// Check if jsdom is available
try {
    require('jsdom');
    testVisualElements();
} catch (e) {
    // Fallback without jsdom
    console.log('Running simple check without jsdom...\n');
    
    fetchAndParse(SITE_URL).then(html => {
        // Simple regex check for actual button/link elements
        const headerSection = html.match(/<header[\s\S]*?<\/header>/i);
        if (headerSection) {
            const header = headerSection[0];
            
            // Look for actual clickable elements with unwanted text
            const hasLanguageBtn = /<(button|a)[^>]*>[^<]*(🌐|Language|English[^<]*▼)[^<]*<\//i.test(header);
            const hasHelpBtn = /<(button|a)[^>]*>[^<]*(Help|\?)[^<]*<\//i.test(header);
            const hasOnlineStatus = /<(span|div)[^>]*>[^<]*Online[^<]*<\//i.test(header);
            
            console.log('Header Element Check:');
            console.log(`Language button: ${hasLanguageBtn ? '❌ Found' : '✅ Not found'}`);
            console.log(`Help button: ${hasHelpBtn ? '❌ Found' : '✅ Not found'}`);
            console.log(`Online status: ${hasOnlineStatus ? '❌ Found' : '✅ Not found'}`);
            
            if (!hasLanguageBtn && !hasHelpBtn && !hasOnlineStatus) {
                console.log('\n🎉 All unwanted elements successfully removed!');
            } else {
                console.log('\n⚠️  Some unwanted elements may still be present');
                
                // Show what was found
                if (hasLanguageBtn) {
                    const match = header.match(/<(button|a)[^>]*>[^<]*(🌐|Language|English[^<]*▼)[^<]*<\//i);
                    if (match) console.log('Found language element:', match[0]);
                }
            }
        }
    }).catch(console.error);
}