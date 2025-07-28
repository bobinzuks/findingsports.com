const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

// HTML report template
function generateHTMLReport(results) {
    const timestamp = new Date().toLocaleString();
    
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Finding Sports - Cross-Browser Test Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: #f5f5f5;
            color: #333;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 30px;
        }
        h1 {
            color: #2c3e50;
            margin-bottom: 10px;
        }
        .timestamp {
            color: #7f8c8d;
            font-size: 14px;
            margin-bottom: 30px;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 40px;
        }
        .summary-card {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
        }
        .summary-card h3 {
            margin: 0 0 10px 0;
            color: #495057;
        }
        .pass-rate {
            font-size: 36px;
            font-weight: bold;
            margin: 10px 0;
        }
        .pass-rate.perfect { color: #27ae60; }
        .pass-rate.good { color: #f39c12; }
        .pass-rate.poor { color: #e74c3c; }
        .browser-section {
            margin-bottom: 40px;
            border: 1px solid #dee2e6;
            border-radius: 8px;
            overflow: hidden;
        }
        .browser-header {
            background: #343a40;
            color: white;
            padding: 15px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .browser-content {
            padding: 20px;
        }
        .test-group {
            margin-bottom: 30px;
        }
        .test-group h4 {
            color: #495057;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e9ecef;
        }
        .test-result {
            display: flex;
            align-items: center;
            padding: 10px;
            margin-bottom: 5px;
            background: #f8f9fa;
            border-radius: 5px;
        }
        .test-result.passed {
            border-left: 4px solid #27ae60;
        }
        .test-result.failed {
            border-left: 4px solid #e74c3c;
            background: #ffe6e6;
        }
        .test-icon {
            font-size: 20px;
            margin-right: 10px;
        }
        .test-name {
            flex: 1;
            font-weight: 500;
        }
        .test-details {
            color: #6c757d;
            font-size: 14px;
        }
        .screenshots {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        .screenshot {
            border: 1px solid #dee2e6;
            border-radius: 5px;
            overflow: hidden;
        }
        .screenshot img {
            width: 100%;
            height: auto;
            display: block;
        }
        .screenshot-label {
            background: #f8f9fa;
            padding: 10px;
            text-align: center;
            font-weight: 500;
            color: #495057;
        }
        .error-box {
            background: #ffe6e6;
            border: 1px solid #e74c3c;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
            color: #721c24;
        }
        .overall-summary {
            background: #e8f5e9;
            border: 2px solid #4caf50;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            margin-top: 40px;
        }
        .overall-summary.failed {
            background: #ffebee;
            border-color: #f44336;
        }
        .overall-summary h2 {
            margin: 0 0 10px 0;
            color: #2e7d32;
        }
        .overall-summary.failed h2 {
            color: #c62828;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #dee2e6;
        }
        th {
            background: #f8f9fa;
            font-weight: 600;
            color: #495057;
        }
        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
        }
        .badge.passed {
            background: #d4edda;
            color: #155724;
        }
        .badge.failed {
            background: #f8d7da;
            color: #721c24;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔬 Finding Sports - Cross-Browser Nuclear Fix Test Report</h1>
        <div class="timestamp">Generated: ${timestamp}</div>
        
        <div class="summary-grid">`;
    
    // Add summary cards for each browser
    for (const [browserType, data] of Object.entries(results)) {
        if (data.error) {
            html += `
            <div class="summary-card">
                <h3>${browserType.toUpperCase()}</h3>
                <div class="pass-rate poor">ERROR</div>
                <div>${data.error}</div>
            </div>`;
        } else {
            const passRate = (data.summary.passed / data.summary.total * 100).toFixed(1);
            const rateClass = passRate === '100.0' ? 'perfect' : passRate >= '80.0' ? 'good' : 'poor';
            
            html += `
            <div class="summary-card">
                <h3>${data.browser}</h3>
                <div class="pass-rate ${rateClass}">${passRate}%</div>
                <div>${data.summary.passed}/${data.summary.total} tests passed</div>
            </div>`;
        }
    }
    
    html += `</div>`;
    
    // Detailed results for each browser
    for (const [browserType, data] of Object.entries(results)) {
        if (data.error) {
            html += `
        <div class="browser-section">
            <div class="browser-header">
                <h3>${browserType.toUpperCase()}</h3>
                <span class="badge failed">ERROR</span>
            </div>
            <div class="browser-content">
                <div class="error-box">
                    <strong>Test Error:</strong> ${data.error}
                </div>
            </div>
        </div>`;
            continue;
        }
        
        const passRate = (data.summary.passed / data.summary.total * 100).toFixed(1);
        
        html += `
        <div class="browser-section">
            <div class="browser-header">
                <h3>${data.browser}</h3>
                <div>
                    <span class="badge ${passRate === '100.0' ? 'passed' : 'failed'}">
                        ${passRate}% Pass Rate
                    </span>
                </div>
            </div>
            <div class="browser-content">`;
        
        // Test results
        for (const [testKey, testGroup] of Object.entries(data.tests)) {
            html += `
                <div class="test-group">
                    <h4>${testGroup.name}</h4>`;
            
            for (const result of testGroup.results) {
                html += `
                    <div class="test-result ${result.passed ? 'passed' : 'failed'}">
                        <span class="test-icon">${result.passed ? '✅' : '❌'}</span>
                        <span class="test-name">${result.test}</span>
                        <span class="test-details">${result.details}</span>
                    </div>`;
            }
            
            html += `</div>`;
        }
        
        // Screenshots
        if (data.screenshots && Object.keys(data.screenshots).length > 0) {
            html += `
                <h4>Screenshots</h4>
                <div class="screenshots">`;
            
            for (const [label, screenshotPath] of Object.entries(data.screenshots)) {
                const relativePath = path.relative(path.dirname(path.join(__dirname, 'report.html')), screenshotPath);
                html += `
                    <div class="screenshot">
                        <img src="${relativePath}" alt="${label} screenshot">
                        <div class="screenshot-label">${label.charAt(0).toUpperCase() + label.slice(1)}</div>
                    </div>`;
            }
            
            html += `</div>`;
        }
        
        html += `
            </div>
        </div>`;
    }
    
    // Overall summary
    const allResults = Object.values(results).filter(r => !r.error);
    const totalTests = allResults.reduce((sum, r) => sum + r.summary.total, 0);
    const totalPassed = allResults.reduce((sum, r) => sum + r.summary.passed, 0);
    const overallPassRate = totalTests > 0 ? (totalPassed / totalTests * 100).toFixed(1) : '0.0';
    const allPassed = overallPassRate === '100.0';
    
    html += `
        <div class="overall-summary ${allPassed ? '' : 'failed'}">
            <h2>${allPassed ? '✅ All Tests Passed!' : '⚠️ Some Tests Failed'}</h2>
            <p>Overall Pass Rate: <strong>${overallPassRate}%</strong> (${totalPassed}/${totalTests} tests)</p>
        </div>
        
        <h3>Test Categories</h3>
        <table>
            <thead>
                <tr>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Critical</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>Language/Help Elements</strong></td>
                    <td>Verifies the nuclear fix successfully removes all language selectors and help elements</td>
                    <td><span class="badge passed">YES</span></td>
                </tr>
                <tr>
                    <td><strong>Map Rendering</strong></td>
                    <td>Ensures the map container exists and renders properly without gray boxes</td>
                    <td><span class="badge passed">YES</span></td>
                </tr>
                <tr>
                    <td><strong>Games Display</strong></td>
                    <td>Confirms games are loaded and displayed correctly from the API</td>
                    <td><span class="badge passed">YES</span></td>
                </tr>
                <tr>
                    <td><strong>DOM Cleanup</strong></td>
                    <td>Validates the nuclear DOM cleanup script is active and preventing injections</td>
                    <td><span class="badge passed">YES</span></td>
                </tr>
                <tr>
                    <td><strong>Performance</strong></td>
                    <td>Measures page load times and rendering performance</td>
                    <td><span class="badge failed">NO</span></td>
                </tr>
            </tbody>
        </table>
    </div>
</body>
</html>`;
    
    return html;
}

// Main function
async function generateReport() {
    try {
        const resultsPath = path.join(__dirname, 'test-results.json');
        
        if (!await fs.pathExists(resultsPath)) {
            console.error(chalk.red('❌ No test results found. Run the tests first with: npm test'));
            process.exit(1);
        }
        
        const results = await fs.readJson(resultsPath);
        const html = generateHTMLReport(results);
        
        const reportPath = path.join(__dirname, 'report.html');
        await fs.writeFile(reportPath, html);
        
        console.log(chalk.green(`✅ Report generated: ${reportPath}`));
        
        // Also generate a markdown summary
        const markdownPath = path.join(__dirname, 'report.md');
        const markdown = generateMarkdownSummary(results);
        await fs.writeFile(markdownPath, markdown);
        
        console.log(chalk.green(`✅ Markdown summary: ${markdownPath}`));
        
    } catch (error) {
        console.error(chalk.red('Error generating report:'), error);
        process.exit(1);
    }
}

// Generate markdown summary
function generateMarkdownSummary(results) {
    let md = `# Finding Sports - Cross-Browser Nuclear Fix Test Report

Generated: ${new Date().toLocaleString()}

## 🎯 Executive Summary

`;
    
    // Overall results
    const allResults = Object.values(results).filter(r => !r.error);
    const totalTests = allResults.reduce((sum, r) => sum + r.summary.total, 0);
    const totalPassed = allResults.reduce((sum, r) => sum + r.summary.passed, 0);
    const overallPassRate = totalTests > 0 ? (totalPassed / totalTests * 100).toFixed(1) : '0.0';
    
    md += `- **Overall Pass Rate:** ${overallPassRate}% (${totalPassed}/${totalTests} tests)
- **Browsers Tested:** ${Object.keys(results).length}
- **Critical Issues:** ${overallPassRate === '100.0' ? 'None' : 'See details below'}

## 📊 Browser Results

| Browser | Pass Rate | Tests Passed | Status |
|---------|-----------|--------------|---------|
`;
    
    for (const [browserType, data] of Object.entries(results)) {
        if (data.error) {
            md += `| ${browserType} | ERROR | - | ❌ ${data.error} |\n`;
        } else {
            const passRate = (data.summary.passed / data.summary.total * 100).toFixed(1);
            const status = passRate === '100.0' ? '✅ Perfect' : passRate >= '80.0' ? '⚠️ Good' : '❌ Failed';
            md += `| ${data.browser} | ${passRate}% | ${data.summary.passed}/${data.summary.total} | ${status} |\n`;
        }
    }
    
    md += `
## 🔍 Test Categories

### 1. Language/Help Elements Check
- **Purpose:** Verify the nuclear fix removes all language selectors and help elements
- **Critical:** Yes
- **Expected:** No visible language or help UI elements

### 2. Map Rendering Check
- **Purpose:** Ensure the map loads and renders without gray boxes
- **Critical:** Yes
- **Expected:** Map container exists with valid dimensions and rendering canvas

### 3. Games Display Check
- **Purpose:** Verify games are loaded and displayed from the API
- **Critical:** Yes
- **Expected:** Game cards visible, no loading indicators stuck, no errors

### 4. DOM Cleanup Verification
- **Purpose:** Confirm the nuclear DOM cleanup script is active
- **Critical:** Yes
- **Expected:** Nuclear fix loaded, elements being blocked, injections prevented

### 5. Performance Metrics
- **Purpose:** Measure page load and rendering performance
- **Critical:** No
- **Expected:** Fast load times and smooth rendering

## 📸 Screenshots

Screenshots are available in the \`screenshots/\` directory for each browser:
- \`initial.png\` - Page after initial load
- \`map.png\` - Map container screenshot
- \`final.png\` - Full page after all tests

## 🚀 Next Steps

`;
    
    if (overallPassRate === '100.0') {
        md += `✅ **All tests passed!** The nuclear fix is working correctly across all browsers.

### Deployment Ready
The application is ready for production deployment with the nuclear fixes in place.`;
    } else {
        md += `⚠️ **Some tests failed.** Review the detailed results above and:

1. Check failed tests in specific browsers
2. Review console errors in browser DevTools
3. Verify the nuclear fix scripts are loading properly
4. Test with the actual deployed URL if testing locally`;
    }
    
    return md;
}

// Run the report generator
generateReport();