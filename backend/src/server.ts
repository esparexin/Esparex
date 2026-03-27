import app from './app';
import { connectDB } from './config/db';
import mongoose from 'mongoose';
import { Server } from 'http';
import logger from './utils/logger';
import { env } from './config/env';
import { assertDuplicateRolloutReadiness } from './services/DuplicateRolloutGuard';
import { startScheduler } from './services/SchedulerBoot';
import Admin from './models/Admin';
import { USER_STATUS } from '@shared/enums/userStatus';
import { createServer } from 'http';
import { initializeEventDispatcher } from './events';
import { validateMetadataHealth } from './utils/startupValidator';

const PORT = env.PORT;

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

        if (env.NODE_ENV === 'production') {
            if (env.PROCESS_ROLE === 'api' && env.RUN_SCHEDULERS) {
                throw new Error(
                    'Invalid production scheduler config: PROCESS_ROLE=api must run with RUN_SCHEDULERS=false.'
                );
            }
            if (env.PROCESS_ROLE === 'scheduler' && !env.RUN_SCHEDULERS) {
                throw new Error(
                    'Invalid production scheduler config: PROCESS_ROLE=scheduler requires RUN_SCHEDULERS=true.'
                );
            }
        }

        await connectDB();
        logger.info('MongoDB connected successfully');
        
        // Validate Metadata Integrity (Split-Safe Check)
        await validateMetadataHealth();
        
        // Initialize Core Subsystems
        initializeEventDispatcher();
        
        const { initializeDatabaseMonitoring } = await import('./middleware/metricsMiddleware');
        initializeDatabaseMonitoring();
        logger.info('Boot safety mode active: skipping all index sync/create/drop operations on API startup');
        await assertDuplicateRolloutReadiness();

        // Ensure at least one LIVE admin is present for operations
        await ensureLiveAdminPresence();

        const shouldRunSchedulers = process.env.ENABLE_SCHEDULER === "true" || env.RUN_SCHEDULERS;

        if (shouldRunSchedulers) {
            logger.info('ENABLE_SCHEDULER is true. Attempting to start scheduler inside backend entry...');
            await startScheduler();
        } else {
            logger.info('Scheduler execution disabled on this API process');
        }

        // Start system heartbeat monitor
        const { startSystemMonitor } = await import('./utils/systemMonitor');
        startSystemMonitor();

        if (shouldRunSchedulers) {
            // Start taxonomy health cron (lightweight; runs on scheduler-enabled process)
            const { startTaxonomyHealthCron } = await import('./cron/taxonomyHealth');
            startTaxonomyHealthCron();

            // Start user geo audit cron (lightweight; runs with distributed lock)
            const { startGeoAuditCron } = await import('./cron/geoAudit');
            startGeoAuditCron();

            // Start fraud auto-escalation cron (distributed lock; auto-suspends high-risk users)
            const { startFraudEscalationCron } = await import('./cron/fraudEscalation');
            startFraudEscalationCron();
        } else {
            logger.info('Background cron execution disabled (RUN_SCHEDULERS=false)');
        }

        // 3️⃣ CREATE HTTP SERVER
        const server = createServer(app);

        // 4️⃣ ATTACH SOCKET.IO (must happen before listen so the upgrade is available)
        const { initIO } = await import('./config/socket');
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

        setupGracefulShutdown(server);

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

import { gracefulShutdown } from './utils/shutdownHandler';
import redisClient from './utils/redisCache';

/**
 * 🛡️ GRACEFUL SHUTDOWN HANDLER
 */
function setupGracefulShutdown(server: Server) {
    const handleShutdown = async () => {
        await gracefulShutdown({
            server,
            redisClient,
            mongooseConnection: mongoose.connection
        });
    };

    process.on('SIGTERM', handleShutdown);
    process.on('SIGINT', handleShutdown);

    // Nodemon / PM2 restarts
    process.once('SIGUSR2', async () => {
        await handleShutdown();
        process.kill(process.pid, 'SIGUSR2');
    });
}
