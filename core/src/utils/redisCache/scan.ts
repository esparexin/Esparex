import { client, isConnected, cacheMetrics } from './config';

export const scanKeysByPattern = async (pattern: string, options: { count?: number; maxKeys?: number } = {}): Promise<string[]> => {
    if (!isConnected) return [];
    const count = Math.max(10, options.count ?? 200);
    const maxKeys = Math.max(1, options.maxKeys ?? Number.MAX_SAFE_INTEGER);
    const collected: string[] = [];
    let cursor = '0';
    try {
        do {
            const rawResult = await client.scan(cursor, 'MATCH', pattern, 'COUNT', count);
            const nextCursor = Array.isArray(rawResult) ? rawResult[0] : '0';
            const batch = Array.isArray(rawResult) ? rawResult[1] : [];
            if (Array.isArray(batch) && batch.length > 0) collected.push(...batch);
            cursor = String(nextCursor);
            if (collected.length >= maxKeys) return collected.slice(0, maxKeys);
        } while (cursor !== '0');
    } catch { cacheMetrics.errors++; return []; }
    return collected;
};

const deleteKeysInBatches = async (keys: string[]): Promise<number> => {
    if (!isConnected || keys.length === 0) return 0;
    let deleted = 0;
    for (let i = 0; i < keys.length; i += 500) {
        const chunk = keys.slice(i, i + 500);
        if (chunk.length === 0) continue;
        try { deleted += await client.del(...chunk); }
        catch { cacheMetrics.errors++; }
    }
    return deleted;
};

export const clearCachePattern = async (pattern: string, options: { count?: number; maxKeys?: number } = {}): Promise<number> => {
    if (!isConnected) return 0;
    const keys = await scanKeysByPattern(pattern, options);
    return deleteKeysInBatches(keys);
};
