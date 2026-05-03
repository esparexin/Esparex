import '@esparex/core/config/loadEnv'; // MUST BE FIRST (Registers Aliases)
import app from './app';
import { connectDB } from '@core/config/db';
import logger from '@core/utils/logger';
import { env } from '@core/config/env';

const PORT = env.PORT || 5001; // Override port to 5001 if not set

const startServer = async (): Promise<void> => {
    try {
        await connectDB();
        const server = app.listen(PORT, () => {
            logger.info(`[backend/admin] Server is running on port ${PORT} in ${env.NODE_ENV} mode`);
        });

        // Handle graceful shutdown
        process.on('SIGTERM', () => {
            logger.info('[backend/admin] SIGTERM received. Shutting down gracefully.');
            server.close(() => {
                logger.info('[backend/admin] Process terminated.');
                process.exit(0);
            });
        });
    } catch (error) {
        logger.error('[backend/admin] Failed to start server:', error);
        process.exit(1);
    }
};

void startServer();
