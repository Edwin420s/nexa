"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const User_1 = require("../models/User");
const Project_1 = require("../models/Project");
const Analytics_1 = require("../models/Analytics");
const queue_1 = require("../services/queue");
const cache_1 = require("../services/cache");
const rate_limiter_1 = require("../services/rate-limiter");
const file_storage_1 = require("../services/file-storage");
const gemini_1 = require("../services/gemini");
const logger_1 = __importDefault(require("../utils/logger"));
const router = express_1.default.Router();
// All admin routes require admin role
router.use(auth_1.authenticate, (0, auth_1.authorize)('admin'));
// Get system stats
router.get('/stats/system', async (req, res, next) => {
    try {
        const [userCount, projectCount, analyticsCount, queueStats, cacheStats, rateLimitStats, fileStats, geminiStatus] = await Promise.all([
            User_1.User.countDocuments(),
            Project_1.Project.countDocuments(),
            Analytics_1.Analytics.countDocuments(),
            (0, queue_1.getJobQueue)().getQueueStats(),
            (0, cache_1.getCache)().getStats(),
            (0, rate_limiter_1.getRateLimiter)().getStats(),
            (0, file_storage_1.getFileStorage)().getStorageStats(),
            checkGeminiStatus()
        ]);
        const memoryUsage = process.memoryUsage();
        const uptime = process.uptime();
        res.json({
            success: true,
            data: {
                database: {
                    users: userCount,
                    projects: projectCount,
                    analytics: analyticsCount
                },
                queues: queueStats,
                cache: cacheStats,
                rateLimiter: rateLimitStats,
                files: fileStats,
                services: {
                    gemini: geminiStatus,
                    redis: cacheStats.connected,
                    mongodb: userCount >= 0 // Simple check
                },
                system: {
                    memory: {
                        rss: memoryUsage.rss,
                        heapTotal: memoryUsage.heapTotal,
                        heapUsed: memoryUsage.heapUsed,
                        external: memoryUsage.external
                    },
                    uptime,
                    nodeVersion: process.version,
                    platform: process.platform,
                    arch: process.arch
                }
            }
        });
    }
    catch (error) {
        next(error);
    }
});
// Get user management
router.get('/users', async (req, res, next) => {
    try {
        const { page = 1, limit = 20, search, role, sortBy = 'createdAt', sortOrder = -1 } = req.query;
        const query = {};
        if (search) {
            query.$or = [
                { email: { $regex: search, $options: 'i' } },
                { name: { $regex: search, $options: 'i' } }
            ];
        }
        if (role) {
            query.role = role;
        }
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [users, total] = await Promise.all([
            User_1.User.find(query)
                .select('-password')
                .sort({ [sortBy]: sortOrder })
                .skip(skip)
                .limit(parseInt(limit)),
            User_1.User.countDocuments(query)
        ]);
        res.json({
            success: true,
            data: users,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    }
    catch (error) {
        next(error);
    }
});
// Update user
router.put('/users/:userId', async (req, res, next) => {
    try {
        const { role, isActive, settings } = req.body;
        const updates = {};
        if (role !== undefined)
            updates.role = role;
        if (isActive !== undefined)
            updates.isActive = isActive;
        if (settings !== undefined)
            updates.settings = settings;
        const user = await User_1.User.findByIdAndUpdate(req.params.userId, { $set: updates }, { new: true, runValidators: true }).select('-password');
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        logger_1.default.info(`Admin ${req.user.id} updated user ${user.id}`);
        res.json({
            success: true,
            data: user
        });
    }
    catch (error) {
        next(error);
    }
});
// Get all projects
router.get('/projects', async (req, res, next) => {
    try {
        const { page = 1, limit = 20, status, userId, sortBy = 'createdAt', sortOrder = -1 } = req.query;
        const query = {};
        if (status)
            query.status = status;
        if (userId)
            query.user = userId;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [projects, total] = await Promise.all([
            Project_1.Project.find(query)
                .populate('user', 'email name')
                .sort({ [sortBy]: sortOrder })
                .skip(skip)
                .limit(parseInt(limit)),
            Project_1.Project.countDocuments(query)
        ]);
        res.json({
            success: true,
            data: projects,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
    }
    catch (error) {
        next(error);
    }
});
// Get project analytics
router.get('/projects/:projectId/analytics', async (req, res, next) => {
    try {
        const analytics = await Analytics_1.Analytics.find({ project: req.params.projectId })
            .sort({ timestamp: -1 })
            .limit(100);
        res.json({
            success: true,
            data: analytics
        });
    }
    catch (error) {
        next(error);
    }
});
// Queue management
router.get('/queues', async (req, res, next) => {
    try {
        const stats = await (0, queue_1.getJobQueue)().getQueueStats();
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/queues/:jobId', async (req, res, next) => {
    try {
        const jobStatus = await (0, queue_1.getJobQueue)().getJobStatus(req.params.jobId);
        if (!jobStatus) {
            return res.status(404).json({
                success: false,
                message: 'Job not found'
            });
        }
        res.json({
            success: true,
            data: jobStatus
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/queues/pause', async (req, res, next) => {
    try {
        await (0, queue_1.getJobQueue)().pause();
        res.json({
            success: true,
            message: 'Queues paused'
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/queues/resume', async (req, res, next) => {
    try {
        await (0, queue_1.getJobQueue)().resume();
        res.json({
            success: true,
            message: 'Queues resumed'
        });
    }
    catch (error) {
        next(error);
    }
});
// Cache management
router.get('/cache', async (req, res, next) => {
    try {
        const stats = await (0, cache_1.getCache)().getStats();
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/cache/flush', async (req, res, next) => {
    try {
        const { prefix } = req.body;
        await (0, cache_1.getCache)().flush(prefix);
        res.json({
            success: true,
            message: 'Cache flushed'
        });
    }
    catch (error) {
        next(error);
    }
});
// Rate limiter management
router.get('/rate-limiter', async (req, res, next) => {
    try {
        const stats = await (0, rate_limiter_1.getRateLimiter)().getStats();
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/rate-limiter/reset', async (req, res, next) => {
    try {
        const { key } = req.body;
        if (key) {
            await (0, rate_limiter_1.getRateLimiter)().resetLimit(key);
            res.json({
                success: true,
                message: `Rate limit reset for ${key}`
            });
        }
        else {
            await (0, rate_limiter_1.getRateLimiter)().resetAll();
            res.json({
                success: true,
                message: 'All rate limits reset'
            });
        }
    }
    catch (error) {
        next(error);
    }
});
// File storage management
router.get('/files/stats', async (req, res, next) => {
    try {
        const stats = await (0, file_storage_1.getFileStorage)().getStorageStats();
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/files/cleanup', async (req, res, next) => {
    try {
        const { maxAgeHours = 24 } = req.body;
        const deletedCount = await (0, file_storage_1.getFileStorage)().cleanupTempFiles(maxAgeHours);
        res.json({
            success: true,
            data: {
                deletedCount,
                message: `Cleaned up ${deletedCount} temporary files`
            }
        });
    }
    catch (error) {
        next(error);
    }
});
// System logs
router.get('/logs', async (req, res, next) => {
    try {
        const { type = 'error', limit = 100 } = req.query;
        const logPath = type === 'error' ? 'logs/error.log' : 'logs/combined.log';
        try {
            const logContent = await fs.promises.readFile(logPath, 'utf8');
            const lines = logContent.split('\n').filter(line => line.trim());
            // Get last N lines
            const recentLines = lines.slice(-Math.min(lines.length, parseInt(limit)));
            res.json({
                success: true,
                data: recentLines.reverse() // Most recent first
            });
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                return res.json({
                    success: true,
                    data: []
                });
            }
            throw error;
        }
    }
    catch (error) {
        next(error);
    }
});
// Backup system
router.post('/backup', async (req, res, next) => {
    try {
        const { backupName = `backup-${Date.now()}` } = req.body;
        // Create database backup
        const backupPath = await (0, file_storage_1.getFileStorage)().backupDatabase(backupName);
        res.json({
            success: true,
            data: {
                backupPath,
                downloadUrl: `/api/admin/backup/download/${path.basename(backupPath)}`
            }
        });
    }
    catch (error) {
        next(error);
    }
});
router.get('/backup/download/:filename', async (req, res, next) => {
    try {
        const filePath = path.join((0, file_storage_1.getFileStorage)()['config'].basePath, 'backups', req.params.filename);
        await fs.promises.access(filePath);
        const stats = await fs.promises.stat(filePath);
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Length', stats.size);
        res.setHeader('Content-Disposition', `attachment; filename="${req.params.filename}"`);
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
    }
    catch (error) {
        if (error.code === 'ENOENT') {
            return res.status(404).json({
                success: false,
                message: 'Backup not found'
            });
        }
        next(error);
    }
});
// System configuration
router.get('/config', async (req, res, next) => {
    try {
        // Return non-sensitive configuration
        const config = {
            nodeEnv: process.env.NODE_ENV,
            port: process.env.PORT,
            maxFileSize: (0, file_storage_1.getFileStorage)()['config'].maxFileSize,
            rateLimiting: (0, rate_limiter_1.getRateLimiter)().getRules(),
            cache: {
                defaultTTL: (0, cache_1.getCache)()['defaultTTL']
            },
            services: {
                gemini: {
                    available: !!process.env.GEMINI_API_KEY
                },
                redis: {
                    url: process.env.REDIS_URL
                },
                mongodb: {
                    url: process.env.MONGODB_URI ? 'configured' : 'not configured'
                }
            }
        };
        res.json({
            success: true,
            data: config
        });
    }
    catch (error) {
        next(error);
    }
});
// Health check endpoints
router.get('/health/detailed', async (req, res, next) => {
    try {
        const healthChecks = {
            database: await checkDatabaseHealth(),
            redis: await (0, cache_1.getCache)().healthCheck(),
            gemini: await checkGeminiStatus(),
            fileSystem: await checkFileSystemHealth(),
            queues: await checkQueueHealth(),
            timestamp: new Date().toISOString()
        };
        const allHealthy = Object.values(healthChecks).every(check => check === true || (typeof check === 'object' && check.healthy === true));
        res.json({
            success: true,
            healthy: allHealthy,
            data: healthChecks
        });
    }
    catch (error) {
        next(error);
    }
});
// Helper functions
async function checkDatabaseHealth() {
    try {
        await User_1.User.findOne().limit(1);
        return true;
    }
    catch (error) {
        logger_1.default.error('Database health check failed:', error);
        return false;
    }
}
async function checkGeminiStatus() {
    try {
        const geminiService = (0, gemini_1.getGeminiService)();
        // Try a simple call to check if API is accessible
        await geminiService.generateContent('test', { maxTokens: 1 });
        return { healthy: true };
    }
    catch (error) {
        logger_1.default.error('Gemini health check failed:', error);
        return { healthy: false, error: error.message };
    }
}
async function checkFileSystemHealth() {
    try {
        const testPath = path.join((0, file_storage_1.getFileStorage)()['config'].basePath, 'healthcheck.txt');
        await fs.promises.writeFile(testPath, 'healthcheck');
        await fs.promises.unlink(testPath);
        return true;
    }
    catch (error) {
        logger_1.default.error('File system health check failed:', error);
        return false;
    }
}
async function checkQueueHealth() {
    try {
        const stats = await (0, queue_1.getJobQueue)().getQueueStats();
        return stats !== null;
    }
    catch (error) {
        logger_1.default.error('Queue health check failed:', error);
        return false;
    }
}
exports.default = router;
