"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheckHandler = exports.getHealthCheckData = void 0;
const db_1 = require("@core/config/db");
const redisCache_1 = require("@core/utils/redisCache");
const logger_1 = __importDefault(require("@core/utils/logger"));
/**
 * Shared Health Check Logic
 * Provides a standardized response for system status and resource metrics.
 */
const getHealthCheckData = async () => {
    const mem = process.memoryUsage();
    const redisHealth = await (0, redisCache_1.getRedisHealthProbe)();
    return {
        success: true,
        status: 'ok',
        uptime: process.uptime(),
        memoryUsage: {
            heapUsed: `${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`,
            rss: `${(mem.rss / 1024 / 1024).toFixed(2)} MB`
        },
        redisConnected: redisCache_1.isConnected && redisHealth.pingOk && redisHealth.roundTripOk,
        redisPingLatencyMs: redisHealth.latencyMs,
        redisHealth,
        mongoConnected: (0, db_1.isDbReady)(),
        queueStatus: 'running'
    };
};
exports.getHealthCheckData = getHealthCheckData;
const healthCheckHandler = async (req, res) => {
    try {
        // Log health checks in dev for visibility
        if (process.env.NODE_ENV === 'development') {
            logger_1.default.info(`[Health] Ping from ${req.ip}`);
        }
        const healthData = await (0, exports.getHealthCheckData)();
        res.status(200).json(healthData);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            status: 'error',
            error: error instanceof Error ? error.message : String(error)
        });
    }
};
exports.healthCheckHandler = healthCheckHandler;
//# sourceMappingURL=health.js.map