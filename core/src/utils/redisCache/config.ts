import redisClient from '../../config/redis';
import logger from '../logger';
import { env } from '../../config/env';
import { withTimeout } from '../resilience';

const REDIS_MODE = env.REDIS_MODE;
const isJestRuntime = typeof process.env.JEST_WORKER_ID !== 'undefined';
export const shouldDisableRedis = (env.NODE_ENV === 'test' || isJestRuntime || !env.ALLOW_REDIS);

export const client = redisClient;

export let isConnected = false;
// eslint-disable-next-line prefer-const -- reassigned from admin.ts via globalThis
export let isHighMemoryPressure = false;
let redisDisconnectedSince: number | null = null;
export const REDIS_RECOVERY_PROBE_TIMEOUT_MS = env.RELIABILITY_REDIS_RECOVERY_PROBE_TIMEOUT_MS ?? 2_000;

export const cacheMetrics = {
    hits: 0, misses: 0, errors: 0, keys: 0, memory: 0, lastUpdated: new Date()
};

if (!shouldDisableRedis) {
    client.on('error', (err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        if (isConnected) logger.error('🔴 Redis Error in Cache:', message);
        cacheMetrics.errors++;
        isConnected = false;
        if (redisDisconnectedSince === null) redisDisconnectedSince = Date.now();
    });
    client.on('connect', () => { isConnected = true; });
    client.on('reconnecting', () => {
        isConnected = false;
        if (redisDisconnectedSince === null) redisDisconnectedSince = Date.now();
    });
    client.on('ready', () => {
        isConnected = true;
        if (redisDisconnectedSince !== null) {
            const downtimeMs = Math.max(0, Date.now() - redisDisconnectedSince);
            redisDisconnectedSince = null;
            void (async () => {
                let recoveryProbeOk = false;
                try {
                    const pong = await withTimeout(client.ping(), REDIS_RECOVERY_PROBE_TIMEOUT_MS, 'Redis recovery probe');
                    recoveryProbeOk = pong === 'PONG';
                } catch { /* probe failed */ }
                const { reliabilityAlertsTotal } = await import('../metrics');
                const { emitReliabilityAlert } = await import('../reliabilityAlerts');
                reliabilityAlertsTotal.labels('REDIS_RECOVERED', 'info').inc();
                await emitReliabilityAlert({
                    type: 'REDIS_RECOVERED', title: 'Redis recovered after disconnect', severity: 'info',
                    summary: 'Redis connection recovered and is healthy', dedupeKey: 'redis_recovered',
                    service: 'api-runtime', module: 'redis-recovery',
                    metadata: { downtimeMs, redisMode: REDIS_MODE, recoveryProbeOk },
                });
            })();
        }
    });
}
