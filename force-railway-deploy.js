#!/usr/bin/env node

// Force Railway deployment by making a small change and pushing

const fs = require('fs');
const { execSync } = require('child_process');

console.log('🚀 FORCING RAILWAY DEPLOYMENT...');

// Add deployment timestamp to force Railway to redeploy
const deploymentFile = 'mockup/deployment-timestamp.txt';
const timestamp = new Date().toISOString();

fs.writeFileSync(deploymentFile, `Last deployment forced at: ${timestamp}\n`);

console.log('📝 Created deployment timestamp:', timestamp);

try {
    // Git operations
    execSync('git add mockup/deployment-timestamp.txt', { stdio: 'inherit' });
    execSync(`git commit -m "🚀 Force Railway deployment - ${timestamp}"`, { stdio: 'inherit' });
    execSync('git push origin main', { stdio: 'inherit' });
    
    console.log('✅ Changes pushed to GitHub');
    console.log('⏳ Railway should start deploying automatically...');
    
    // Wait and check
    console.log('\n⏰ Waiting 60 seconds for deployment to start...');
    setTimeout(async () => {
        console.log('\n🔍 Checking live site...');
        
        try {
            const response = await fetch('https://findingsports.com');
            const html = await response.text();
            
            // Check for our changes
            const hasMapLibre = html.includes('maplibre-gl');
            const hasLanguageService = html.includes('language-service.js');
            
            console.log('\n📊 Verification Results:');
            console.log('MapLibre GL JS loaded:', hasMapLibre ? '✅ YES' : '❌ NO');
            console.log('Language service present:', hasLanguageService ? '⚠️  YES (should be disabled)' : '✅ NO');
            
            if (!hasMapLibre) {
                console.log('\n❌ MapLibre not found! The deployment may not have completed yet.');
                console.log('Please wait a few more minutes and check https://findingsports.com');
            } else {
                console.log('\n✅ Deployment appears successful!');
            }
            
        } catch (error) {
            console.error('Error checking site:', error.message);
        }
        
    }, 60000);
    
} catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
}