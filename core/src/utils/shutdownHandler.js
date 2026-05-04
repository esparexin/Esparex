"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gracefulShutdown = void 0;
const logger_1 = __importDefault(require("./logger"));
const socket_1 = require("@core/config/socket");
const gracefulShutdown = async ({ server, worker, workers, redisClient, mongooseConnection }) => {
    logger_1.default.info("Shutdown initiated...");
    // Start a timeout to force exit if everything takes too long
    setTimeout(() => {
        logger_1.default.error("Forced shutdown after timeout.");
        process.exit(1);
    }, 10000).unref(); // unref so it doesn't block event loop if not needed
    try {
        // Close socket.io before the HTTP server so in-flight WS frames are drained
        try {
            await (0, socket_1.closeIO)();
        }
        catch {
            // Socket may not have been initialised (e.g. test environment)
        }
        if (server) {
            await new Promise((resolve, reject) => {
                server.close((err) => {
                    if (err)
                        return reject(err);
                    resolve();
                });
            });
            logger_1.default.info("HTTP server closed.");
        }
        const workerList = workers || (worker ? [worker] : []);
        if (workerList.length > 0) {
            await Promise.all(workerList.map(async (bullWorker) => {
                await bullWorker.close();
            }));
            logger_1.default.info("BullMQ worker closed.", { count: workerList.length });
        }
        if (redisClient) {
            await redisClient.quit();
            logger_1.default.info("Redis connection closed.");
        }
        if (mongooseConnection) {
            await mongooseConnection.close();
            logger_1.default.info("Mongoose connection closed.");
        }
        logger_1.default.info("Shutdown complete.");
        process.exit(0);
    }
    catch (err) {
        logger_1.default.error("Error during graceful shutdown", { error: err instanceof Error ? err.message : String(err) });
        process.exit(1);
    }
};
exports.gracefulShutdown = gracefulShutdown;
//# sourceMappingURL=shutdownHandler.js.map