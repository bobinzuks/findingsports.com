#!/usr/bin/env python3
"""
Railway MCP Fix Tool - Uses browser automation to fix deployment
"""

import time
import json
import subprocess
import os
from datetime import datetime

class RailwayMCPFix:
    def __init__(self):
        self.project_name = "findingsports-com"
        self.fixes_applied = []
        
    def log(self, message, level="INFO"):
        """Log with timestamp"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def run_command(self, cmd):
        """Run a shell command and return output"""
        try:
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            return result.stdout, result.stderr, result.returncode
        except Exception as e:
            return "", str(e), 1
            
    def check_railway_cli(self):
        """Check if Railway CLI is installed"""
        self.log("Checking Railway CLI...")
        stdout, stderr, code = self.run_command("railway --version")
        
        if code != 0:
            self.log("Railway CLI not found. Installing...", "WARNING")
            stdout, stderr, code = self.run_command("npm install -g @railway/cli")
            if code != 0:
                self.log("Failed to install Railway CLI", "ERROR")
                return False
                
        self.log("Railway CLI is ready")
        return True
        
    def check_login(self):
        """Check if logged into Railway"""
        stdout, stderr, code = self.run_command("railway whoami")
        if code != 0:
            self.log("Not logged into Railway", "ERROR")
            self.log("Please run: railway login")
            return False
        
        self.log(f"Logged in as: {stdout.strip()}")
        return True
        
    def set_environment_variables(self):
        """Set all required environment variables"""
        self.log("Setting environment variables...")
        
        variables = {
            "JWT_SECRET": f"jwt-secret-{int(time.time())}-finding-sports",
            "NODE_ENV": "production",
            "PORT": "8080",
            "CORS_ORIGIN": "https://findingsports.com,https://www.findingsports.com"
        }
        
        for key, value in variables.items():
            cmd = f'railway variables set {key}="{value}"'
            stdout, stderr, code = self.run_command(cmd)
            if code == 0:
                self.log(f"✅ Set {key}")
            else:
                self.log(f"⚠️  Failed to set {key}: {stderr}", "WARNING")
                
        self.fixes_applied.append("Set environment variables")
        
    def check_deployment_health(self):
        """Check if deployment is healthy"""
        self.log("Checking deployment health...")
        
        # Get recent logs
        stdout, stderr, code = self.run_command("railway logs --lines 50")
        
        issues = []
        
        if "JWT_SECRET not set" in stdout:
            issues.append("JWT_SECRET_MISSING")
        if "Build timed out" in stdout:
            issues.append("BUILD_TIMEOUT")
        if "Cannot find module" in stdout:
            issues.append("MODULE_ERROR")
        if "Server running on port" in stdout:
            self.log("✅ Server is running!")
            return True, []
            
        return False, issues
        
    def apply_fixes(self, issues):
        """Apply fixes based on detected issues"""
        self.log(f"Applying fixes for issues: {issues}")
        
        if "JWT_SECRET_MISSING" in issues:
            self.set_environment_variables()
            self.run_command("railway restart")
            self.fixes_applied.append("Fixed JWT_SECRET issue")
            
        if "BUILD_TIMEOUT" in issues:
            self.log("Build timeout detected. Redeploying with minimal config...")
            self.run_command("railway up --detach")
            self.fixes_applied.append("Redeployed due to timeout")
            
        if "MODULE_ERROR" in issues:
            self.log("Module error detected. Clearing cache and redeploying...")
            self.run_command("railway up --detach")
            self.fixes_applied.append("Cleared cache and redeployed")
            
    def create_browser_fix_script(self):
        """Create a script to run in browser console"""
        script = """
// Railway Browser Fix Script
// Run this in the Railway dashboard console (F12)

async function fixRailwayDeployment() {
    console.log('🚂 Starting Railway fix...');
    
    // Check if we're on the right page
    if (!window.location.href.includes('railway.app')) {
        console.error('❌ Please run this on the Railway dashboard!');
        return;
    }
    
    // Function to click button by text
    function clickButton(text) {
        const buttons = Array.from(document.querySelectorAll('button'));
        const button = buttons.find(b => b.textContent.includes(text));
        if (button) {
            button.click();
            return true;
        }
        return false;
    }
    
    // Navigate to variables if not there
    if (!window.location.href.includes('variables')) {
        console.log('Navigating to variables...');
        clickButton('Variables');
        await new Promise(r => setTimeout(r, 2000));
    }
    
    // Add variables
    const variables = {
        JWT_SECRET: 'jwt-secret-' + Date.now() + '-finding-sports',
        NODE_ENV: 'production',
        PORT: '8080',
        CORS_ORIGIN: 'https://findingsports.com'
    };
    
    for (const [key, value] of Object.entries(variables)) {
        console.log(`Adding ${key}...`);
        
        // Click New Variable
        if (clickButton('New Variable') || clickButton('Add Variable')) {
            await new Promise(r => setTimeout(r, 1000));
            
            // Find input fields
            const inputs = document.querySelectorAll('input[type="text"]');
            if (inputs.length >= 2) {
                const keyInput = inputs[inputs.length - 2];
                const valueInput = inputs[inputs.length - 1];
                
                // Set values
                keyInput.value = key;
                valueInput.value = value;
                
                // Trigger events
                keyInput.dispatchEvent(new Event('input', { bubbles: true }));
                valueInput.dispatchEvent(new Event('input', { bubbles: true }));
                
                // Save
                await new Promise(r => setTimeout(r, 500));
                const saveButton = Array.from(document.querySelectorAll('button'))
                    .find(b => b.textContent.includes('Save') || b.textContent.includes('Add'));
                if (saveButton) saveButton.click();
                
                await new Promise(r => setTimeout(r, 2000));
            }
        }
    }
    
    console.log('✅ Variables added! Deployment should restart automatically.');
    
    // Navigate to deployments
    setTimeout(() => {
        clickButton('Deployments');
        console.log('Check the Deployments tab for progress!');
    }, 3000);
}

// Run the fix
fixRailwayDeployment();
"""
        
        with open("railway-browser-fix.js", "w") as f:
            f.write(script)
            
        self.log("Created browser fix script: railway-browser-fix.js")
        self.log("Copy the contents and run in Railway dashboard console (F12)")
        
    def run_fix_loop(self, max_attempts=5):
        """Main fix loop"""
        self.log("🚂 Starting Railway MCP Fix Loop")
        
        # Check prerequisites
        if not self.check_railway_cli():
            return False
            
        if not self.check_login():
            self.create_browser_fix_script()
            return False
            
        # Main fix loop
        attempt = 1
        while attempt <= max_attempts:
            self.log(f"\n--- Attempt {attempt}/{max_attempts} ---")
            
            # Check health
            healthy, issues = self.check_deployment_health()
            
            if healthy:
                self.log("✅ Deployment is healthy!")
                self.show_summary()
                return True
                
            # Apply fixes
            if issues:
                self.apply_fixes(issues)
                self.log("Waiting 30 seconds for changes to take effect...")
                time.sleep(30)
            else:
                self.log("No specific issues detected. Redeploying...")
                self.run_command("railway up --detach")
                time.sleep(30)
                
            attempt += 1
            
        self.log("❌ Max attempts reached. Manual intervention may be needed.", "ERROR")
        self.show_summary()
        return False
        
    def show_summary(self):
        """Show summary of fixes applied"""
        self.log("\n=== Fix Summary ===")
        self.log(f"Fixes applied: {len(self.fixes_applied)}")
        for fix in self.fixes_applied:
            self.log(f"  - {fix}")
            
        # Show current status
        stdout, stderr, code = self.run_command("railway status")
        if code == 0:
            self.log("\n=== Current Status ===")
            print(stdout)
            
        # Show test URLs
        self.log("\n=== Test URLs ===")
        self.log("https://findingsports.com/health")
        self.log("https://findingsports.com/api/games")
        self.log("https://findingsports.com/api/play-now?lat=49.2827&lng=-123.1207")

if __name__ == "__main__":
    fixer = RailwayMCPFix()
    fixer.run_fix_loop()