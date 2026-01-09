"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitoringService = void 0;
exports.getMonitoringService = getMonitoringService;
exports.requestMonitoring = requestMonitoring;
exports.monitorPerformance = monitorPerformance;
const events_1 = require("events");
const os_1 = __importDefault(require("os"));
const cache_1 = require("./cache");
const queue_1 = require("./queue");
const gemini_1 = require("./gemini");
const User_1 = require("../models/User");
const Analytics_1 = require("../models/Analytics");
const logger_1 = __importDefault(require("../utils/logger"));
class MonitoringService extends events_1.EventEmitter {
    constructor() {
        super();
        this.metricsHistory = [];
        this.performanceHistory = [];
        this.alerts = [];
        this.maxHistorySize = 1000;
        this.collectionInterval = 60000; // 1 minute
        this.startMonitoring();
    }
    startMonitoring() {
        this.intervalId = setInterval(() => {
            this.collectMetrics().catch(error => {
                logger_1.default.error('Failed to collect metrics:', error);
            });
        }, this.collectionInterval);
        // Collect immediately on startup
        this.collectMetrics().catch(error => {
            logger_1.default.error('Failed to collect initial metrics:', error);
        });
        logger_1.default.info('Monitoring service started');
    }
    async collectMetrics() {
        try {
            const metrics = await this.getSystemMetrics();
            const performance = await this.getPerformanceMetrics();
            const health = await this.checkServiceHealth();
            this.metricsHistory.push(metrics);
            this.performanceHistory.push(performance);
            // Keep history size limited
            if (this.metricsHistory.length > this.maxHistorySize) {
                this.metricsHistory = this.metricsHistory.slice(-this.maxHistorySize);
            }
            if (this.performanceHistory.length > this.maxHistorySize) {
                this.performanceHistory = this.performanceHistory.slice(-this.maxHistorySize);
            }
            // Check for anomalies and generate alerts
            await this.checkForAnomalies(metrics, performance, health);
            // Emit metrics collected event
            this.emit('metrics:collected', { metrics, performance, health });
        }
        catch (error) {
            logger_1.default.error('Error collecting metrics:', error);
        }
    }
    async getSystemMetrics() {
        const cpuUsage = await this.getCpuUsage();
        const loadAverage = os_1.default.loadavg();
        const memory = os_1.default.totalmem();
        const freeMemory = os_1.default.freemem();
        const diskStats = await this.getDiskStats();
        const networkInterfaces = os_1.default.networkInterfaces();
        return {
            timestamp: new Date(),
            cpu: {
                usage: cpuUsage,
                loadAverage,
                cores: os_1.default.cpus().length
            },
            memory: {
                total: memory,
                free: freeMemory,
                used: memory - freeMemory,
                usagePercent: ((memory - freeMemory) / memory) * 100
            },
            disk: {
                total: diskStats.total,
                free: diskStats.free,
                used: diskStats.used,
                usagePercent: diskStats.usagePercent
            },
            network: {
                interfaces: networkInterfaces,
                activeConnections: 0 // Would need netstat or similar
            },
            process: {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                pid: process.pid,
                version: process.version,
                platform: process.platform,
                arch: process.arch
            }
        };
    }
    async getCpuUsage() {
        const start = os_1.default.cpus();
        const startTotal = start.reduce((acc, cpu) => {
            return acc + Object.values(cpu.times).reduce((a, b) => a + b, 0);
        }, 0);
        const startIdle = start.reduce((acc, cpu) => acc + cpu.times.idle, 0);
        await new Promise(resolve => setTimeout(resolve, 100));
        const end = os_1.default.cpus();
        const endTotal = end.reduce((acc, cpu) => {
            return acc + Object.values(cpu.times).reduce((a, b) => a + b, 0);
        }, 0);
        const endIdle = end.reduce((acc, cpu) => acc + cpu.times.idle, 0);
        const totalDiff = endTotal - startTotal;
        const idleDiff = endIdle - startIdle;
        return totalDiff === 0 ? 0 : ((totalDiff - idleDiff) / totalDiff) * 100;
    }
    async getDiskStats() {
        try {
            const stats = await Promise.resolve().then(() => __importStar(require('fs/promises'))).then(fs => fs.statfs('/'));
            const total = stats.bsize * stats.blocks;
            const free = stats.bsize * stats.bavail;
            const used = total - free;
            const usagePercent = (used / total) * 100;
            return { total, free, used, usagePercent };
        }
        catch (error) {
            // Fallback for environments where statfs is not available
            return { total: 0, free: 0, used: 0, usagePercent: 0 };
        }
    }
    async getPerformanceMetrics() {
        // These would be collected from actual request tracking
        // For now, return mock/stub data
        return {
            responseTime: 100, // milliseconds
            throughput: 50, // requests per minute
            errorRate: 0.01, // 1%
            activeUsers: await this.getActiveUserCount(),
            concurrentRequests: 0 // Would need tracking middleware
        };
    }
    async getActiveUserCount() {
        try {
            // Count users active in last 15 minutes
            const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
            const count = await Analytics_1.Analytics.countDocuments({
                timestamp: { $gte: fifteenMinutesAgo }
            });
            return Math.min(count, 1000); // Cap for reporting
        }
        catch (error) {
            return 0;
        }
    }
    async checkServiceHealth() {
        const checks = await Promise.allSettled([
            this.checkDatabaseHealth(),
            this.checkRedisHealth(),
            this.checkGeminiHealth(),
            this.checkFileSystemHealth(),
            this.checkQueueHealth()
        ]);
        return {
            database: checks[0].status === 'fulfilled' && checks[0].value,
            redis: checks[1].status === 'fulfilled' && checks[1].value,
            gemini: checks[2].status === 'fulfilled' && checks[2].value,
            fileSystem: checks[3].status === 'fulfilled' && checks[3].value,
            queues: checks[4].status === 'fulfilled' && checks[4].value
        };
    }
    async checkDatabaseHealth() {
        try {
            await User_1.User.findOne().limit(1);
            return true;
        }
        catch (error) {
            return false;
        }
    }
    async checkRedisHealth() {
        try {
            return await (0, cache_1.getCache)().healthCheck();
        }
        catch (error) {
            return false;
        }
    }
    async checkGeminiHealth() {
        try {
            const geminiService = (0, gemini_1.getGeminiService)();
            await geminiService.generateContent('test', { maxTokens: 1 });
            return true;
        }
        catch (error) {
            return false;
        }
    }
    async checkFileSystemHealth() {
        try {
            const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
            const testPath = '/tmp/healthcheck.txt';
            await fs.writeFile(testPath, 'healthcheck');
            await fs.unlink(testPath);
            return true;
        }
        catch (error) {
            return false;
        }
    }
    async checkQueueHealth() {
        try {
            await (0, queue_1.getJobQueue)().getQueueStats();
            return true;
        }
        catch (error) {
            return false;
        }
    }
    async checkForAnomalies(metrics, performance, health) {
        const alerts = [];
        // CPU usage alert
        if (metrics.cpu.usage > 90) {
            alerts.push({
                id: `cpu-high-${Date.now()}`,
                type: 'warning',
                message: `High CPU usage: ${metrics.cpu.usage.toFixed(1)}%`,
                source: 'monitoring',
                timestamp: new Date(),
                metadata: { usage: metrics.cpu.usage }
            });
        }
        // Memory usage alert
        if (metrics.memory.usagePercent > 90) {
            alerts.push({
                id: `memory-high-${Date.now()}`,
                type: 'warning',
                message: `High memory usage: ${metrics.memory.usagePercent.toFixed(1)}%`,
                source: 'monitoring',
                timestamp: new Date(),
                metadata: { usagePercent: metrics.memory.usagePercent }
            });
        }
        // Disk usage alert
        if (metrics.disk.usagePercent > 90) {
            alerts.push({
                id: `disk-high-${Date.now()}`,
                type: 'warning',
                message: `High disk usage: ${metrics.disk.usagePercent.toFixed(1)}%`,
                source: 'monitoring',
                timestamp: new Date(),
                metadata: { usagePercent: metrics.disk.usagePercent }
            });
        }
        // Service health alerts
        if (!health.database) {
            alerts.push({
                id: `database-down-${Date.now()}`,
                type: 'error',
                message: 'Database connection failed',
                source: 'monitoring',
                timestamp: new Date()
            });
        }
        if (!health.redis) {
            alerts.push({
                id: `redis-down-${Date.now()}`,
                type: 'error',
                message: 'Redis connection failed',
                source: 'monitoring',
                timestamp: new Date()
            });
        }
        if (!health.gemini) {
            alerts.push({
                id: `gemini-down-${Date.now()}`,
                type: 'error',
                message: 'Gemini API connection failed',
                source: 'monitoring',
                timestamp: new Date()
            });
        }
        // High error rate alert
        if (performance.errorRate > 0.05) { // 5%
            alerts.push({
                id: `error-rate-high-${Date.now()}`,
                type: 'warning',
                message: `High error rate: ${(performance.errorRate * 100).toFixed(1)}%`,
                source: 'monitoring',
                timestamp: new Date(),
                metadata: { errorRate: performance.errorRate }
            });
        }
        // Add alerts
        for (const alert of alerts) {
            await this.addAlert(alert);
        }
    }
    async addAlert(alert) {
        this.alerts.push(alert);
        // Keep only last 1000 alerts
        if (this.alerts.length > 1000) {
            this.alerts = this.alerts.slice(-1000);
        }
        // Emit alert event
        this.emit('alert', alert);
        // Log important alerts
        if (alert.type === 'error') {
            logger_1.default.error(`Alert: ${alert.message}`, alert.metadata);
        }
        else if (alert.type === 'warning') {
            logger_1.default.warn(`Alert: ${alert.message}`, alert.metadata);
        }
    }
    // Public methods for accessing monitoring data
    async getCurrentMetrics() {
        const metrics = await this.getSystemMetrics();
        const performance = await this.getPerformanceMetrics();
        const health = await this.checkServiceHealth();
        return { metrics, performance, health };
    }
    getMetricsHistory(limit = 100) {
        return this.metricsHistory.slice(-limit);
    }
    getPerformanceHistory(limit = 100) {
        return this.performanceHistory.slice(-limit);
    }
    getAlerts(limit = 100, type) {
        let alerts = this.alerts;
        if (type) {
            alerts = alerts.filter(alert => alert.type === type);
        }
        return alerts.slice(-limit).reverse(); // Most recent first
    }
    clearAlerts() {
        this.alerts = [];
    }
    async getAggregatedMetrics(timeRange = 'day') {
        const now = Date.now();
        let timeWindow;
        switch (timeRange) {
            case 'hour':
                timeWindow = 60 * 60 * 1000;
                break;
            case 'day':
                timeWindow = 24 * 60 * 60 * 1000;
                break;
            case 'week':
                timeWindow = 7 * 24 * 60 * 60 * 1000;
                break;
            case 'month':
                timeWindow = 30 * 24 * 60 * 60 * 1000;
                break;
            default:
                timeWindow = 24 * 60 * 60 * 1000;
        }
        const filteredMetrics = this.metricsHistory.filter(metric => metric.timestamp.getTime() > now - timeWindow);
        if (filteredMetrics.length === 0) {
            return {
                cpu: { avg: 0, min: 0, max: 0 },
                memory: { avg: 0, min: 0, max: 0 },
                disk: { avg: 0, min: 0, max: 0 },
                count: 0
            };
        }
        const cpuValues = filteredMetrics.map(m => m.cpu.usage);
        const memoryValues = filteredMetrics.map(m => m.memory.usagePercent);
        const diskValues = filteredMetrics.map(m => m.disk.usagePercent);
        return {
            cpu: {
                avg: this.calculateAverage(cpuValues),
                min: Math.min(...cpuValues),
                max: Math.max(...cpuValues),
                values: cpuValues
            },
            memory: {
                avg: this.calculateAverage(memoryValues),
                min: Math.min(...memoryValues),
                max: Math.max(...memoryValues),
                values: memoryValues
            },
            disk: {
                avg: this.calculateAverage(diskValues),
                min: Math.min(...diskValues),
                max: Math.max(...diskValues),
                values: diskValues
            },
            count: filteredMetrics.length,
            timeRange
        };
    }
    calculateAverage(values) {
        if (values.length === 0)
            return 0;
        const sum = values.reduce((a, b) => a + b, 0);
        return sum / values.length;
    }
    async getServiceStatus() {
        const health = await this.checkServiceHealth();
        const allServices = Object.values(health);
        let status = 'healthy';
        if (allServices.every(s => s)) {
            status = 'healthy';
        }
        else if (allServices.some(s => s)) {
            status = 'degraded';
        }
        else {
            status = 'unhealthy';
        }
        return {
            status,
            services: {
                database: { status: health.database, lastCheck: new Date() },
                redis: { status: health.redis, lastCheck: new Date() },
                gemini: { status: health.gemini, lastCheck: new Date() },
                fileSystem: { status: health.fileSystem, lastCheck: new Date() },
                queues: { status: health.queues, lastCheck: new Date() }
            },
            uptime: process.uptime()
        };
    }
    stopMonitoring() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
        }
        logger_1.default.info('Monitoring service stopped');
    }
    // Method to track custom events
    trackEvent(eventName, metadata) {
        const event = {
            name: eventName,
            timestamp: new Date(),
            metadata
        };
        this.emit('event', event);
        // Store in analytics if needed
        logger_1.default.info(`Event tracked: ${eventName}`, metadata);
    }
    // Method to measure execution time
    async measureExecution(name, fn) {
        const startTime = Date.now();
        try {
            const result = await fn();
            const executionTime = Date.now() - startTime;
            // Track performance
            this.trackEvent('execution:measured', {
                name,
                executionTime,
                success: true
            });
            return { result, executionTime };
        }
        catch (error) {
            const executionTime = Date.now() - startTime;
            this.trackEvent('execution:measured', {
                name,
                executionTime,
                success: false,
                error: error.message
            });
            throw error;
        }
    }
}
exports.MonitoringService = MonitoringService;
// Singleton instance
let monitoringInstance;
function getMonitoringService() {
    if (!monitoringInstance) {
        monitoringInstance = new MonitoringService();
    }
    return monitoringInstance;
}
// Express middleware for request monitoring
function requestMonitoring() {
    const monitoring = getMonitoringService();
    return (req, res, next) => {
        const startTime = Date.now();
        const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        // Add request ID to request object
        req.requestId = requestId;
        // Track request start
        monitoring.trackEvent('request:start', {
            requestId,
            method: req.method,
            path: req.path,
            ip: req.ip,
            userAgent: req.headers['user-agent']
        });
        // Capture response finish
        res.on('finish', () => {
            const executionTime = Date.now() - startTime;
            monitoring.trackEvent('request:end', {
                requestId,
                method: req.method,
                path: req.path,
                statusCode: res.statusCode,
                executionTime,
                contentLength: res.get('Content-Length') || 0
            });
        });
        next();
    };
}
// Performance monitoring decorator
function monitorPerformance(name) {
    return function (target, propertyKey, descriptor) {
        const originalMethod = descriptor.value;
        const monitoring = getMonitoringService();
        const metricName = name || `${target.constructor.name}.${propertyKey}`;
        descriptor.value = async function (...args) {
            return monitoring.measureExecution(metricName, () => originalMethod.apply(this, args)).then(({ result }) => result);
        };
        return descriptor;
    };
}
