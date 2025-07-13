// No-Cache Middleware for Railway
// Forces all responses to bypass CDN and browser caches

module.exports = function noCacheMiddleware(req, res, next) {
    // Disable all caching
    res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate, private',
        'Pragma': 'no-cache',
        'Expires': '0',
        'ETag': '',
        'Last-Modified': '',
        'X-Deployment-Time': new Date().toISOString(),
        'X-Cache-Disabled': 'true'
    });
    
    // Remove ETag header completely
    res.removeHeader('ETag');
    res.removeHeader('Last-Modified');
    
    console.log(`[NoCache] ${req.method} ${req.path} - Cache disabled`);
    next();
};