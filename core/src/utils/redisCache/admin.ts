import { client, isConnected, cacheMetrics, REDIS_RECOVERY_PROBE_TIMEOUT_MS } from './config';
import logger from '../logger';
import { withTimeout } from '../resilience';
import { scanKeysByPattern } from './scan';
import {
    GOVERNED_CACHE_PATTERNS, REDIS_TTL_AUDIT_SAMPLE_LIMIT,
    REDIS_PROBE_TIMEOUT_MS, REDIS_HEALTH_PROBE_TTL_SECONDS,
    REDIS_MEMORY_PRESSURE_THRESHOLD, RECOMMENDED_REDIS_EVICTION_POLICY,
    CACHE_NAMESPACES, parseInfoNumberMetric, parseInfoStringMetric, getDefaultTtlForKey,
} from './constants';

let lastRedisConfigWarningSignature: string | null = null;

const getHitRateStatus = () => {
    const total = cacheMetrics.hits + cacheMetrics.misses;
    if (total === 0) return 'healthy';
    const rate = cacheMetrics.hits / total;
    if (rate < 0.5) return 'critical';
    if (rate < 0.7) return 'warning';
    return 'healthy';
};

const checkMemoryHealth = async () => {
    if (!isConnected) return;
    try {
        const info = await client.info('memory');
        const used = parseInfoNumberMetric(info, 'used_memory') ?? 0;
        const max = parseInfoNumberMetric(info, 'maxmemory') ?? 0;
        const maxMemoryPolicy = parseInfoStringMetric(info, 'maxmemory_policy') || 'unknown';
        if (max > 0) {
            (globalThis as any).__redisHighMemoryPressure = (used / max) > REDIS_MEMORY_PRESSURE_THRESHOLD;
        } else {
            (globalThis as any).__redisHighMemoryPressure = false;
        }
        if (process.env.NODE_ENV === 'production') {
            const warnings: string[] = [];
            if (max <= 0) warnings.push('maxmemory is not configured');
            if (maxMemoryPolicy !== RECOMMENDED_REDIS_EVICTION_POLICY) warnings.push(`maxmemory_policy is ${maxMemoryPolicy} (recommended: ${RECOMMENDED_REDIS_EVICTION_POLICY})`);
            const sig = warnings.join(' | ');
            if (sig && sig !== lastRedisConfigWarningSignature) { logger.warn(`[REDIS_CONFIG] ${sig}`); lastRedisConfigWarningSignature = sig; }
            if (!sig) lastRedisConfigWarningSignature = null;
        }
    } catch { /* silent */ }
};

setInterval(() => void checkMemoryHealth(), 300000).unref();

const buildProbeKey = (): string => `${CACHE_NAMESPACES.SYSTEM}:health:probe:${Date.now().toString(36)}:${Math.random().toString(36).slice(2, 8)}`;

export const getRedisHealthProbe = async (): Promise<{
    connected: boolean; pingOk: boolean; roundTripOk: boolean; latencyMs: number | null; error?: string;
}> => {
    const { reliabilityAlertsTotal } = await import('../metrics');
    const { emitReliabilityAlert } = await import('../reliabilityAlerts');

    if (!isConnected) {
        reliabilityAlertsTotal.labels('REDIS_DOWN', 'critical').inc();
        void emitReliabilityAlert({
            type: 'REDIS_DOWN', title: 'Redis is unavailable', severity: 'critical',
            summary: 'Redis client is disconnected', dedupeKey: 'redis_down',
            metadata: { redisMode: process.env.REDIS_MODE, connected: isConnected },
        });
        return { connected: false, pingOk: false, roundTripOk: false, latencyMs: null, error: 'Redis client is disconnected' };
    }

    const probeKey = buildProbeKey();
    const probeValue = Date.now().toString(36);
    const startedAt = Date.now();

    try {
        const pong = await withTimeout(client.ping(), REDIS_PROBE_TIMEOUT_MS, 'Redis ping probe');
        const pingOk = pong === 'PONG';
        await withTimeout(client.set(probeKey, probeValue, 'EX', REDIS_HEALTH_PROBE_TTL_SECONDS), REDIS_PROBE_TIMEOUT_MS, 'Redis probe set');
        const readBack = await withTimeout(client.get(probeKey), REDIS_PROBE_TIMEOUT_MS, 'Redis probe get');
        await withTimeout(client.del(probeKey), REDIS_PROBE_TIMEOUT_MS, 'Redis probe del');
        const roundTripOk = readBack === probeValue;
        if (!(pingOk && roundTripOk)) {
            reliabilityAlertsTotal.labels('REDIS_DEGRADED', 'high').inc();
            void emitReliabilityAlert({
                type: 'REDIS_DEGRADED', title: 'Redis health probe degraded', severity: 'high',
                summary: 'Redis ping or round-trip probe failed', dedupeKey: 'redis_degraded', metadata: { pingOk, roundTripOk },
            });
        }
        return { connected: true, pingOk, roundTripOk, latencyMs: Date.now() - startedAt };
    } catch (error: unknown) {
        cacheMetrics.errors++;
        reliabilityAlertsTotal.labels('REDIS_DOWN', 'critical').inc();
        void emitReliabilityAlert({
            type: 'REDIS_DOWN', title: 'Redis probe failed', severity: 'critical',
            summary: 'Redis health probe operation failed', dedupeKey: 'redis_probe_failure',
            metadata: { error: error instanceof Error ? error.message : String(error) },
        });
        return { connected: true, pingOk: false, roundTripOk: false, latencyMs: Date.now() - startedAt, error: error instanceof Error ? error.message : String(error) };
    }
};

const auditKeyTtl = async (key: string): Promise<{ ttl: number | null; autoFixed: boolean }> => {
    try {
        const ttl = await client.ttl(key);
        if (ttl === -1) {
            const fallbackTtl = getDefaultTtlForKey(key);
            if (fallbackTtl && fallbackTtl > 0) {
                const repaired = await client.expire(key, fallbackTtl);
                if (repaired === 1) return { ttl: fallbackTtl, autoFixed: true };
            }
        }
        return { ttl, autoFixed: false };
    } catch { cacheMetrics.errors++; return { ttl: null, autoFixed: false }; }
};

export const getCacheStats = async () => {
    let memoryUsedBytes = 0, totalKeys = 0, maxMemoryBytes = 0;
    let maxMemoryPolicy = 'unknown';
    let ttlAudit = { sampledKeys: 0, keysWithoutTtl: 0, keysAutoFixed: 0 };
    const redisHealth = await getRedisHealthProbe();

    if (isConnected) {
        try {
            const info = await client.info('memory');
            memoryUsedBytes = parseInfoNumberMetric(info, 'used_memory') ?? 0;
            maxMemoryBytes = parseInfoNumberMetric(info, 'maxmemory') ?? 0;
            maxMemoryPolicy = parseInfoStringMetric(info, 'maxmemory_policy') || 'unknown';
            totalKeys = await client.dbsize();
            await checkMemoryHealth();
            const sampled = new Set<string>();
            for (const pattern of GOVERNED_CACHE_PATTERNS) {
                const keys = await scanKeysByPattern(pattern, { count: 100, maxKeys: 50 });
                for (const key of keys) { sampled.add(key); if (sampled.size >= REDIS_TTL_AUDIT_SAMPLE_LIMIT) break; }
                if (sampled.size >= REDIS_TTL_AUDIT_SAMPLE_LIMIT) break;
            }
            const sampledKeys = Array.from(sampled);
            if (sampledKeys.length > 0) {
                let keysAutoFixed = 0;
                const results = await Promise.all(sampledKeys.map(key => auditKeyTtl(key)));
                for (const r of results) { if (r.autoFixed) keysAutoFixed += 1; }
                const ttlValues = results.map(r => r.ttl);
                ttlAudit = { sampledKeys: sampledKeys.length, keysWithoutTtl: ttlValues.filter(t => t === -1).length, keysAutoFixed };
            }
        } catch { /* ignore */ }
    }

    return {
        connected: isConnected,
        mode: process.env.REDIS_MODE,
        namespaces: CACHE_NAMESPACES,
        redisHealth,
        redisConfig: { maxMemoryBytes, maxMemoryPolicy, evictionPolicyRecommended: RECOMMENDED_REDIS_EVICTION_POLICY, isRecommendedPolicy: maxMemoryPolicy === RECOMMENDED_REDIS_EVICTION_POLICY },
        metrics: { ...cacheMetrics, memoryUsedMB: Number((memoryUsedBytes / (1024 * 1024)).toFixed(2)), totalKeys, ttlAudit, lastUpdated: new Date() },
        healthStatus: getHitRateStatus(),
        memoryPressureStatus: (globalThis as any).__redisHighMemoryPressure ? 'critical' : 'normal',
    };
};

setInterval(() => {
    if (isConnected) {
        const total = cacheMetrics.hits + cacheMetrics.misses;
        if (total > 0) {
            const rate = ((cacheMetrics.hits / total) * 100).toFixed(2);
            logger.info(`[REDIS_METRICS] Hit Rate: ${rate}% | Hits: ${cacheMetrics.hits} | Misses: ${cacheMetrics.misses}`);
        }
    }
}, 60000).unref();
