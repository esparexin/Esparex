export const CACHE_NAMESPACES = {
    SEARCH: 'search',
    SEARCH_ADS: 'search:ads',
    ADS_HOME: 'ads:home',
    LOCATION: 'location',
    USER: 'user',
    BLACKLIST: 'blacklist',
    RATE_LIMIT: 'rl',
    SCHEDULER: 'scheduler',
    SYSTEM: 'system'
} as const;

export const CACHE_KEYS = {
    DEFAULT_INDIA: 'location:default:india',
    CATEGORIES: 'catalog:categories:all',
    metadata: (type: string, id: string) => `meta:${type}:${id}`,
    searchCity: (query: string) => `loc_search:${query.toLowerCase().trim()}`,
    nearbyCity: (latRounded: number, lngRounded: number) => `location:nearby:city:${latRounded}:${lngRounded}`,
    reverseGeocode: (latRounded: string, lngRounded: string) => `geo:${latRounded}:${lngRounded}`
};

export const CACHE_TTLS = {
    CITY_SEARCH: 3600,
    NEARBY_LOOKUP: 21600,
    REVERSE_GEOCODE: 3600,
    DEFAULT_INDIA: 604800,
    CATEGORIES: 3600,
    HOME_PAGE: 1800,
    HOME_FEED: 300,
    SEARCH: 300,
    SYSTEM: 120
};

export const GOVERNED_CACHE_PATTERNS: ReadonlyArray<string> = [
    'feed:*:home:*',
    `${CACHE_NAMESPACES.SEARCH}:*`,
    `${CACHE_NAMESPACES.ADS_HOME}:*`,
    `${CACHE_NAMESPACES.LOCATION}:*`,
    `${CACHE_NAMESPACES.USER}:*`,
    `${CACHE_NAMESPACES.BLACKLIST}:*`,
    `${CACHE_NAMESPACES.RATE_LIMIT}:*`,
    `${CACHE_NAMESPACES.SCHEDULER}:*`,
    `${CACHE_NAMESPACES.SYSTEM}:*`
];

export const REDIS_SCAN_BATCH_SIZE = 200;
export const REDIS_DELETE_BATCH_SIZE = 500;
export const REDIS_HEALTH_PROBE_TTL_SECONDS = 5;
export const REDIS_TTL_AUDIT_SAMPLE_LIMIT = 200;
export const REDIS_MEMORY_PRESSURE_THRESHOLD = 0.7;
export const RECOMMENDED_REDIS_EVICTION_POLICY = 'allkeys-lru';
export const REDIS_PROBE_TIMEOUT_MS = 2_000;

export const parseInfoNumberMetric = (info: string, metric: string): number | null => {
    const match = info.match(new RegExp(`${metric}:(\\d+)`));
    if (!match) return null;
    const parsed = parseInt(match[1] ?? '0', 10);
    return Number.isFinite(parsed) ? parsed : null;
};

export const parseInfoStringMetric = (info: string, metric: string): string | null => {
    const match = info.match(new RegExp(`${metric}:([^\\r\\n]+)`));
    return match && match[1] ? match[1].trim() : null;
};

export const getDefaultTtlForKey = (key: string): number | null => {
    if (/^feed:v[0-9]+:home:/.test(key)) return CACHE_TTLS.HOME_FEED;
    if (key.startsWith(`${CACHE_NAMESPACES.ADS_HOME}:`)) return CACHE_TTLS.HOME_PAGE;
    if (key.startsWith(`${CACHE_NAMESPACES.SEARCH_ADS}:`)) return CACHE_TTLS.SEARCH;
    if (key.startsWith(`${CACHE_NAMESPACES.SEARCH}:{`)) return CACHE_TTLS.SEARCH;
    if (key.startsWith('loc_search:')) return CACHE_TTLS.CITY_SEARCH;
    if (key.startsWith(`${CACHE_NAMESPACES.LOCATION}:search:city:`)) return CACHE_TTLS.CITY_SEARCH;
    if (key.startsWith(`${CACHE_NAMESPACES.LOCATION}:`)) return CACHE_TTLS.CITY_SEARCH;
    if (key.startsWith('user:status:')) return 300;
    if (key.startsWith('blacklist:token:')) return 3600;
    if (key.startsWith(`${CACHE_NAMESPACES.RATE_LIMIT}:`)) return 900;
    if (key.startsWith(`${CACHE_NAMESPACES.SCHEDULER}:metrics:lock:`)) return 8 * 24 * 60 * 60;
    if (key.startsWith(`${CACHE_NAMESPACES.SYSTEM}:config:`)) return CACHE_TTLS.SYSTEM;
    return null;
};

export const normalizeQueryValue = (value: unknown): string | null => {
    if (value === undefined || value === null) return null;
    if (Array.isArray(value)) {
        const s = value.map((entry) => normalizeQueryValue(entry)).filter((e): e is string => Boolean(e)).sort();
        return s.length > 0 ? s.join(',') : null;
    }
    if (typeof value === 'object') {
        try {
            const sorted = Object.keys(value as Record<string, unknown>).sort().reduce((acc, k) => { acc[k] = (value as Record<string, unknown>)[k]; return acc; }, {} as Record<string, unknown>);
            return JSON.stringify(sorted);
        } catch { return null; }
    }
    const s = String(value).trim();
    return s.length > 0 ? s : null;
};

export const buildDeterministicSearchCacheKey = (query: Record<string, unknown>): string => {
    const segments = Object.keys(query).sort().map((key) => {
        const nv = normalizeQueryValue(query[key]);
        return nv ? `${key}=${encodeURIComponent(nv)}` : null;
    }).filter((s): s is string => Boolean(s));
    return segments.length > 0 ? `${CACHE_NAMESPACES.SEARCH_ADS}:${segments.join(':')}` : `${CACHE_NAMESPACES.SEARCH_ADS}:default`;
};
