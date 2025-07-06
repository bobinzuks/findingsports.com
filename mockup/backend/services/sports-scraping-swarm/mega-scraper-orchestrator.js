// Agent 6: Performance Engineer - Mega Scraper Orchestrator
const EventEmitter = require('events');
const cluster = require('cluster');
const os = require('os');
const AdvancedScraper = require('./advanced-scraper');
const SportsSourceDiscovery = require('./source-discovery');

class MegaScraperOrchestrator extends EventEmitter {
    constructor() {
        super();
        this.workers = new Map();
        this.workerPool = [];
        this.taskQueue = [];
        this.activeJobs = new Map();
        this.completedJobs = new Map();
        this.failedJobs = new Map();
        
        this.sourceDiscovery = new SportsSourceDiscovery();
        this.maxWorkers = Math.min(os.cpus().length * 2, 50); // Limit to 50 workers max
        this.maxConcurrentJobs = 100;
        
        this.metrics = {
            totalSources: 0,
            successfulScrapes: 0,
            failedScrapes: 0,
            totalGamesFound: 0,
            averageResponseTime: 0,
            startTime: Date.now()
        };

        this.regionQueues = new Map();
        this.priorityQueues = {
            critical: [],
            high: [],
            medium: [],
            low: []
        };
    }

    // Initialize the mega scraper
    async initialize() {
        console.log('🚀 Initializing Mega Scraper Orchestrator...');
        
        // Initialize source discovery
        this.sourceDiscovery.initializeSources();
        
        // Setup worker processes if master
        if (cluster.isMaster) {
            await this.setupMasterProcess();
        } else {
            await this.setupWorkerProcess();
        }
        
        console.log(`✅ Mega Scraper initialized with ${this.maxWorkers} workers`);
    }

    // Setup master process to manage workers
    async setupMasterProcess() {
        console.log(`🏭 Setting up master process with ${this.maxWorkers} workers`);
        
        // Create worker processes
        for (let i = 0; i < this.maxWorkers; i++) {
            this.createWorker();
        }

        // Handle worker messages
        cluster.on('message', (worker, message) => {
            this.handleWorkerMessage(worker, message);
        });

        // Handle worker exits
        cluster.on('exit', (worker, code, signal) => {
            console.log(`Worker ${worker.process.pid} died. Restarting...`);
            this.createWorker();
        });

        // Start job distribution
        this.startJobDistribution();
        
        // Setup monitoring
        this.startMonitoring();
    }

    // Create a new worker
    createWorker() {
        const worker = cluster.fork();
        this.workers.set(worker.id, {
            worker,
            status: 'idle',
            currentJob: null,
            completedJobs: 0,
            failedJobs: 0,
            avgResponseTime: 0
        });
        
        this.workerPool.push(worker.id);
        return worker;
    }

    // Setup worker process
    async setupWorkerProcess() {
        console.log(`👷 Worker ${process.pid} starting up`);
        
        const scraper = new AdvancedScraper();
        
        // Listen for scraping tasks
        process.on('message', async (message) => {
            if (message.type === 'SCRAPE_TASK') {
                await this.executeScrapingTask(scraper, message);
            }
        });

        console.log(`✅ Worker ${process.pid} ready for tasks`);
    }

    // Execute scraping task in worker
    async executeScrapingTask(scraper, task) {
        const startTime = Date.now();
        
        try {
            console.log(`🔄 Worker ${process.pid} processing: ${task.source.name}`);
            
            let result;
            if (task.source.type === 'social_platform' || task.source.requires_js) {
                result = await scraper.scrapeWithBrowser(task.source.url, task.options);
            } else {
                result = await scraper.scrapeWithAxios(task.source.url, task.options);
            }
            
            // Parse the content
            const games = this.parseSourceContent(result.data, task.source);
            
            const responseTime = Date.now() - startTime;
            
            // Send results back to master
            process.send({
                type: 'TASK_COMPLETE',
                taskId: task.id,
                workerId: process.pid,
                success: true,
                games,
                responseTime,
                source: task.source.name
            });
            
        } catch (error) {
            const responseTime = Date.now() - startTime;
            
            process.send({
                type: 'TASK_FAILED',
                taskId: task.id,
                workerId: process.pid,
                success: false,
                error: error.message,
                responseTime,
                source: task.source.name
            });
        }
    }

    // Parse content based on source type
    parseSourceContent(html, source) {
        try {
            const scraper = new AdvancedScraper();
            
            // Use source-specific selectors if available
            if (source.selectors) {
                return scraper.parseContent(html, source.selectors);
            }
            
            // Use smart extraction for sports content
            return scraper.extractSportsData(html, source.content_type || 'schedule');
            
        } catch (error) {
            console.error(`Error parsing content for ${source.name}:`, error.message);
            return [];
        }
    }

    // Handle messages from workers
    handleWorkerMessage(worker, message) {
        switch (message.type) {
            case 'TASK_COMPLETE':
                this.handleTaskComplete(worker, message);
                break;
            case 'TASK_FAILED':
                this.handleTaskFailed(worker, message);
                break;
        }
    }

    // Handle successful task completion
    handleTaskComplete(worker, message) {
        const workerInfo = this.workers.get(worker.id);
        if (workerInfo) {
            workerInfo.status = 'idle';
            workerInfo.currentJob = null;
            workerInfo.completedJobs++;
            
            // Update metrics
            this.metrics.successfulScrapes++;
            this.metrics.totalGamesFound += message.games ? message.games.length : 0;
            this.updateAverageResponseTime(message.responseTime);
        }
        
        // Remove from active jobs
        this.activeJobs.delete(message.taskId);
        this.completedJobs.set(message.taskId, message);
        
        // Emit completion event
        this.emit('taskComplete', message);
        
        console.log(`✅ Task completed: ${message.source} - Found ${message.games ? message.games.length : 0} games`);
    }

    // Handle failed task
    handleTaskFailed(worker, message) {
        const workerInfo = this.workers.get(worker.id);
        if (workerInfo) {
            workerInfo.status = 'idle';
            workerInfo.currentJob = null;
            workerInfo.failedJobs++;
        }
        
        // Update metrics
        this.metrics.failedScrapes++;
        this.updateAverageResponseTime(message.responseTime);
        
        // Remove from active jobs
        this.activeJobs.delete(message.taskId);
        this.failedJobs.set(message.taskId, message);
        
        // Emit failure event
        this.emit('taskFailed', message);
        
        console.log(`❌ Task failed: ${message.source} - ${message.error}`);
    }

    // Start comprehensive scraping for a location
    async startComprehensiveScraping(lat, lng, radius = 25, userSports = []) {
        console.log(`🎯 Starting comprehensive scraping for location: ${lat}, ${lng}`);
        
        // Get relevant sources for location
        const sources = this.sourceDiscovery.getSourcesForLocation(lat, lng, radius);
        console.log(`📊 Found ${sources.length} relevant sources`);
        
        // Filter by user's sports interests
        const filteredSources = userSports.length > 0 
            ? sources.filter(source => 
                !source.specialties || 
                source.specialties.some(sport => userSports.includes(sport)) ||
                source.specialties.includes('all_sports')
              )
            : sources;
        
        // Create scraping tasks
        const tasks = this.createScrapingTasks(filteredSources);
        
        // Add tasks to queue with priorities
        for (const task of tasks) {
            this.addTaskToQueue(task);
        }
        
        console.log(`📋 Queued ${tasks.length} scraping tasks`);
        
        return {
            totalSources: filteredSources.length,
            queuedTasks: tasks.length,
            estimatedTime: this.estimateCompletionTime(tasks.length)
        };
    }

    // Create scraping tasks from sources
    createScrapingTasks(sources) {
        return sources.map(source => ({
            id: this.generateTaskId(),
            source,
            priority: this.calculateTaskPriority(source),
            createdAt: Date.now(),
            attempts: 0,
            maxAttempts: 3,
            options: this.getScrapingOptions(source)
        }));
    }

    // Calculate task priority
    calculateTaskPriority(source) {
        let priority = 0;
        
        // Real-time sources get highest priority
        if (source.type === 'social_platform' || source.type === 'sports_app') {
            priority += 100;
        }
        
        // API sources are more reliable
        if (source.api_available) {
            priority += 80;
        }
        
        // Public access sources are valuable
        if (source.public_access !== false) {
            priority += 60;
        }
        
        // Government/official sources are reliable
        if (source.type === 'government' || source.type === 'recreation_center') {
            priority += 40;
        }
        
        return priority;
    }

    // Get scraping options for source
    getScrapingOptions(source) {
        const options = {
            timeout: 30000,
            headers: {}
        };
        
        // Social platforms need special handling
        if (source.type === 'social_platform') {
            options.waitUntil = 'networkidle0';
            options.waitForSelector = source.wait_selector;
            options.evaluate = source.custom_js;
        }
        
        // Sports apps might need authentication
        if (source.type === 'sports_app' && source.auth_required) {
            options.headers['Authorization'] = source.auth_token;
        }
        
        return options;
    }

    // Add task to appropriate priority queue
    addTaskToQueue(task) {
        const priority = task.priority;
        
        if (priority >= 100) {
            this.priorityQueues.critical.push(task);
        } else if (priority >= 80) {
            this.priorityQueues.high.push(task);
        } else if (priority >= 40) {
            this.priorityQueues.medium.push(task);
        } else {
            this.priorityQueues.low.push(task);
        }
    }

    // Start job distribution to workers
    startJobDistribution() {
        setInterval(() => {
            this.distributeJobs();
        }, 1000); // Check every second
    }

    // Distribute jobs to idle workers
    distributeJobs() {
        const idleWorkers = Array.from(this.workers.values())
            .filter(worker => worker.status === 'idle')
            .map(worker => worker.worker.id);
        
        if (idleWorkers.length === 0) {
            return; // No idle workers
        }
        
        // Process tasks by priority
        const queues = ['critical', 'high', 'medium', 'low'];
        
        for (const queueName of queues) {
            const queue = this.priorityQueues[queueName];
            
            while (queue.length > 0 && idleWorkers.length > 0) {
                const task = queue.shift();
                const workerId = idleWorkers.shift();
                
                this.assignTaskToWorker(workerId, task);
            }
            
            if (idleWorkers.length === 0) {
                break; // No more idle workers
            }
        }
    }

    // Assign task to specific worker
    assignTaskToWorker(workerId, task) {
        const workerInfo = this.workers.get(workerId);
        if (!workerInfo) {
            return;
        }
        
        workerInfo.status = 'busy';
        workerInfo.currentJob = task;
        
        this.activeJobs.set(task.id, {
            task,
            worker: workerId,
            startTime: Date.now()
        });
        
        // Send task to worker
        workerInfo.worker.send({
            type: 'SCRAPE_TASK',
            ...task
        });
        
        console.log(`📤 Assigned task ${task.source.name} to worker ${workerId}`);
    }

    // Start monitoring system
    startMonitoring() {
        setInterval(() => {
            this.logMetrics();
        }, 30000); // Log every 30 seconds
        
        setInterval(() => {
            this.checkStuckJobs();
        }, 60000); // Check for stuck jobs every minute
    }

    // Log performance metrics
    logMetrics() {
        const runtime = Date.now() - this.metrics.startTime;
        const runtimeHours = (runtime / (1000 * 60 * 60)).toFixed(2);
        
        console.log(`📊 Scraper Metrics (${runtimeHours}h runtime):`);
        console.log(`   Sources processed: ${this.metrics.successfulScrapes + this.metrics.failedScrapes}`);
        console.log(`   Success rate: ${((this.metrics.successfulScrapes / (this.metrics.successfulScrapes + this.metrics.failedScrapes)) * 100).toFixed(1)}%`);
        console.log(`   Games found: ${this.metrics.totalGamesFound}`);
        console.log(`   Avg response time: ${this.metrics.averageResponseTime}ms`);
        console.log(`   Active jobs: ${this.activeJobs.size}`);
        console.log(`   Queue sizes: C:${this.priorityQueues.critical.length} H:${this.priorityQueues.high.length} M:${this.priorityQueues.medium.length} L:${this.priorityQueues.low.length}`);
    }

    // Check for stuck jobs and restart them
    checkStuckJobs() {
        const now = Date.now();
        const timeout = 5 * 60 * 1000; // 5 minutes
        
        for (const [taskId, job] of this.activeJobs) {
            if (now - job.startTime > timeout) {
                console.log(`⚠️  Restarting stuck job: ${job.task.source.name}`);
                
                // Re-queue the task
                job.task.attempts++;
                if (job.task.attempts < job.task.maxAttempts) {
                    this.addTaskToQueue(job.task);
                } else {
                    console.log(`❌ Max attempts reached for: ${job.task.source.name}`);
                    this.failedJobs.set(taskId, {
                        ...job.task,
                        error: 'Max attempts exceeded',
                        finalFailure: true
                    });
                }
                
                // Reset worker
                const workerInfo = this.workers.get(job.worker);
                if (workerInfo) {
                    workerInfo.status = 'idle';
                    workerInfo.currentJob = null;
                }
                
                this.activeJobs.delete(taskId);
            }
        }
    }

    // Update average response time
    updateAverageResponseTime(responseTime) {
        const totalScrapes = this.metrics.successfulScrapes + this.metrics.failedScrapes;
        this.metrics.averageResponseTime = 
            ((this.metrics.averageResponseTime * (totalScrapes - 1)) + responseTime) / totalScrapes;
    }

    // Estimate completion time
    estimateCompletionTime(taskCount) {
        const avgTimePerTask = this.metrics.averageResponseTime || 5000; // Default 5 seconds
        const parallelism = Math.min(this.maxWorkers, taskCount);
        const estimatedMs = (taskCount / parallelism) * avgTimePerTask;
        
        return {
            milliseconds: estimatedMs,
            seconds: Math.round(estimatedMs / 1000),
            minutes: Math.round(estimatedMs / (1000 * 60))
        };
    }

    // Generate unique task ID
    generateTaskId() {
        return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    // Get real-time status
    getStatus() {
        return {
            metrics: this.metrics,
            activeJobs: this.activeJobs.size,
            completedJobs: this.completedJobs.size,
            failedJobs: this.failedJobs.size,
            queueSizes: {
                critical: this.priorityQueues.critical.length,
                high: this.priorityQueues.high.length,
                medium: this.priorityQueues.medium.length,
                low: this.priorityQueues.low.length
            },
            workers: Array.from(this.workers.values()).map(w => ({
                id: w.worker.id,
                status: w.status,
                completed: w.completedJobs,
                failed: w.failedJobs,
                currentJob: w.currentJob?.source?.name
            }))
        };
    }

    // Get all found games
    getAllGames() {
        const allGames = [];
        
        for (const result of this.completedJobs.values()) {
            if (result.games && Array.isArray(result.games)) {
                allGames.push(...result.games.map(game => ({
                    ...game,
                    source: result.source,
                    scrapedAt: result.timestamp || Date.now()
                })));
            }
        }
        
        return allGames;
    }

    // Cleanup
    async shutdown() {
        console.log('🛑 Shutting down Mega Scraper Orchestrator...');
        
        // Close all workers
        for (const workerInfo of this.workers.values()) {
            workerInfo.worker.kill();
        }
        
        console.log('✅ Mega Scraper shutdown complete');
    }
}

module.exports = MegaScraperOrchestrator;