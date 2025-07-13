#!/usr/bin/env node

/**
 * Cache Busting Script for Railway Deployments
 * Updates all HTML files to include version query parameters on asset references
 * This forces browsers and CDNs to fetch the latest version of files
 */

const fs = require('fs');
const path = require('path');

// Generate version based on current timestamp
const VERSION = process.env.BUILD_VERSION || Date.now();

console.log(`🔄 Cache Busting Script - Version: ${VERSION}`);

// Patterns to match asset references in HTML
const patterns = [
    // Script tags
    {
        regex: /<script\s+src="([^"]+\.(js))"/gi,
        replacement: (match, url, ext) => {
            if (url.includes('?')) return match; // Already has query params
            return `<script src="${url}?v=${VERSION}"`;
        }
    },
    // Link tags (CSS)
    {
        regex: /<link\s+([^>]*href="[^"]+\.css"[^>]*)>/gi,
        replacement: (match, attrs) => {
            if (attrs.includes('?')) return match; // Already has query params
            return match.replace(/href="([^"]+)"/, `href="$1?v=${VERSION}"`);
        }
    },
    // Image tags
    {
        regex: /<img\s+([^>]*src="[^"]+\.(png|jpg|jpeg|gif|svg)"[^>]*)>/gi,
        replacement: (match, attrs) => {
            if (attrs.includes('?')) return match; // Already has query params
            return match.replace(/src="([^"]+)"/, `src="$1?v=${VERSION}"`);
        }
    }
];

// Find all HTML files
function findHtmlFiles(dir) {
    const htmlFiles = [];
    
    function traverse(currentPath) {
        const files = fs.readdirSync(currentPath);
        
        for (const file of files) {
            const fullPath = path.join(currentPath, file);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
                traverse(fullPath);
            } else if (stat.isFile() && file.endsWith('.html')) {
                htmlFiles.push(fullPath);
            }
        }
    }
    
    traverse(dir);
    return htmlFiles;
}

// Update HTML file with versioned assets
function updateHtmlFile(filePath) {
    console.log(`📄 Processing: ${filePath}`);
    
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Apply all patterns
    for (const pattern of patterns) {
        const originalContent = content;
        content = content.replace(pattern.regex, pattern.replacement);
        if (content !== originalContent) {
            modified = true;
        }
    }
    
    // Add deployment timestamp comment
    if (!content.includes('Deployment timestamp:')) {
        const timestamp = new Date().toISOString();
        content = content.replace(
            '<head>',
            `<head>\n        <!-- Deployment timestamp: ${timestamp} - Cache busted version ${VERSION} -->`
        );
        modified = true;
    }
    
    if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Updated: ${filePath}`);
    } else {
        console.log(`⏭️  Skipped: ${filePath} (already versioned)`);
    }
}

// Main execution
const mockupDir = path.join(__dirname);
const htmlFiles = findHtmlFiles(mockupDir);

console.log(`\n🔍 Found ${htmlFiles.length} HTML files to process\n`);

htmlFiles.forEach(updateHtmlFile);

console.log(`\n✨ Cache busting complete! Version: ${VERSION}`);
console.log('\n📝 Additional steps for Railway:');
console.log('1. Commit these changes: git add -A && git commit -m "Cache bust assets"');
console.log('2. Push to trigger Railway deployment: git push');
console.log('3. Set BUILD_VERSION environment variable in Railway for consistent versioning');
console.log('4. Clear browser cache and test in incognito mode');
console.log('5. If issues persist, use Railway CLI to restart the service: railway restart');