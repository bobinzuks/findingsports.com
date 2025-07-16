// Script to update all cache-busting timestamps in index.html
const fs = require('fs');
const path = require('path');

const timestamp = Date.now();
const indexPath = path.join(__dirname, 'index.html');

// Read index.html
let html = fs.readFileSync(indexPath, 'utf8');

// Replace all ?v= timestamps with new ones
html = html.replace(/\?v=\d+/g, `?v=${timestamp}`);

// Also add timestamps to any URLs that don't have them
html = html.replace(/(href|src)="([^"]+\.(css|js))"/g, (match, attr, url) => {
    if (!url.includes('?')) {
        return `${attr}="${url}?v=${timestamp}"`;
    }
    return match;
});

// Write back
fs.writeFileSync(indexPath, html);

console.log(`Updated all cache-busting timestamps to: ${timestamp}`);
console.log('Railway should now be forced to reload all assets.');