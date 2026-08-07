/**
 * ESPAREX BACKEND SMOKE TEST (CI + local verification)
 *
 * Boots the real backend through the same lifecycle the production
 * entrypoint uses (bootstrap → startListener), verifies the live /health
 * endpoint over HTTP, then tears everything down via the canonical shutdown
 * path. Exits 0 on success and 1 on any failure, so the CI workflow never
 * has to wait on a long-lived server process.
 *
 * Run with: MONGODB_URI, ADMIN_MONGODB_URI, REDIS_URL set (see ci.yml).
 */
import { env } from '@esparex/core/config/env';
import logger from '@esparex/core/utils/logger';
import { bootstrap, startListener, shutdownServer } from './server';

const PORT = env.PORT;

async function verifyHealthyServer(): Promise<void> {
    const url = `http://localhost:${PORT}/health`;
    logger.info('Smoke probe: verifying /health', { url, port: PORT });

    const res = await fetch(url);
    const body = (await res.json()) as { status?: string; success?: boolean };

    if (res.status === 200 && body.status !== 'error' && body.success !== false) {
        logger.info('Backend startup verification succeeded.');
        return;
    }

    throw new Error(
        `Health check failed: HTTP ${res.status} body=${JSON.stringify(body)}`
    );
}

async function runSmoke(): Promise<void> {
    const { shouldRunSchedulers } = await bootstrap();
    const server = await startListener();
    await verifyHealthyServer();

    logger.info('Backend smoke test passed — shutting down.');
    // Canonical shutdown always terminates the process (gracefulShutdown exits
    // with 0 on success and 1 on error), so this call never returns.
    await shutdownServer(server, shouldRunSchedulers);
    logger.error('Backend smoke test: shutdown returned without terminating — forcing exit.');
    process.exit(1);
}

void runSmoke().catch((error: unknown) => {
    logger.error('Backend smoke test FAILED', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
});
