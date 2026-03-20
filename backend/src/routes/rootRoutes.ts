import express from 'express';
import { setCsrfToken, getCsrfToken } from '../middleware/csrfProtection';
import { isDbReady } from '../config/db';
import { getRedisHealthProbe, isConnected as redisConnected } from '../utils/redisCache';

const router = express.Router();

const healthCheckHandler: express.RequestHandler = async (_req, res) => {
    const mem = process.memoryUsage();
    const redisHealth = await getRedisHealthProbe();
    res.status(200).json({
        success: true,
        status: 'ok',
        uptime: process.uptime(),
        memoryUsage: {
            heapUsed: `${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`,
            rss: `${(mem.rss / 1024 / 1024).toFixed(2)} MB`
        },
        redisConnected: redisConnected && redisHealth.pingOk && redisHealth.roundTripOk,
        redisPingLatencyMs: redisHealth.latencyMs,
        redisHealth,
        mongoConnected: isDbReady(),
        queueStatus: 'running'
    });
};

router.get('/health', healthCheckHandler);
router.get('/csrf-token', setCsrfToken, getCsrfToken);

export default router;
