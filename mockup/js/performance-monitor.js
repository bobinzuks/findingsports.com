// Performance monitoring and optimization for Finding Sports
(function() {
    'use strict';

    // Performance monitoring class
    class PerformanceMonitor {
        constructor() {
            this.metrics = {
                pageLoad: null,
                mapLoad: null,
                loginInit: null,
                resourceLoad: {},
                userInteractions: []
            };
            this.observers = [];
            this.init();
        }

        init() {
            this.observePageLoad();
            this.observeResourceLoad();
            this.observeLongTasks();
            this.observeLayoutShifts();
            this.setupErrorTracking();
        }

        observePageLoad() {
            // Track page load performance
            window.addEventListener('load', () => {
                const navigation = performance.getEntriesByType('navigation')[0];
                if (navigation) {
                    this.metrics.pageLoad = {
                        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
                        totalTime: navigation.loadEventEnd - navigation.fetchStart,
                        timestamp: Date.now()
                    };
                    
                    // Report slow page loads
                    if (this.metrics.pageLoad.totalTime > 3000) {
                        console.warn('Slow page load detected:', this.metrics.pageLoad);
                    }
                }
            });
        }

        observeResourceLoad() {
            // Monitor resource loading times
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach(entry => {
                    if (entry.entryType === 'resource') {
                        const resourceType = this.getResourceType(entry.name);
                        const loadTime = entry.responseEnd - entry.startTime;
                        
                        if (!this.metrics.resourceLoad[resourceType]) {
                            this.metrics.resourceLoad[resourceType] = [];
                        }
                        
                        this.metrics.resourceLoad[resourceType].push({
                            name: entry.name,
                            loadTime: loadTime,
                            size: entry.transferSize || 0,
                            timestamp: Date.now()
                        });
                        
                        // Alert on slow resources
                        if (loadTime > 2000) {
                            console.warn(`Slow resource load: ${entry.name} (${loadTime.toFixed(2)}ms)`);
                        }
                    }
                });
            });
            
            observer.observe({ entryTypes: ['resource'] });
            this.observers.push(observer);
        }

        observeLongTasks() {
            // Monitor long tasks that block the main thread
            if ('PerformanceObserver' in window && 'PerformanceLongTaskTiming' in window) {
                const observer = new PerformanceObserver((list) => {
                    list.getEntries().forEach(entry => {
                        console.warn(`Long task detected: ${entry.duration.toFixed(2)}ms`);
                        
                        // Track frequent long tasks
                        if (!this.metrics.longTasks) {
                            this.metrics.longTasks = [];
                        }
                        this.metrics.longTasks.push({
                            duration: entry.duration,
                            startTime: entry.startTime,
                            timestamp: Date.now()
                        });
                    });
                });
                
                observer.observe({ entryTypes: ['longtask'] });
                this.observers.push(observer);
            }
        }

        observeLayoutShifts() {
            // Monitor Cumulative Layout Shift (CLS)
            if ('PerformanceObserver' in window) {
                let clsValue = 0;
                const observer = new PerformanceObserver((list) => {
                    list.getEntries().forEach(entry => {
                        if (!entry.hadRecentInput) {
                            clsValue += entry.value;
                        }
                    });
                    
                    if (clsValue > 0.1) {
                        console.warn(`High Cumulative Layout Shift: ${clsValue.toFixed(3)}`);
                    }
                });
                
                observer.observe({ entryTypes: ['layout-shift'] });
                this.observers.push(observer);
            }
        }

        setupErrorTracking() {
            // Track JavaScript errors
            window.addEventListener('error', (event) => {
                console.error('JavaScript error:', {
                    message: event.message,
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                    error: event.error
                });
            });

            // Track unhandled promise rejections
            window.addEventListener('unhandledrejection', (event) => {
                console.error('Unhandled promise rejection:', event.reason);
            });
        }

        trackMapLoadTime(startTime) {
            const endTime = performance.now();
            this.metrics.mapLoad = {
                loadTime: endTime - startTime,
                timestamp: Date.now()
            };
            
            if (this.metrics.mapLoad.loadTime > 2000) {
                console.warn(`Slow map load: ${this.metrics.mapLoad.loadTime.toFixed(2)}ms`);
            }
        }

        trackLoginInit(startTime) {
            const endTime = performance.now();
            this.metrics.loginInit = {
                initTime: endTime - startTime,
                timestamp: Date.now()
            };
        }

        getResourceType(url) {
            if (url.includes('.css')) return 'css';
            if (url.includes('.js')) return 'js';
            if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) return 'image';
            if (url.includes('font')) return 'font';
            if (url.includes('api/')) return 'api';
            return 'other';
        }

        getMetrics() {
            return { ...this.metrics };
        }

        generateReport() {
            const metrics = this.getMetrics();
            console.group('Performance Report');
            
            if (metrics.pageLoad) {
                console.log('Page Load:', metrics.pageLoad);
            }
            
            if (metrics.mapLoad) {
                console.log('Map Load:', metrics.mapLoad);
            }
            
            if (metrics.loginInit) {
                console.log('Login Init:', metrics.loginInit);
            }
            
            Object.keys(metrics.resourceLoad).forEach(type => {
                const resources = metrics.resourceLoad[type];
                const avgTime = resources.reduce((sum, r) => sum + r.loadTime, 0) / resources.length;
                console.log(`${type.toUpperCase()} Resources:`, {
                    count: resources.length,
                    averageLoadTime: avgTime.toFixed(2) + 'ms',
                    slowest: Math.max(...resources.map(r => r.loadTime)).toFixed(2) + 'ms'
                });
            });
            
            console.groupEnd();
        }

        cleanup() {
            this.observers.forEach(observer => observer.disconnect());
            this.observers = [];
        }
    }

    // Image optimization utilities
    class ImageOptimizer {
        static async optimizeImages() {
            const images = document.querySelectorAll('img[data-src], img[src]');
            
            images.forEach(img => {
                // Lazy loading
                if (img.dataset.src && 'IntersectionObserver' in window) {
                    this.lazyLoadImage(img);
                }
                
                // WebP support
                if (this.supportsWebP() && !img.src.includes('.webp')) {
                    this.convertToWebP(img);
                }
            });
        }

        static lazyLoadImage(img) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.add('loaded');
                        observer.unobserve(img);
                    }
                });
            }, {
                rootMargin: '50px'
            });
            
            observer.observe(img);
        }

        static supportsWebP() {
            if (!this._webpSupport) {
                const canvas = document.createElement('canvas');
                canvas.width = canvas.height = 1;
                this._webpSupport = canvas.toDataURL('image/webp').indexOf('webp') > 0;
            }
            return this._webpSupport;
        }

        static convertToWebP(img) {
            // This would typically be handled server-side
            // Here we just add a note for optimization
            if (img.src && !img.dataset.webpChecked) {
                img.dataset.webpChecked = 'true';
                console.log('Consider converting to WebP:', img.src);
            }
        }
    }

    // Initialize performance monitoring
    window.performanceMonitor = new PerformanceMonitor();
    window.imageOptimizer = ImageOptimizer;

    // Auto-generate report after 10 seconds
    setTimeout(() => {
        window.performanceMonitor.generateReport();
        ImageOptimizer.optimizeImages();
    }, 10000);

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        window.performanceMonitor.cleanup();
    });

})();

// Export for manual usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PerformanceMonitor, ImageOptimizer };
}