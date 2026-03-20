import 'dotenv/config';

import "./config/loadEnv";
import logger from "./utils/logger";

const role = process.env.PROCESS_ROLE || 'api';

if (role === 'worker') {
    logger.info("Initializing BullMQ Worker Process...");
    import("./workers").then(({ startWorkers }) => {
        startWorkers();
    }).catch(err => {
        logger.error("Failed to start workers", { error: err instanceof Error ? err.message : String(err) });
        process.exit(1);
    });
} else {
    logger.info("Initializing API Server Process...");
    import("./server").then(({ startServer }) => {
        startServer();
    }).catch(err => {
        logger.error("Failed to start server", { error: err instanceof Error ? err.message : String(err) });
        process.exit(1);
    });
}
