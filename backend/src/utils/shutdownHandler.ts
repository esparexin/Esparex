import logger from './logger';
import { closeIO } from '../config/socket';

interface ShutdownDependencies {
    server?: import('http').Server;
    worker?: import('bullmq').Worker;
    workers?: import('bullmq').Worker[];
    redisClient?: import('ioredis').Redis;
    mongooseConnection?: import('mongoose').Connection;
}

export const gracefulShutdown = async ({ server, worker, workers, redisClient, mongooseConnection }: ShutdownDependencies) => {
    logger.info("Shutdown initiated...");

    // Start a timeout to force exit if everything takes too long
    setTimeout(() => {
        logger.error("Forced shutdown after timeout.");
        process.exit(1);
    }, 10000).unref(); // unref so it doesn't block event loop if not needed

    try {
        // Close socket.io before the HTTP server so in-flight WS frames are drained
        try {
            await closeIO();
        } catch {
            // Socket may not have been initialised (e.g. test environment)
        }

        if (server) {
            await new Promise<void>((resolve, reject) => {
                server.close((err) => {
                    if (err) return reject(err);
                    resolve();
                });
            });
            logger.info("HTTP server closed.");
        }

        const workerList = workers || (worker ? [worker] : []);
        if (workerList.length > 0) {
            await Promise.all(workerList.map(async (bullWorker) => {
                await bullWorker.close();
            }));
            logger.info("BullMQ worker closed.", { count: workerList.length });
        }

        if (redisClient) {
            await redisClient.quit();
            logger.info("Redis connection closed.");
        }

        if (mongooseConnection) {
            await mongooseConnection.close();
            logger.info("Mongoose connection closed.");
        }

        logger.info("Shutdown complete.");
        process.exit(0);

    } catch (err) {
        logger.error("Error during graceful shutdown", { error: err instanceof Error ? err.message : String(err) });
        process.exit(1);
    }
};
