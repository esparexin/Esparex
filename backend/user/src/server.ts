/* global NodeJS */
import { initializeDatabaseMonitoring } from './middleware/metricsMiddleware';
import { startSystemMonitor } from '@esparex/core/utils/systemMonitor';
import { getHealthCheckData } from '@esparex/core/utils/health';
import { startGeoAuditCron } from './cron/geoAudit';
import { startFraudEscalationCron } from './cron/fraudEscalation';
import { initIO } from '@esparex/core/config/socket';
import { connectDB } from '@esparex/core/config/db';
import mongoose from 'mongoose';
import { Server } from 'http';
import logger from '@esparex/core/utils/logger';
import { env } from '@esparex/core/config/env';
import { waitForRedisReady } from '@esparex/core/config/redis';
import { assertDuplicateRolloutReadiness } from '@esparex/core/services/DuplicateRolloutGuard';
import { startScheduler, stopScheduler } from '@esparex/core/services/SchedulerBoot';
import Admin from '@esparex/core/models/Admin';
import { USER_STATUS } from '@esparex/shared';
import { createServer } from 'http';
import { initializeEventDispatcher } from '@esparex/core/events';
import { assertCriticalStartupReadiness, validateMetadataHealth } from '@esparex/core/utils/startupValidator';
import { warmAllCaches } from '@esparex/core/utils/cacheWarmer';
import { resetAllOpenCircuitBreakers } from '@esparex/core/utils/resilience';


const PORT = env.PORT;
let reliabilityProbeInterval: NodeJS.Timeout | null = null;

async function ensureLiveAdminPresence() {
    try {
        const liveAdminCount = await Admin.countDocuments({ status: USER_STATUS.LIVE });
        if (liveAdminCount === 0) {
            logger.warn('🛡️ SECURITY ALARM: No LIVE administrators detected in database.');
            logger.warn('Admin login will fail until the default account is seeded.');
            logger.warn('FIX: Run "ALLOW_DEFAULT_ADMIN_SEED=true npm run seed:admin" in the backend directory.');
        } else {
            logger.info('Admin presence verified', { count: liveAdminCount });
        }
    } catch (error: unknown) {
        logger.error('Failed to verify admin presence', {
            error: error instanceof Error ? error.message : String(error)
        });
    }
}


export async function startServer() {
    try {
        logger.info('Starting Esparex server...');

        const schedulerRequested = env.ENABLE_SCHEDULER || env.RUN_SCHEDULERS;

        if (env.NODE_ENV === 'production') {
            if (env.PROCESS_ROLE === 'api' && schedulerRequested) {
                throw new Error(
                    'Invalid production scheduler config: PROCESS_ROLE=api must run with scheduler flags disabled.'
                );
            }
            if (env.PROCESS_ROLE === 'scheduler' && !schedulerRequested) {
                throw new Error(
                    'Invalid production scheduler config: PROCESS_ROLE=scheduler requires scheduler flags enabled.'
                );
            }
        }

        await connectDB();
        logger.info('MongoDB connected successfully');
        await waitForRedisReady({
            context: `${env.PROCESS_ROLE}:server-startup`,
        });
        logger.info('Redis readiness gate passed for API bootstrap');

        // Proactive Cache Warming
        await warmAllCaches();

        
        // Validate Metadata Integrity (Split-Safe Check)
        await validateMetadataHealth();
        
        // Initialize Core Subsystems
        initializeEventDispatcher();
        
        initializeDatabaseMonitoring();
        logger.info('Boot safety mode active: skipping all index sync/create/drop operations on API startup');
        await assertDuplicateRolloutReadiness();
        await assertCriticalStartupReadiness();

        // Ensure at least one LIVE admin is present for operations
        await ensureLiveAdminPresence();

        const shouldRunSchedulers =
            env.PROCESS_ROLE === 'scheduler'
                ? schedulerRequested
                : env.NODE_ENV !== 'production' && schedulerRequested;

        if (shouldRunSchedulers) {
            logger.info('ENABLE_SCHEDULER is true. Attempting to start scheduler inside backend entry...');
            await startScheduler();
        } else {
            logger.info('Scheduler execution disabled on this API process');
        }

        // Start system heartbeat monitor
        startSystemMonitor();
        startReliabilityProbeLoop();

        if (shouldRunSchedulers) {
            // Start user geo audit cron (lightweight; runs with distributed lock)
            startGeoAuditCron();

            // Start fraud auto-escalation cron (distributed lock; auto-suspends high-risk users)
            startFraudEscalationCron();
        } else {
            logger.info('Background cron execution disabled (RUN_SCHEDULERS=false)');
        }

        const { default: app } = await import('./app');

        // 3️⃣ CREATE HTTP SERVER
        const server = createServer(app);

        // 4️⃣ ATTACH SOCKET.IO (must happen before listen so the upgrade is available)
        initIO(server);

        // 5️⃣ START LISTENER WITH DETERMINISTIC BIND ERROR HANDLING
        await new Promise<void>((resolve, reject) => {
            const onError = (err: NodeJS.ErrnoException) => {
                server.off('error', onError);
                if (err.code === 'EADDRINUSE') {
                    logger.error(`Port ${PORT} already in use. Backend already running.`, {
                        port: PORT,
                        code: err.code,
                    });
                }
                reject(err);
            };

            server.once('error', onError);
            server.listen(PORT, () => {
                server.off('error', onError);
                logger.info(`Server running on http://localhost:${PORT}`, {
                    port: PORT,
                    environment: env.NODE_ENV,
                });
                resolve();
            });
        });

        // Post-bind errors should be logged but should not crash process unconditionally.
        server.on('error', (err: NodeJS.ErrnoException) => {
            logger.error('HTTP server runtime error', {
                code: err.code,
                message: err.message,
            });
        });

        setupGracefulShutdown(server, shouldRunSchedulers);

    } catch (err) {
        const error = err as NodeJS.ErrnoException;
        if (error?.code === 'EADDRINUSE') {
            logger.warn('Startup skipped: API server is already running on configured port', {
                port: PORT,
                code: error.code,
            });
            return;
        }

        logger.error('Server failed to start', {
            error: err instanceof Error ? err.message : String(err),
            stack: err instanceof Error ? err.stack : undefined,
        });
        process.exit(1);
    }
}

import { gracefulShutdown } from '@esparex/core/utils/shutdownHandler';
import redisClient from '@esparex/core/utils/redisCache';

function startReliabilityProbeLoop() {
    if (reliabilityProbeInterval) return;
    reliabilityProbeInterval = setInterval(() => {
        void getHealthCheckData()
            .then((health) => {
                if (health.status !== 'ok') {
                    logger.warn('[RELIABILITY_PROBE] degraded subsystem detected', {
                        status: health.status,
                        redisConnected: health.redisConnected,
                        dbStatus: health.databaseHealth.overall,
                        queueStatus: health.queueStatus,
                        workerStatus: health.workerStatus,
                    });
                } else {
                    const resetCount = resetAllOpenCircuitBreakers('health_probe_ok');
                    if (resetCount > 0) {
                        logger.warn('[RELIABILITY_PROBE] circuit breakers auto-reset after recovery', {
                            resetCount,
                        });
                    }
                }
            })
            .catch((error: unknown) => {
                logger.error('[RELIABILITY_PROBE] probe execution failed', {
                    error: error instanceof Error ? error.message : String(error),
                });
            });
    }, 30_000);
    reliabilityProbeInterval.unref();
}

/**
 * 🛡️ GRACEFUL SHUTDOWN HANDLER
 */
function setupGracefulShutdown(server: Server, shouldStopScheduler: boolean) {
    const handleShutdown = async () => {
        if (reliabilityProbeInterval) {
            clearInterval(reliabilityProbeInterval);
            reliabilityProbeInterval = null;
        }
        if (shouldStopScheduler) {
            await stopScheduler().catch((error: unknown) => {
                logger.error('Failed to stop scheduler during shutdown', {
                    error: error instanceof Error ? error.message : String(error),
                });
            });
        }
        await gracefulShutdown({
            server,
            redisClient,
            mongooseConnection: mongoose.connection
        });
    };

    process.on('SIGTERM', () => void handleShutdown());
    process.on('SIGINT', () => void handleShutdown());

    // Nodemon / PM2 restarts
    process.once('SIGUSR2', () => {
        void handleShutdown().then(() => process.kill(process.pid, 'SIGUSR2'));
    });
}
