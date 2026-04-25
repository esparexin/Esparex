import 'dotenv/config';

import "@core/config/loadEnv";
import logger from "@core/utils/logger";

const role = process.env.PROCESS_ROLE || 'api';

if (role === 'worker') {
    logger.info("Initializing BullMQ Worker Process...");
    import("@core/workers").then(({ startWorkers }) => {
        startWorkers();
    }).catch(err => {
        logger.error("Failed to start workers", { error: err instanceof Error ? err.message : String(err) });
        process.exit(1);
    });
} else {
    logger.info("Initializing API Server Process...");
    import("./server").then(({ startServer }) => {
        void startServer();
    }).catch(err => {
        logger.error("Failed to start server", { error: err instanceof Error ? err.message : String(err) });
        process.exit(1);
    });
}
