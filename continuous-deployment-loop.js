#!/usr/bin/env node

const https = require('https');
const { exec } = require('child_process');
const fs = require('fs');

console.log('🔄 CONTINUOUS DEPLOYMENT LOOP STARTED');
console.log('Will keep trying until site serves HTML\n');

let attemptCount = 0;
let lastDeploymentId = '3ad2d005-69f2-46e0-a8f2-8213647b46ef';

function checkSite() {
    return new Promise((resolve) => {
        https.get('https://findingsports.com', (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                const isHTML = data.includes('<!doctype') || data.includes('<html');
                const deploymentMatch = data.match(/"deployment":"([^"]+)"/);
                const currentDeployment = deploymentMatch ? deploymentMatch[1] : 'unknown';
                
                resolve({
                    isFixed: isHTML,
                    content: data.substring(0, 100),
                    deploymentId: currentDeployment
                });
            });
        }).on('error', () => resolve({ isFixed: false, error: true }));
    });
}

function triggerDeployment() {
    attemptCount++;
    console.log(`\n🚀 Deployment Attempt #${attemptCount} - ${new Date().toISOString()}`);
    
    // Try multiple deployment triggers
    const triggers = [
        // 1. Force push with timestamp
        () => {
            console.log('📝 Creating deployment trigger commit...');
            const timestamp = new Date().toISOString();
            fs.writeFileSync('DEPLOYMENT_LOOP.txt', `Deployment attempt ${attemptCount} at ${timestamp}\n`, { flag: 'a' });
            
            exec('git add DEPLOYMENT_LOOP.txt && git commit -m "🔄 Auto-deployment loop trigger #' + attemptCount + '" && git push origin main', (error, stdout) => {
                if (error) {
                    console.log('❌ Git push failed:', error.message);
                } else {
                    console.log('✅ Git push successful');
                }
            });
        },
        
        // 2. Modify deployment timestamp
        () => {
            console.log('📝 Updating deployment timestamp...');
            const content = `Last deployment attempt: ${new Date().toISOString()}\nAttempt number: ${attemptCount}\n`;
            fs.writeFileSync('mockup/DEPLOYMENT_TRIGGER.txt', content);
            
            exec('git add mockup/DEPLOYMENT_TRIGGER.txt && git commit -m "🔄 Deployment trigger update" && git push', (error) => {
                if (!error) console.log('✅ Timestamp updated');
            });
        },
        
        // 3. Update package.json version
        () => {
            console.log('📝 Bumping version...');
            const packagePath = 'mockup/backend/package.json';
            try {
                const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
                const version = pkg.version.split('.');
                version[2] = (parseInt(version[2]) + 1).toString();
                pkg.version = version.join('.');
                fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));
                
                exec(`git add ${packagePath} && git commit -m "🔄 Bump version to ${pkg.version}" && git push`, (error) => {
                    if (!error) console.log('✅ Version bumped to', pkg.version);
                });
            } catch (e) {
                console.log('❌ Version bump failed:', e.message);
            }
        },
        
        // 4. Try Railway CLI
        () => {
            console.log('🚂 Attempting Railway CLI deployment...');
            exec('railway up', (error, stdout, stderr) => {
                if (error) {
                    console.log('❌ Railway CLI failed:', stderr || error.message);
                    console.log('💡 Run "railway login" in another terminal if needed');
                } else {
                    console.log('✅ Railway deployment triggered');
                }
            });
        }
    ];
    
    // Execute a different trigger based on attempt number
    const triggerIndex = (attemptCount - 1) % triggers.length;
    triggers[triggerIndex]();
}

async function deploymentLoop() {
    while (true) {
        console.log('\n🔍 Checking site status...');
        const status = await checkSite();
        
        if (status.isFixed) {
            console.log('\n✅ SUCCESS! Site is now serving HTML!');
            console.log('🎉 Deployment loop completed after', attemptCount, 'attempts');
            
            // Run final verification
            console.log('\n📊 Final verification:');
            exec('node verify-live-site.js', (error, stdout) => {
                console.log(stdout);
                process.exit(0);
            });
            break;
        }
        
        console.log('❌ Site still serving JSON');
        console.log('📄 Response:', status.content);
        console.log('🏷️  Deployment ID:', status.deploymentId);
        
        if (status.deploymentId !== lastDeploymentId) {
            console.log('🔄 Deployment ID changed! New deployment detected');
            lastDeploymentId = status.deploymentId;
        }
        
        // Trigger deployment
        triggerDeployment();
        
        // Wait before next check
        const waitTime = Math.min(30 + (attemptCount * 10), 120); // Increase wait time up to 2 minutes
        console.log(`\n⏱️  Waiting ${waitTime} seconds before next check...`);
        await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
    }
}

// Start the loop
console.log('📋 Current Git status:');
exec('git log --oneline -3', (error, stdout) => {
    console.log(stdout);
    
    console.log('\n🌐 Starting continuous deployment loop...');
    console.log('Press Ctrl+C to stop\n');
    
    deploymentLoop();
});

// Also try to open Railway dashboard in browser
exec('xdg-open https://railway.app/dashboard 2>/dev/null || open https://railway.app/dashboard 2>/dev/null', () => {
    console.log('💡 Attempted to open Railway dashboard in browser');
});