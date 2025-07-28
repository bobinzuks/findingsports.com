#!/usr/bin/env node

const https = require('https');
const { JSDOM } = require('jsdom');

async function deepInspect() {
    console.log('🔍 Deep DOM Inspector for Finding Sports');
    console.log('=======================================\n');
    
    return new Promise((resolve, reject) => {
        https.get('https://findingsports.com', (res) => {
            let data = '';
            
            res.on('data', chunk => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log('📄 HTML Size:', data.length, 'bytes\n');
                
                // Check for our scripts
                console.log('🔍 Script Inclusion Check:');
                console.log('ultimate-nuclear-fix.js:', data.includes('ultimate-nuclear-fix.js') ? '✅ FOUND' : '❌ NOT FOUND');
                console.log('aggressive-header-cleaner.js:', data.includes('aggressive-header-cleaner.js') ? '✅ FOUND' : '❌ NOT FOUND');
                console.log('nuclear-override.css:', data.includes('nuclear-override.css') ? '✅ FOUND' : '❌ NOT FOUND');
                console.log('inline nuclear fix:', data.includes('INLINE NUCLEAR FIX') ? '✅ FOUND' : '❌ NOT FOUND');
                
                // Check for unwanted elements
                console.log('\n🚫 Unwanted Elements Check:');
                console.log('Language selector (🌐):', data.includes('🌐') ? '❌ STILL EXISTS' : '✅ REMOVED');
                console.log('English text:', data.includes('>English<') ? '❌ STILL EXISTS' : '✅ REMOVED');
                console.log('Help button:', data.includes('>Help<') ? '❌ STILL EXISTS' : '✅ REMOVED');
                console.log('Online indicator:', data.includes('>Online<') ? '❌ STILL EXISTS' : '✅ REMOVED');
                
                // Check for wanted elements
                console.log('\n✅ Required Elements Check:');
                console.log('Login button/text:', data.includes('Login') || data.includes('login') ? '✅ FOUND' : '❌ NOT FOUND');
                console.log('Map container:', data.includes('id="map"') ? '✅ FOUND' : '❌ NOT FOUND');
                console.log('MapLibre script:', data.includes('maplibre-gl.js') ? '✅ FOUND' : '❌ NOT FOUND');
                
                // Extract header content
                const headerMatch = data.match(/<header[^>]*>([\s\S]*?)<\/header>/i);
                if (headerMatch) {
                    console.log('\n📋 Header Content:');
                    console.log(headerMatch[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 200) + '...');
                }
                
                resolve(data);
            });
        }).on('error', reject);
    });
}

// Install jsdom if needed: npm install jsdom
deepInspect().catch(console.error);