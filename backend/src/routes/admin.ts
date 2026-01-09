import express from 'express';
import { User } from '../models/User';
import { Project } from '../models/Project';
import { Analytics } from '../models/Analytics';
import { getJobQueue } from '../services/queue';
import { getCache } from '../services/cache';
import { getRateLimiter } from '../services/rate-limiter';
import { getFileStorage } from '../services/file-storage';
import { getGeminiService } from '../services/gemini';
import { authenticate, authorize } from '../middleware/auth';
import logger from '../utils/logger';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Apply authentication and authorization middleware
router.use(authenticate);
router.use(authorize('admin'));

// Get system stats
router.get('/stats/system', async (req, res, next) => {
  try {
    const [
      userCount,
      projectCount,
      analyticsCount,
      queueStats,
      cacheStats,
      rateLimitStats,
      fileStats,
      geminiStatus
    ] = await Promise.all([
      User.countDocuments(),
      Project.countDocuments(),
      Analytics.countDocuments(),
      getJobQueue().getQueueStats(),
      getCache().getStats(),
      getRateLimiter().getStats(),
      getFileStorage().getStorageStats(),
      getGeminiService().checkHealth()
    ]);

    res.json({
      success: true,
      data: {
        counts: {
          users: userCount,
          projects: projectCount,
          analytics: analyticsCount
        },
        services: {
          queue: queueStats,
          cache: cacheStats,
          rateLimiter: rateLimitStats,
          storage: fileStats,
          gemini: geminiStatus
        },
        timestamp: new Date()
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get user list
router.get('/users', async (req: any, res, next) => {
  try {
    const { page = 1, limit = 10, search, role, status } = req.query;

    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) {
      query.role = role;
    }

    if (status) {
      query.status = status;
    }

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((parseInt(page as string) - 1) * parseInt(limit as string))
      .limit(parseInt(limit as string))
      .select('-password');

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        total,
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    next(error);
  }
});

// Update user
router.put('/users/:userId', async (req, res, next) => {
  try {
    const { role, status, settings } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { $set: { role, status, settings } },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// Delete user
router.delete('/users/:userId', async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Cleanup user data
    await Promise.all([
      Project.deleteMany({ user: user._id }),
      Analytics.deleteMany({ user: user._id }),
      getFileStorage().deleteUserFiles(user._id.toString())
    ]);

    res.json({
      success: true,
      message: 'User and associated data deleted'
    });
  } catch (error) {
    next(error);
  }
});

// Get system logs
router.get('/logs', async (req, res, next) => {
  try {
    const { level, limit = 100 } = req.query;

    // Read logs from file or database
    // This is a placeholder implementation
    const logs = [
      { level: 'info', message: 'System started', timestamp: new Date() },
      { level: 'info', message: 'Database connected', timestamp: new Date() }
    ];

    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    next(error);
  }
});

// Clear cache
router.post('/cache/clear', async (req, res, next) => {
  try {
    const { pattern } = req.body;
    await getCache().clear(pattern);

    res.json({
      success: true,
      message: 'Cache cleared'
    });
  } catch (error) {
    next(error);
  }
});

// Reset rate limits
router.post('/ratelimit/reset', async (req, res, next) => {
  try {
    const { ip } = req.body;
    await getRateLimiter().resetLimit(`ip:${ip}`);

    res.json({
      success: true,
      message: 'Rate limits reset'
    });
  } catch (error) {
    next(error);
  }
});

// System health check
router.get('/health', async (req, res, next) => {
  try {
    const health = {
      database: mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy',
      queue: await checkQueueHealth() ? 'healthy' : 'unhealthy',
      storage: await checkStorageHealth() ? 'healthy' : 'unhealthy',
      timestamp: new Date()
    };

    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    next(error);
  }
});

async function checkStorageHealth(): Promise<boolean> {
  try {
    const testFile = 'health-check.txt';
    const testPath = path.join(process.cwd(), 'uploads', testFile);
    await fs.promises.writeFile(testPath, 'health check');
    await fs.promises.unlink(testPath);
    return true;
  } catch (error) {
    logger.error('File system health check failed:', error);
    return false;
  }
}

async function checkQueueHealth(): Promise<boolean> {
  try {
    const stats = await getJobQueue().getQueueStats();
    return stats !== null;
  } catch (error) {
    logger.error('Queue health check failed:', error);
    return false;
  }
}

import mongoose from 'mongoose';

export default router;