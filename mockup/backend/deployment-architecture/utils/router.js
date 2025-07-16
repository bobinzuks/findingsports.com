const url = require('url');

class Router {
    constructor() {
        this.routes = new Map();
        this.patterns = [];
    }
    
    register(method, path, handler) {
        const key = `${method.toUpperCase()}:${path}`;
        this.routes.set(key, handler);
    }
    
    registerPattern(pattern, handler) {
        this.patterns.push({ pattern, handler });
    }
    
    async handle(req, res) {
        const parsedUrl = url.parse(req.url, true);
        const pathname = parsedUrl.pathname;
        const method = req.method.toUpperCase();
        
        // Try exact match first
        const key = `${method}:${pathname}`;
        const handler = this.routes.get(key);
        
        if (handler) {
            req.query = parsedUrl.query;
            req.pathname = pathname;
            await handler(req, res);
            return true;
        }
        
        // Try pattern matches
        for (const { pattern, handler } of this.patterns) {
            if (pattern.test(pathname)) {
                req.query = parsedUrl.query;
                req.pathname = pathname;
                await handler(req, res);
                return true;
            }
        }
        
        return false;
    }
    
    listRoutes() {
        const routes = [];
        
        // Add exact routes
        this.routes.forEach((handler, key) => {
            const [method, path] = key.split(':');
            routes.push({ method, path, type: 'exact' });
        });
        
        // Add pattern routes
        this.patterns.forEach(({ pattern }) => {
            routes.push({ 
                method: 'ALL', 
                path: pattern.toString(), 
                type: 'pattern' 
            });
        });
        
        return routes;
    }
}

// Route parameter parser
class RouteParser {
    static parseParams(pattern, pathname) {
        const params = {};
        const patternParts = pattern.split('/');
        const pathParts = pathname.split('/');
        
        if (patternParts.length !== pathParts.length) {
            return null;
        }
        
        for (let i = 0; i < patternParts.length; i++) {
            const patternPart = patternParts[i];
            const pathPart = pathParts[i];
            
            if (patternPart.startsWith(':')) {
                const paramName = patternPart.substring(1);
                params[paramName] = pathPart;
            } else if (patternPart !== pathPart) {
                return null;
            }
        }
        
        return params;
    }
}

module.exports = { Router, RouteParser };