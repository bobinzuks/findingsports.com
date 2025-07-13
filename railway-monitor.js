#!/usr/bin/env node

/**
 * Railway Deployment Monitor
 * Continuously monitors the deployment status
 */

const https = require('https');
const { exec } = require('child_process');

class RailwayMonitor {
  constructor() {
    this.endpoints = [
      { name: 'Homepage', url: 'https://findingsports.com/', critical: true },
      { name: 'Health', url: 'https://findingsports.com/health', critical: true },
      { name: 'Play Now', url: 'https://findingsports.com/api/play-now', critical: true },
      { name: 'Venues', url: 'https://findingsports.com/api/venues', critical: true },
      { name: 'Sports', url: 'https://findingsports.com/api/sports', critical: true },
      { name: 'Games', url: 'https://findingsports.com/api/games', critical: false },
      { name: 'Login Page', url: 'https://findingsports.com/login.html', critical: false },
      { name: 'Dashboard', url: 'https://findingsports.com/dashboard.html', critical: false }
    ];
    this.checkInterval = 30000; // 30 seconds
    this.results = new Map();
  }

  async checkEndpoint(endpoint) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      https.get(endpoint.url, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const responseTime = Date.now() - startTime;
          const isSuccess = res.statusCode === 200;
          
          // Check for specific content
          let hasContent = false;
          if (endpoint.name === 'Health' && data.includes('status')) {
            hasContent = true;
          } else if (endpoint.url.includes('/api/') && data.startsWith('{')) {
            hasContent = true;
          } else if (data.includes('<!DOCTYPE html>') && !data.includes('Error')) {
            hasContent = true;
          }

          resolve({
            ...endpoint,
            status: res.statusCode,
            success: isSuccess,
            hasContent,
            responseTime,
            timestamp: new Date().toISOString()
          });
        });
      }).on('error', (err) => {
        resolve({
          ...endpoint,
          status: 'ERROR',
          success: false,
          hasContent: false,
          error: err.message,
          timestamp: new Date().toISOString()
        });
      });
    });
  }

  async checkAll() {
    console.log('🔍 Checking all endpoints...\n');
    
    const promises = this.endpoints.map(ep => this.checkEndpoint(ep));
    const results = await Promise.all(promises);
    
    // Update results
    results.forEach(result => {
      this.results.set(result.name, result);
    });

    return results;
  }

  displayResults() {
    console.clear();
    console.log('🚂 Railway Deployment Monitor - Finding Sports');
    console.log('Time:', new Date().toLocaleString());
    console.log('=' .repeat(60));
    
    let criticalPassed = 0;
    let criticalTotal = 0;
    let totalPassed = 0;

    // Display results
    this.results.forEach((result, name) => {
      const icon = result.success ? '✅' : '❌';
      const time = result.responseTime ? `${result.responseTime}ms` : 'N/A';
      
      if (result.critical) {
        criticalTotal++;
        if (result.success) criticalPassed++;
      }
      if (result.success) totalPassed++;

      console.log(`${icon} ${name.padEnd(15)} Status: ${result.status} (${time})`);
      
      if (!result.success && result.error) {
        console.log(`   └─ Error: ${result.error}`);
      }
      if (result.success && !result.hasContent) {
        console.log(`   └─ Warning: No valid content`);
      }
    });

    console.log('\n' + '=' .repeat(60));
    
    // Summary
    const allCriticalPassed = criticalPassed === criticalTotal;
    const deploymentStatus = allCriticalPassed ? '✅ DEPLOYED' : '🔄 DEPLOYING';
    
    console.log(`Status: ${deploymentStatus}`);
    console.log(`Critical Services: ${criticalPassed}/${criticalTotal} passing`);
    console.log(`Total Endpoints: ${totalPassed}/${this.results.size} passing`);
    
    if (allCriticalPassed) {
      console.log('\n🎉 All critical services are operational!');
      console.log('🏀 Finding Sports is ready for local drop-in games!');
    } else {
      console.log('\n⏳ Waiting for deployment to complete...');
      console.log('📝 Make sure you\'ve added environment variables in Railway');
    }

    console.log('\n' + '=' .repeat(60));
    console.log('Press Ctrl+C to stop monitoring');
  }

  async gitStatus() {
    return new Promise((resolve) => {
      exec('git log -1 --oneline', (error, stdout) => {
        if (error) {
          resolve('Unknown');
        } else {
          resolve(stdout.trim());
        }
      });
    });
  }

  async start() {
    console.log('🚀 Starting Railway Deployment Monitor...\n');
    
    // Initial check
    await this.checkAll();
    this.displayResults();

    // Continuous monitoring
    setInterval(async () => {
      await this.checkAll();
      this.displayResults();
    }, this.checkInterval);
  }
}

// Quick check mode
async function quickCheck() {
  console.log('🚀 Quick Railway Status Check\n');
  
  const monitor = new RailwayMonitor();
  const results = await monitor.checkAll();
  
  const critical = results.filter(r => r.critical);
  const passed = critical.filter(r => r.success).length;
  const total = critical.length;
  
  console.log('Critical Services:');
  critical.forEach(r => {
    const icon = r.success ? '✅' : '❌';
    console.log(`${icon} ${r.name}: ${r.status}`);
  });
  
  console.log(`\n${passed}/${total} critical services operational`);
  
  if (passed === total) {
    console.log('✅ Deployment successful!');
  } else {
    console.log('🔄 Deployment in progress...');
    console.log('\nRun with --monitor flag for continuous monitoring');
  }
}

// Main
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--monitor') || args.includes('-m')) {
    const monitor = new RailwayMonitor();
    monitor.start().catch(console.error);
  } else {
    quickCheck().catch(console.error);
  }
}

module.exports = RailwayMonitor;