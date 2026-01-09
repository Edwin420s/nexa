import { EventEmitter } from 'events';
import os from 'os';
import { getCache } from './cache';
import { getJobQueue } from './queue';
import { getGeminiService } from './gemini';
import { User } from '../models/User';
import { Project } from '../models/Project';
import { Analytics } from '../models/Analytics';
import logger from '../utils/logger';

export interface SystemMetrics {
  timestamp: Date;
  cpu: {
    usage: number;
    loadAverage: number[];
    cores: number;
  };
  memory: {
    total: number;
    free: number;
    used: number;
    usagePercent: number;
  };
  disk: {
    total: number;
    free: number;
    used: number;
    usagePercent: number;
  };
  network: {
    interfaces: Record<string, any>;
    activeConnections: number;
  };
  process: {
    uptime: number;
    memory: NodeJS.MemoryUsage;
    pid: number;
    version: string;
    platform: string;
    arch: string;
  };
}

export interface ServiceHealth {
  database: boolean;
  redis: boolean;
  gemini: boolean;
  fileSystem: boolean;
  queues: boolean;
}

export interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  activeUsers: number;
  concurrentRequests: number;
}

export interface Alert {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  source: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export class MonitoringService extends EventEmitter {
  private metricsHistory: SystemMetrics[] = [];
  private performanceHistory: PerformanceMetrics[] = [];
  private alerts: Alert[] = [];
  private maxHistorySize: number = 1000;
  private collectionInterval: number = 60000; // 1 minute
  private intervalId?: NodeJS.Timeout;

  constructor() {
    super();
    this.startMonitoring();
  }

  private startMonitoring(): void {
    this.intervalId = setInterval(() => {
      this.collectMetrics().catch(error => {
        logger.error('Failed to collect metrics:', error);
      });
    }, this.collectionInterval);

    // Collect immediately on startup
    this.collectMetrics().catch(error => {
      logger.error('Failed to collect initial metrics:', error);
    });

    logger.info('Monitoring service started');
  }

  private async collectMetrics(): Promise<void> {
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

    } catch (error) {
      logger.error('Error collecting metrics:', error);
    }
  }

  private async getSystemMetrics(): Promise<SystemMetrics> {
    const cpuUsage = await this.getCpuUsage();
    const loadAverage = os.loadavg();
    const memory = os.totalmem();
    const freeMemory = os.freemem();
    const diskStats = await this.getDiskStats();
    const networkInterfaces = os.networkInterfaces();

    return {
      timestamp: new Date(),
      cpu: {
        usage: cpuUsage,
        loadAverage,
        cores: os.cpus().length
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

  private async getCpuUsage(): Promise<number> {
    const start = os.cpus();
    const startTotal = start.reduce((acc, cpu) => {
      return acc + Object.values(cpu.times).reduce((a, b) => a + b, 0);
    }, 0);
    const startIdle = start.reduce((acc, cpu) => acc + cpu.times.idle, 0);

    await new Promise(resolve => setTimeout(resolve, 100));

    const end = os.cpus();
    const endTotal = end.reduce((acc, cpu) => {
      return acc + Object.values(cpu.times).reduce((a, b) => a + b, 0);
    }, 0);
    const endIdle = end.reduce((acc, cpu) => acc + cpu.times.idle, 0);

    const totalDiff = endTotal - startTotal;
    const idleDiff = endIdle - startIdle;

    return totalDiff === 0 ? 0 : ((totalDiff - idleDiff) / totalDiff) * 100;
  }

  private async getDiskStats(): Promise<{
    total: number;
    free: number;
    used: number;
    usagePercent: number;
  }> {
    try {
      const stats = await import('fs/promises').then(fs => 
        fs.statfs('/')
      );
      
      const total = stats.bsize * stats.blocks;
      const free = stats.bsize * stats.bavail;
      const used = total - free;
      const usagePercent = (used / total) * 100;
      
      return { total, free, used, usagePercent };
    } catch (error) {
      // Fallback for environments where statfs is not available
      return { total: 0, free: 0, used: 0, usagePercent: 0 };
    }
  }

  private async getPerformanceMetrics(): Promise<PerformanceMetrics> {
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

  private async getActiveUserCount(): Promise<number> {
    try {
      // Count users active in last 15 minutes
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
      const count = await Analytics.countDocuments({
        timestamp: { $gte: fifteenMinutesAgo }
      });
      return Math.min(count, 1000); // Cap for reporting
    } catch (error) {
      return 0;
    }
  }

  private async checkServiceHealth(): Promise<ServiceHealth> {
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

  private async checkDatabaseHealth(): Promise<boolean> {
    try {
      await User.findOne().limit(1);
      return true;
    } catch (error) {
      return false;
    }
  }

  private async checkRedisHealth(): Promise<boolean> {
    try {
      return await getCache().healthCheck();
    } catch (error) {
      return false;
    }
  }

  private async checkGeminiHealth(): Promise<boolean> {
    try {
      const geminiService = getGeminiService();
      await geminiService.generateContent('test', { maxTokens: 1 });
      return true;
    } catch (error) {
      return false;
    }
  }

  private async checkFileSystemHealth(): Promise<boolean> {
    try {
      const fs = await import('fs/promises');
      const testPath = '/tmp/healthcheck.txt';
      await fs.writeFile(testPath, 'healthcheck');
      await fs.unlink(testPath);
      return true;
    } catch (error) {
      return false;
    }
  }

  private async checkQueueHealth(): Promise<boolean> {
    try {
      await getJobQueue().getQueueStats();
      return true;
    } catch (error) {
      return false;
    }
  }

  private async checkForAnomalies(
    metrics: SystemMetrics,
    performance: PerformanceMetrics,
    health: ServiceHealth
  ): Promise<void> {
    const alerts: Alert[] = [];

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

  async addAlert(alert: Alert): Promise<void> {
    this.alerts.push(alert);
    
    // Keep only last 1000 alerts
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000);
    }

    // Emit alert event
    this.emit('alert', alert);
    
    // Log important alerts
    if (alert.type === 'error') {
      logger.error(`Alert: ${alert.message}`, alert.metadata);
    } else if (alert.type === 'warning') {
      logger.warn(`Alert: ${alert.message}`, alert.metadata);
    }
  }

  // Public methods for accessing monitoring data
  async getCurrentMetrics(): Promise<{
    metrics: SystemMetrics;
    performance: PerformanceMetrics;
    health: ServiceHealth;
  }> {
    const metrics = await this.getSystemMetrics();
    const performance = await this.getPerformanceMetrics();
    const health = await this.checkServiceHealth();

    return { metrics, performance, health };
  }

  getMetricsHistory(limit: number = 100): SystemMetrics[] {
    return this.metricsHistory.slice(-limit);
  }

  getPerformanceHistory(limit: number = 100): PerformanceMetrics[] {
    return this.performanceHistory.slice(-limit);
  }

  getAlerts(limit: number = 100, type?: Alert['type']): Alert[] {
    let alerts = this.alerts;
    
    if (type) {
      alerts = alerts.filter(alert => alert.type === type);
    }
    
    return alerts.slice(-limit).reverse(); // Most recent first
  }

  clearAlerts(): void {
    this.alerts = [];
  }

  async getAggregatedMetrics(
    timeRange: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<any> {
    const now = Date.now();
    let timeWindow: number;

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

    const filteredMetrics = this.metricsHistory.filter(
      metric => metric.timestamp.getTime() > now - timeWindow
    );

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

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((a, b) => a + b, 0);
    return sum / values.length;
  }

  async getServiceStatus(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, { status: boolean; lastCheck: Date }>;
    uptime: number;
  }> {
    const health = await this.checkServiceHealth();
    const allServices = Object.values(health);
    
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (allServices.every(s => s)) {
      status = 'healthy';
    } else if (allServices.some(s => s)) {
      status = 'degraded';
    } else {
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

  stopMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
    logger.info('Monitoring service stopped');
  }

  // Method to track custom events
  trackEvent(eventName: string, metadata?: Record<string, any>): void {
    const event = {
      name: eventName,
      timestamp: new Date(),
      metadata
    };
    
    this.emit('event', event);
    
    // Store in analytics if needed
    logger.info(`Event tracked: ${eventName}`, metadata);
  }

  // Method to measure execution time
  async measureExecution<T>(
    name: string,
    fn: () => Promise<T>
  ): Promise<{ result: T; executionTime: number }> {
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
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      this.trackEvent('execution:measured', {
        name,
        executionTime,
        success: false,
        error: (error as Error).message
      });
      
      throw error;
    }
  }
}

// Singleton instance
let monitoringInstance: MonitoringService;

export function getMonitoringService(): MonitoringService {
  if (!monitoringInstance) {
    monitoringInstance = new MonitoringService();
  }
  return monitoringInstance;
}

// Express middleware for request monitoring
export function requestMonitoring() {
  const monitoring = getMonitoringService();
  
  return (req: any, res: any, next: any) => {
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
export function monitorPerformance(name?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const monitoring = getMonitoringService();
    const metricName = name || `${target.constructor.name}.${propertyKey}`;
    
    descriptor.value = async function (...args: any[]) {
      return monitoring.measureExecution(metricName, () =>
        originalMethod.apply(this, args)
      ).then(({ result }) => result);
    };
    
    return descriptor;
  };
}