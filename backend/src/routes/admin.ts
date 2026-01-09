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
  } catch (error) {
    next(error);
  }
});

// Get user management
router.get('/users', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, role, sortBy = 'createdAt', sortOrder = -1 } = req.query;

    const query: any = {};

    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) {
      query.role = role;
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ [sortBy as string]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit as string)),
      User.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
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
    const { role, isActive, settings } = req.body;
    const updates: any = {};

    if (role !== undefined) updates.role = role;
    if (isActive !== undefined) updates.isActive = isActive;
    if (settings !== undefined) updates.settings = settings;

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    logger.info(`Admin ${req.user.id} updated user ${user.id}`);

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// Get all projects
router.get('/projects', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, userId, sortBy = 'createdAt', sortOrder = -1 } = req.query;

    const query: any = {};

    if (status) query.status = status;
    if (userId) query.user = userId;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [projects, total] = await Promise.all([
      Project.find(query)
        .populate('user', 'email name')
        .sort({ [sortBy as string]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit as string)),
      Project.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: projects,
      pagination: {
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
        pages: Math.ceil(total / parseInt(limit as string))
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get project analytics
router.get('/projects/:projectId/analytics', async (req, res, next) => {
  try {
    const analytics = await Analytics.find({ project: req.params.projectId })
      .sort({ timestamp: -1 })
      .limit(100);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    next(error);
  }
});

// Queue management
router.get('/queues', async (req, res, next) => {
  try {
    const stats = await getJobQueue().getQueueStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

router.get('/queues/:jobId', async (req, res, next) => {
  try {
    const jobStatus = await getJobQueue().getJobStatus(req.params.jobId);

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
  } catch (error) {
    next(error);
  }
});

router.post('/queues/pause', async (req, res, next) => {
  try {
    await getJobQueue().pause();

    res.json({
      success: true,
      message: 'Queues paused'
    });
  } catch (error) {
    next(error);
  }
});

router.post('/queues/resume', async (req, res, next) => {
  try {
    await getJobQueue().resume();

    res.json({
      success: true,
      message: 'Queues resumed'
    });
  } catch (error) {
    next(error);
  }
});

// Cache management
router.get('/cache', async (req, res, next) => {
  try {
    const stats = await getCache().getStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

router.post('/cache/flush', async (req, res, next) => {
  try {
    const { prefix } = req.body;
    await getCache().flush(prefix);

    res.json({
      success: true,
      message: 'Cache flushed'
    });
  } catch (error) {
    next(error);
  }
});

// Rate limiter management
router.get('/rate-limiter', async (req, res, next) => {
  try {
    const stats = await getRateLimiter().getStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

router.post('/rate-limiter/reset', async (req, res, next) => {
  try {
    const { key } = req.body;

    if (key) {
      await getRateLimiter().resetLimit(key);
      res.json({
        success: true,
        message: `Rate limit reset for ${key}`
      });
    } else {
      await getRateLimiter().resetAll();
      res.json({
        success: true,
        message: 'All rate limits reset'
      });
    }
  } catch (error) {
    next(error);
  }
});

// File storage management
router.get('/files/stats', async (req, res, next) => {
  try {
    const stats = await getFileStorage().getStorageStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

router.post('/files/cleanup', async (req, res, next) => {
  try {
    const { maxAgeHours = 24 } = req.body;
    const deletedCount = await getFileStorage().cleanupTempFiles(maxAgeHours);

    res.json({
      success: true,
      data: {
        deletedCount,
        message: `Cleaned up ${deletedCount} temporary files`
      }
    });
  } catch (error) {
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
      const recentLines = lines.slice(-Math.min(lines.length, parseInt(limit as string)));

      res.json({
        success: true,
        data: recentLines.reverse() // Most recent first
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return res.json({
          success: true,
          data: []
        });
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
});

// Backup system
router.post('/backup', async (req, res, next) => {
  try {
    const { backupName = `backup-${Date.now()}` } = req.body;

    // Create database backup
    const backupPath = await getFileStorage().backupDatabase(backupName);

    res.json({
      success: true,
      data: {
        backupPath,
        downloadUrl: `/api/admin/backup/download/${path.basename(backupPath)}`
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/backup/download/:filename', async (req, res, next) => {
  try {
    const filePath = path.join(getFileStorage()['config'].basePath, 'backups', req.params.filename);

    await fs.promises.access(filePath);
    const stats = await fs.promises.stat(filePath);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.filename}"`);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
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
      maxFileSize: getFileStorage()['config'].maxFileSize,
      rateLimiting: getRateLimiter().getRules(),
      cache: {
        defaultTTL: getCache()['defaultTTL']
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
  } catch (error) {
    next(error);
  }
});

// Health check endpoints
router.get('/health/detailed', async (req, res, next) => {
  try {
    const healthChecks = {
      database: await checkDatabaseHealth(),
      redis: await getCache().healthCheck(),
      gemini: await checkGeminiStatus(),
      fileSystem: await checkFileSystemHealth(),
      queues: await checkQueueHealth(),
      timestamp: new Date().toISOString()
    };

    const allHealthy = Object.values(healthChecks).every(
      check => check === true || (typeof check === 'object' && check.healthy === true)
    );

    res.json({
      success: true,
      healthy: allHealthy,
      data: healthChecks
    });
  } catch (error) {
    next(error);
  }
});

// Helper functions
async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await User.findOne().limit(1);
    return true;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
}

async function checkGeminiStatus(): Promise<{ healthy: boolean; models?: string[]; error?: string }> {
  try {
    const geminiService = getGeminiService();
    // Try a simple call to check if API is accessible
    await geminiService.generateContent('test', { maxTokens: 1 });
    return { healthy: true };
  } catch (error) {
    logger.error('Gemini health check failed:', error);
    return { healthy: false, error: (error as Error).message };
  }
}

async function checkFileSystemHealth(): Promise<boolean> {
  try {
    const testPath = path.join(getFileStorage()['config'].basePath, 'healthcheck.txt');
    await fs.promises.writeFile(testPath, 'healthcheck');
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

export default router;