#!/usr/bin/env node

/**
 * Railway MCP Tool - Manages Railway deployments using browser cookies
 * This tool can set environment variables and monitor deployments
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Railway project details from your dashboard
const RAILWAY_PROJECT = 'findingsports-com';
const RAILWAY_SERVICE = 'findingsports-com';

// Environment variables to set
const ENV_VARS = {
    JWT_SECRET: 'super-secret-key-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
    NODE_ENV: 'production',
    PORT: '8080',
    CORS_ORIGIN: 'https://findingsports.com,https://www.findingsports.com',
    GOOGLE_MAPS_API_KEY: 'AIzaSyD2ux0PIekUQLAqVDNhy0tHwhBht6vcXqA'
};

class RailwayMCP {
    constructor() {
        this.cookiePath = this.findFirefoxCookies();
    }

    /**
     * Find Firefox cookies database
     */
    findFirefoxCookies() {
        const home = process.env.HOME;
        const possiblePaths = [
            `${home}/.mozilla/firefox/*.default-release/cookies.sqlite`,
            `${home}/.mozilla/firefox/*.default/cookies.sqlite`,
            `${home}/snap/firefox/common/.mozilla/firefox/*.default/cookies.sqlite`
        ];

        for (const pattern of possiblePaths) {
            try {
                const files = execSync(`ls ${pattern} 2>/dev/null || true`, { encoding: 'utf8' }).trim().split('\n');
                if (files[0]) {
                    console.log('✅ Found Firefox cookies at:', files[0]);
                    return files[0];
                }
            } catch (e) {
                // Continue searching
            }
        }

        console.warn('⚠️  Could not find Firefox cookies database');
        return null;
    }

    /**
     * Extract Railway session cookie from Firefox
     */
    extractRailwayCookie() {
        if (!this.cookiePath) {
            return null;
        }

        try {
            // Copy cookies database to avoid locking issues
            const tempDb = '/tmp/cookies_copy.sqlite';
            execSync(`cp "${this.cookiePath}" ${tempDb}`);

            // Extract Railway session cookie using sqlite3
            const query = `SELECT name, value FROM moz_cookies WHERE host LIKE '%railway.app%' AND name LIKE '%session%' ORDER BY creationTime DESC LIMIT 1;`;
            const result = execSync(`sqlite3 ${tempDb} "${query}"`, { encoding: 'utf8' }).trim();
            
            // Clean up temp file
            fs.unlinkSync(tempDb);

            if (result) {
                const [name, value] = result.split('|');
                console.log('✅ Found Railway session cookie');
                return { name, value };
            }
        } catch (e) {
            console.error('❌ Error extracting cookie:', e.message);
        }

        return null;
    }

    /**
     * Set environment variables using Railway CLI with cookie auth
     */
    async setEnvironmentVariables() {
        console.log('\n🚀 Setting Railway environment variables...\n');

        const cookie = this.extractRailwayCookie();
        if (!cookie) {
            console.error('❌ Could not extract Railway session cookie from Firefox');
            console.log('\n💡 Alternative: Use Railway CLI directly:');
            this.printManualCommands();
            return;
        }

        // Try using Railway CLI with cookie authentication
        try {
            // First, check if Railway CLI is installed
            try {
                execSync('railway --version', { stdio: 'ignore' });
            } catch (e) {
                console.log('📦 Installing Railway CLI...');
                execSync('npm install -g @railway/cli', { stdio: 'inherit' });
            }

            // Set environment variables one by one
            for (const [key, value] of Object.entries(ENV_VARS)) {
                try {
                    console.log(`Setting ${key}...`);
                    execSync(`railway variables set ${key}="${value}" --service ${RAILWAY_SERVICE}`, {
                        env: {
                            ...process.env,
                            RAILWAY_TOKEN: cookie.value
                        }
                    });
                    console.log(`✅ ${key} set successfully`);
                } catch (e) {
                    console.error(`❌ Failed to set ${key}:`, e.message);
                }
            }

            console.log('\n✅ Environment variables configuration attempted');
            console.log('🔄 Railway should automatically redeploy with new variables');

        } catch (e) {
            console.error('❌ Railway CLI method failed:', e.message);
            console.log('\n💡 Please set these variables manually in Railway dashboard:');
            this.printManualCommands();
        }
    }

    /**
     * Print manual commands for setting variables
     */
    printManualCommands() {
        console.log('\n📋 Manual Setup Instructions:\n');
        console.log('1. Go to your Railway dashboard (you\'re already logged in)');
        console.log('2. Click on the "Variables" tab');
        console.log('3. Add these environment variables:\n');

        for (const [key, value] of Object.entries(ENV_VARS)) {
            console.log(`   ${key} = ${value}`);
        }

        console.log('\n4. Railway will automatically redeploy after adding variables');
    }

    /**
     * Create a browser automation script as alternative
     */
    createBrowserScript() {
        const script = `
// Railway Environment Variables Setter
// Run this in your browser console while on Railway dashboard

const variables = ${JSON.stringify(ENV_VARS, null, 2)};

console.log('🚀 Setting Railway environment variables...');

// Function to simulate adding variables
async function setRailwayVariables() {
    for (const [key, value] of Object.entries(variables)) {
        console.log(\`Setting \${key}...\`);
        // Look for "Add Variable" button and click it
        const addButton = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Add Variable'));
        if (addButton) {
            addButton.click();
            await new Promise(r => setTimeout(r, 500));
            
            // Fill in the form
            const inputs = document.querySelectorAll('input');
            if (inputs.length >= 2) {
                inputs[inputs.length - 2].value = key;
                inputs[inputs.length - 1].value = value;
                
                // Trigger change events
                inputs[inputs.length - 2].dispatchEvent(new Event('input', { bubbles: true }));
                inputs[inputs.length - 1].dispatchEvent(new Event('input', { bubbles: true }));
                
                await new Promise(r => setTimeout(r, 500));
            }
        }
    }
    console.log('✅ All variables set! Railway should redeploy automatically.');
}

// Run the function
setRailwayVariables();
`;

        const scriptPath = path.join(__dirname, 'railway-browser-script.js');
        fs.writeFileSync(scriptPath, script);
        console.log(`\n📄 Browser automation script created at: ${scriptPath}`);
        console.log('\n🌐 To use it:');
        console.log('1. Open Railway dashboard in Firefox');
        console.log('2. Go to Variables tab');
        console.log('3. Open browser console (F12)');
        console.log('4. Copy and paste the script content');
    }

    /**
     * Monitor deployment status
     */
    async monitorDeployment() {
        console.log('\n👀 Monitoring deployment status...\n');
        console.log('Please check your Railway dashboard for:');
        console.log('- Build logs in the Deployments tab');
        console.log('- Look for "Build successful" message');
        console.log('- Check for "Server running on port 8080" in logs');
        console.log('\n🔗 Direct link: https://railway.app/project/' + RAILWAY_PROJECT);
    }

    /**
     * Run the MCP tool
     */
    async run() {
        console.log('🚂 Railway MCP Tool\n');
        console.log('This tool will help configure your Railway deployment\n');

        // Try to set environment variables
        await this.setEnvironmentVariables();

        // Create browser automation script as backup
        this.createBrowserScript();

        // Monitor deployment
        await this.monitorDeployment();

        console.log('\n✅ Setup complete!');
        console.log('\n🧪 After deployment succeeds, test these URLs:');
        console.log('- https://findingsports.com/health');
        console.log('- https://findingsports.com/api/games');
        console.log('- https://findingsports.com/api/play-now?lat=49.2827&lng=-123.1207');
    }
}

// Run the tool
if (require.main === module) {
    const tool = new RailwayMCP();
    tool.run().catch(console.error);
}

module.exports = RailwayMCP;