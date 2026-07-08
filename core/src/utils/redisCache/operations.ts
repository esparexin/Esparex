import { client, isConnected, isHighMemoryPressure, cacheMetrics } from './config';

export const getCache = async <T>(key: string): Promise<T | null> => {
    if (!isConnected) return null;
    try { const data = await client.get(key); if (data) { cacheMetrics.hits++; return JSON.parse(data) as T; } }
    catch { cacheMetrics.errors++; }
    cacheMetrics.misses++;
    return null;
};

export const setCache = async (key: string, value: unknown, ttlSeconds: number = 3600): Promise<boolean> => {
    if (!isConnected) return false;
    const finalTTL = isHighMemoryPressure ? Math.max(1, Math.floor(Math.max(1, ttlSeconds) / 2)) : Math.max(1, ttlSeconds);
    try { await client.set(key, JSON.stringify(value), 'EX', finalTTL); return true; }
    catch { cacheMetrics.errors++; return false; }
};

export const getMultiCache = async <T>(keys: string[]): Promise<(T | null)[]> => {
    if (!isConnected || keys.length === 0) return keys.map(() => null);
    try {
        const results = await client.mget(...keys);
        return results.map(data => {
            if (data) { cacheMetrics.hits++; try { return JSON.parse(data) as T; } catch { return null; } }
            cacheMetrics.misses++; return null;
        });
    } catch { cacheMetrics.errors++; return keys.map(() => null); }
};

export const setMultiCache = async (entries: { key: string; value: unknown }[], ttlSeconds: number = 3600): Promise<boolean> => {
    if (!isConnected || entries.length === 0) return false;
    try { const p = client.pipeline(); entries.forEach(e => p.set(e.key, JSON.stringify(e.value), 'EX', ttlSeconds)); await p.exec(); return true; }
    catch { cacheMetrics.errors++; return false; }
};

export const delCache = async (key: string): Promise<boolean> => {
    if (!isConnected) return false;
    try { await client.del(key); return true; }
    catch { cacheMetrics.errors++; return false; }
};
