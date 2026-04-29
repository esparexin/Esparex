// 1. REGISTER ALIASES (MUST BE FIRST)
require('../../scripts/register-aliases');

import '@core/config/loadEnv'; // MUST BE FIRST
import app from './app';
import { connectDB } from '@core/config/db';
import logger from '@core/utils/logger';
import { env } from '@core/config/env';

const PORT = env.PORT || 5002; // Override port to 5002 if not set

const startServer = async () => {
    try {
        await connectDB();
        const server = app.listen(PORT, () => {
            logger.info(`[admin-backend] Server is running on port ${PORT} in ${env.NODE_ENV} mode`);
        });

        // Handle graceful shutdown
        process.on('SIGTERM', () => {
            logger.info('[admin-backend] SIGTERM received. Shutting down gracefully.');
            server.close(() => {
                logger.info('[admin-backend] Process terminated.');
                process.exit(0);
            });
        });
    } catch (error) {
        logger.error('[admin-backend] Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
