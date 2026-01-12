import { Router, Response, NextFunction } from 'express';
import { getDBStatus } from '../services/mongodb';
import { getRedisClient } from '../services/redis';
import { AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const mongoStatus = getDBStatus();

        let redisStatus = 'unknown';
        try {
            const redisClient = getRedisClient();
            await redisClient.ping();
            redisStatus = 'connected';
        } catch {
            redisStatus = 'disconnected';
        }

        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV,
            services: {
                mongodb: mongoStatus,
                redis: redisStatus
            },
            memory: {
                heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
                heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
            }
        };

        res.status(200).json(health);
    } catch (error) {
        next(error);
    }
});

export default router;
