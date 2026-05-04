"use strict";
/**
 * Admin System Health Controller
 * Handles system health checks, cache monitoring, and system scans
 * Extracted from adminSystemController.ts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.applySystemFix = exports.runSystemScan = exports.getSystemHealth = exports.getCacheHealth = void 0;
const adminBaseController_1 = require("@esparex/core/utils/adminBaseController");
const db_1 = require("@esparex/core/config/db");
const package_json_1 = require("../../../../package.json");
const redisCache_1 = require("@esparex/core/utils/redisCache");
const systemConfigHelper_1 = require("@esparex/core/utils/systemConfigHelper");
const sendHealthError = (req, res, error) => {
    (0, adminBaseController_1.sendAdminError)(req, res, error);
};
/**
 * Get cache health metrics (Redis stats)
 */
const getCacheHealth = async (req, res) => {
    try {
        const stats = await (0, redisCache_1.getCacheStats)();
        const total = stats.metrics.hits + stats.metrics.misses;
        const hitRate = total > 0 ? (stats.metrics.hits / total) * 100 : 0;
        const missRate = total > 0 ? (stats.metrics.misses / total) * 100 : 0;
        // CityPopularity removed — use LocationAnalytics.popularityScore instead
        const topPredictedCities = [];
        (0, adminBaseController_1.sendSuccessResponse)(res, { ...stats, hitRate: parseFloat(hitRate.toFixed(2)), missRate: parseFloat(missRate.toFixed(2)), predictiveWarmStatus: stats.memoryPressureStatus === 'critical' ? 'paused' : 'active', topPredictedCities });
    }
    catch (error) {
        sendHealthError(req, res, error);
    }
};
exports.getCacheHealth = getCacheHealth;
/**
 * Get system health status (database & API connectivity)
 */
const getSystemHealth = async (req, res) => {
    try {
        await (0, db_1.connectDB)();
        const userDbStatus = Number((0, db_1.getUserConnection)().readyState) === 1 ? 'connected' : 'disconnected';
        const adminDbStatus = Number((0, db_1.getAdminConnection)().readyState) === 1 ? 'connected' : 'disconnected';
        const redisHealth = await (0, redisCache_1.getRedisHealthProbe)();
        const dbHealthy = Number((0, db_1.getUserConnection)().readyState) === 1 && Number((0, db_1.getAdminConnection)().readyState) === 1;
        const redisHealthy = redisHealth.pingOk && redisHealth.roundTripOk;
        const isHealthy = dbHealthy && redisHealthy;
        (0, adminBaseController_1.sendSuccessResponse)(res, {
            status: isHealthy ? 'ok' : 'degraded',
            timestamp: new Date().toISOString(),
            uptime: Math.floor(process.uptime()),
            databases: {
                user: { status: userDbStatus },
                admin: { status: adminDbStatus }
            },
            redisConnected: redisHealthy,
            redisPingLatencyMs: redisHealth.latencyMs,
            redis: redisHealth,
            apiReady: true,
            version: package_json_1.version
        });
    }
    catch (error) {
        sendHealthError(req, res, error);
    }
};
exports.getSystemHealth = getSystemHealth;
/**
 * Run comprehensive system diagnostic scan
 */
const runSystemScan = async (req, res) => {
    try {
        const issues = [];
        const warnings = [];
        let status = 'Operationally Sound';
        let score = 100;
        // 1. DB Check
        const dbState = (0, db_1.getUserConnection)().readyState;
        if (Number(dbState) !== 1) {
            issues.push({ id: 'db_conn', type: 'system', message: 'User database connection is unstable', severity: 'high', fixable: true, action: 'reconnect_db' });
            status = 'Critical';
            score -= 40;
        }
        // 2. Redis Check
        try {
            const redisHealth = await (0, redisCache_1.getRedisHealthProbe)();
            if (!redisHealth.pingOk || !redisHealth.roundTripOk) {
                throw new Error(redisHealth.error || 'Redis health probe failed');
            }
        }
        catch {
            warnings.push({ id: 'cache_conn', type: 'performance', message: 'Cache layer (Redis) is unreachable', severity: 'medium', fixable: false });
            if (status !== 'Critical')
                status = 'Degraded';
            score -= 20;
        }
        // 3. System Config Check
        const config = await (0, systemConfigHelper_1.getSystemConfigDoc)();
        if (!config) {
            issues.push({ id: 'sys_config', type: 'security', message: 'System configuration document is missing', severity: 'high', fixable: true, action: 'reset_config' });
            if (status !== 'Critical')
                status = 'Degraded';
            score -= 30;
        }
        else if (!config.security?.twoFactor?.enabled) {
            warnings.push({ id: '2fa_disabled', type: 'security', message: 'Admin 2FA is currently disabled', severity: 'low', fixable: true, action: 'enable_2fa_prompt' });
            score -= 5;
        }
        // 4. Rate Limit Check
        const rlKeys = await (0, redisCache_1.scanKeysByPattern)('rl:*', { maxKeys: 1001 });
        if (rlKeys.length > 1000) {
            warnings.push({ id: 'high_traffic', type: 'security', message: 'Unusually high number of rate-limited IPs detected', severity: 'medium', fixable: true, action: 'clear_rate_limits' });
            score -= 10;
        }
        (0, adminBaseController_1.sendSuccessResponse)(res, {
            issues,
            warnings,
            status,
            score: Math.max(0, score),
            scannedAt: new Date().toISOString()
        }, 'System scan completed successfully');
    }
    catch (error) {
        sendHealthError(req, res, error);
    }
};
exports.runSystemScan = runSystemScan;
/**
 * Apply system fixes based on scan results
 */
const applySystemFix = async (req, res) => {
    try {
        const { action } = req.body;
        let message = `Action ${action} executed successfully`;
        switch (action) {
            case 'reconnect_db':
                await (0, db_1.connectDB)();
                message = "Attempted to reconnect to database";
                break;
            case 'reset_config':
                await (0, systemConfigHelper_1.ensureSystemConfig)();
                message = "Default system configuration restored";
                break;
            case 'clear_rate_limits':
                const [rlDeleted, legacyRlDeleted] = await Promise.all([
                    (0, redisCache_1.clearCachePattern)('rl:*'),
                    (0, redisCache_1.clearCachePattern)('rate_limit:*')
                ]);
                message = `Cleared ${rlDeleted + legacyRlDeleted} rate limit entries`;
                break;
            default:
                return (0, adminBaseController_1.sendAdminError)(req, res, `Unknown system fix action: ${String(action)}`, 400);
        }
        (0, adminBaseController_1.sendSuccessResponse)(res, { message });
    }
    catch (error) {
        sendHealthError(req, res, error);
    }
};
exports.applySystemFix = applySystemFix;
//# sourceMappingURL=adminSystemHealthController.js.map