// Self-Healing API Integration for Railway Deployment
// Integrates the self-healing collector with existing data aggregation

const SelfHealingAPICollector = require('../../../self-healing-api-collector');

class SelfHealingIntegration {
    constructor() {
        this.collector = new SelfHealingAPICollector();
        this.stats = {
            totalRequests: 0,
            healedRequests: 0,
            failedCompletely: 0
        };
    }

    /**
     * Wrap any data collection method with self-healing fallback
     */
    async collectWithHealing(originalMethod, siteId, options = {}) {
        this.stats.totalRequests++;
        
        try {
            // Try original method first
            const result = await originalMethod();
            return result;
        } catch (error) {
            console.log(`⚠️ Original collection failed for ${siteId}: ${error.message}`);
            
            // Attempt self-healing
            try {
                const healedData = await this.collector.collectForLocation(
                    options.lat || 49.2827,
                    options.lng || -123.1207,
                    options.radius || 25
                );
                
                if (healedData.length > 0) {
                    console.log(`✅ Self-healing recovered ${healedData.length} items for ${siteId}`);
                    this.stats.healedRequests++;
                    
                    return {
                        success: true,
                        data: healedData,
                        healed: true,
                        originalError: error.message
                    };
                }
            } catch (healError) {
                console.error(`❌ Self-healing also failed: ${healError.message}`);
            }
            
            this.stats.failedCompletely++;
            throw error;
        }
    }

    /**
     * Get healing statistics
     */
    getStats() {
        return {
            ...this.stats,
            healingRate: this.stats.totalRequests > 0 
                ? (this.stats.healedRequests / this.stats.totalRequests * 100).toFixed(2) + '%'
                : '0%',
            completeFailureRate: this.stats.totalRequests > 0
                ? (this.stats.failedCompletely / this.stats.totalRequests * 100).toFixed(2) + '%'
                : '0%'
        };
    }

    /**
     * Enhance existing data sources with self-healing
     */
    enhanceDataSource(dataSource) {
        const originalCollect = dataSource.collect.bind(dataSource);
        
        dataSource.collect = async (options) => {
            return this.collectWithHealing(
                () => originalCollect(options),
                dataSource.id || dataSource.name,
                options
            );
        };
        
        dataSource.selfHealingEnabled = true;
        return dataSource;
    }
}

// Singleton instance
let instance = null;

module.exports = {
    getSelfHealingIntegration: () => {
        if (!instance) {
            instance = new SelfHealingIntegration();
        }
        return instance;
    },
    SelfHealingIntegration
};