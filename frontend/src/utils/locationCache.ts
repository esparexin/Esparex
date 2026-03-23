import logger from "@/lib/logger";
/**
 * Location Cache Utility
 * Provides client-side caching for location data with expiration and versioning
 */

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    version: string;
}

/**
 * Bump this version whenever the AppLocation schema changes.
 * Old clients will have their cached location cleared on next load.
 * Coordinate with backend deploy if locationId format changes.
 * Current version: v2 (upgraded from v1 when coordinates moved to GeoJSON Point)
 */
const CACHE_VERSION = "v2";
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_KEY_PREFIX = "esparex_location_";
const CACHE_TEST_KEY = "__location_cache_test__";

/**
 * Cache keys
 */
export const CACHE_KEYS = {
    SEARCH_PREFIX: `${CACHE_KEY_PREFIX}search_`,
} as const;

const hasLocalStorage = (): boolean =>
    typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const isValidCacheEntry = <T>(value: unknown): value is CacheEntry<T> => {
    if (!value || typeof value !== "object") return false;
    const entry = value as Record<string, unknown>;
    return (
        "data" in entry &&
        typeof entry.timestamp === "number" &&
        Number.isFinite(entry.timestamp) &&
        typeof entry.version === "string"
    );
};

/**
 * Set cache entry with timestamp and version
 */
export function setCacheEntry<T>(key: string, data: T): void {
    if (!hasLocalStorage()) return;

    try {
        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            version: CACHE_VERSION,
        };
        localStorage.setItem(key, JSON.stringify(entry));
    } catch (error) {
        logger.warn("[LocationCache] Failed to set cache:", error);
        // Silently fail - localStorage might be full or disabled
    }
}

/**
 * Get cache entry if valid (not expired, correct version)
 */
export function getCacheEntry<T>(key: string): T | null {
    if (!hasLocalStorage()) return null;

    try {
        const cached = localStorage.getItem(key);
        if (!cached) return null;

        const parsed: unknown = JSON.parse(cached);
        if (!isValidCacheEntry<T>(parsed)) {
            localStorage.removeItem(key);
            return null;
        }
        const entry = parsed as CacheEntry<T>;

        // Check version
        if (entry.version !== CACHE_VERSION) {
            localStorage.removeItem(key);
            return null;
        }

        // Check expiration
        const age = Date.now() - entry.timestamp;
        if (age > CACHE_EXPIRY) {
            localStorage.removeItem(key);
            return null;
        }

        return entry.data;
    } catch (error) {
        logger.warn("[LocationCache] Failed to get cache:", error);
        return null;
    }
}

/**
 * Get cache key for search query
 */
export function getSearchCacheKey(query: string): string {
    return `${CACHE_KEYS.SEARCH_PREFIX}${query.toLowerCase().trim()}`;
}

/**
 * Check if cache is available (localStorage enabled).
 * Not cached at module level to avoid SSR cross-request poisoning.
 */
export function isCacheAvailable(): boolean {
    if (typeof window === 'undefined') return false;

    try {
        localStorage.setItem(CACHE_TEST_KEY, CACHE_TEST_KEY);
        localStorage.removeItem(CACHE_TEST_KEY);
        return true;
    } catch {
        return false;
    }
}
