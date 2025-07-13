// Aggressive cache bypass middleware for Railway CDN
const aggressiveCacheBypass = (req, res, next) => {
    // Set all possible cache-busting headers
    res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate, private, max-age=0, s-maxage=0, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Railway-CDN-Bypass': 'true',
        'X-Railway-Force-Refresh': 'true',
        'X-Accel-Expires': '0',
        'Surrogate-Control': 'no-store, max-age=0',
        'CDN-Cache-Control': 'no-cache',
        'Cloudflare-CDN-Cache-Control': 'no-cache',
        'X-Cache-Bypass': 'true',
        'X-No-Cache': 'true',
        'Vary': '*',
        'ETag': `"${Date.now()}-${Math.random()}"`,
        'Last-Modified': new Date().toUTCString()
    });
    
    // Add timestamp to all responses
    res.locals.deploymentTime = Date.now();
    
    // Log cache bypass attempt
    console.log(`[CACHE-BYPASS] ${req.method} ${req.path} at ${new Date().toISOString()}`);
    
    next();
};

module.exports = aggressiveCacheBypass;