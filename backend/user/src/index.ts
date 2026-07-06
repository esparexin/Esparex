import "@esparex/core/config/loadEnv";
import { logger } from '@esparex/core/utils';;;;
import { waitForRedisReady } from '@esparex/core/infrastructure';;

const role = process.env.PROCESS_ROLE || 'api';

if (role === 'worker') {
    logger.info("Initializing BullMQ Worker Process...");
    void (async () => {
        await waitForRedisReady({
            context: 'worker-bootstrap',
        });
        const { startWorkers } = await import('@esparex/core/workers');
        startWorkers();
    })().catch(err => {
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
