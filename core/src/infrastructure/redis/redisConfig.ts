export const LOCAL_REDIS_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);

export type RedisConfigSource = 'url' | 'discrete';

export interface RedisConfigSeed {
    REDIS_URL?: string | null;
    REDIS_HOST?: string | null;
    REDIS_PORT?: string | number | null;
    REDIS_DB?: string | number | null;
    REDIS_USERNAME?: string | null;
    REDIS_PASSWORD?: string | null;
}

export interface ResolvedRedisConfig {
    source: RedisConfigSource;
    host: string;
    port: number;
    db: number;
    username?: string;
    password?: string;
    tlsEnabled: boolean;
    redisUrl: string;
    sanitizedRedisUrl: string;
}

const trimRedisValue = (value: string | null | undefined): string | undefined => {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
};

export const decodeRedisCredential = (value: string): string => {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
};

export const sanitizeRedisUrl = (value: string): string => {
    try {
        const parsed = new URL(value);
        if (parsed.password) parsed.password = '****';
        return parsed.toString();
    } catch {
        return value.replace(/:[^:@/]+@/, ':****@');
    }
};

export const isLocalRedisHost = (value: string): boolean =>
    LOCAL_REDIS_HOSTS.has(value.toLowerCase());

const parseRedisDbValue = (raw: string | number | null | undefined, fallbackDb: number): number => {
    if (typeof raw === 'number') {
        return Number.isFinite(raw) && raw >= 0 ? raw : fallbackDb;
    }
    const candidate = trimRedisValue(raw);
    if (!candidate) return fallbackDb;
    const parsed = Number(candidate);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallbackDb;
};

const parseRedisDbFromPath = (pathname: string, fallbackDb: number): number => {
    const candidate = pathname.replace(/^\//, '').trim();
    if (!candidate) return fallbackDb;
    const parsedDb = Number(candidate);
    return Number.isFinite(parsedDb) && parsedDb >= 0 ? parsedDb : fallbackDb;
};

const buildRedisUrl = (config: {
    host: string;
    port: number;
    db: number;
    username?: string;
    password?: string;
    tlsEnabled: boolean;
}): string => {
    const protocol = config.tlsEnabled ? 'rediss' : 'redis';
    const encodedUsername = config.username ? encodeURIComponent(config.username) : '';
    const encodedPassword = config.password ? encodeURIComponent(config.password) : '';
    const auth = encodedUsername || encodedPassword
        ? `${encodedUsername}:${encodedPassword}@`
        : '';
    const hostForUrl = config.host.includes(':') && !config.host.startsWith('[')
        ? `[${config.host}]`
        : config.host;
    return `${protocol}://${auth}${hostForUrl}:${config.port}/${config.db}`;
};

const parseRedisPortValue = (raw: string | number | null | undefined): number => {
    if (typeof raw === 'number') return raw;
    const trimmed = trimRedisValue(raw);
    return Number(trimmed || '6379');
};

export const resolveRedisConfig = (seed: RedisConfigSeed): ResolvedRedisConfig => {
    const redisUrlFromEnv = trimRedisValue(seed.REDIS_URL);
    const redisUsernameFromEnv = trimRedisValue(seed.REDIS_USERNAME);
    const redisPasswordFromEnv = trimRedisValue(seed.REDIS_PASSWORD);
    const fallbackDb = parseRedisDbValue(seed.REDIS_DB, 0);

    if (redisUrlFromEnv) {
        const parsed = new URL(redisUrlFromEnv);
        if (!['redis:', 'rediss:'].includes(parsed.protocol)) {
            throw new Error(`Invalid REDIS_URL protocol: ${parsed.protocol}`);
        }

        const host = parsed.hostname.trim();
        if (!host) {
            throw new Error('Invalid REDIS_URL: hostname is required');
        }

        const parsedPort = parsed.port ? Number(parsed.port) : 6379;
        if (!Number.isFinite(parsedPort) || parsedPort <= 0) {
            throw new Error(`Invalid REDIS_URL port: ${parsed.port || 'missing'}`);
        }

        const parsedUsername = parsed.username ? decodeRedisCredential(parsed.username) : undefined;
        const parsedPassword = parsed.password ? decodeRedisCredential(parsed.password) : undefined;
        const db = parseRedisDbFromPath(parsed.pathname, fallbackDb);
        const username = redisUsernameFromEnv ?? parsedUsername;
        const password = redisPasswordFromEnv ?? parsedPassword;
        const tlsEnabled = parsed.protocol === 'rediss:';
        const redisUrl = buildRedisUrl({
            host,
            port: parsedPort,
            db,
            username,
            password,
            tlsEnabled,
        });

        return {
            source: 'url',
            host,
            port: parsedPort,
            db,
            username,
            password,
            tlsEnabled,
            redisUrl,
            sanitizedRedisUrl: sanitizeRedisUrl(redisUrl),
        };
    }

    const host = trimRedisValue(seed.REDIS_HOST) || 'localhost';
    const port = parseRedisPortValue(seed.REDIS_PORT);
    if (!Number.isFinite(port) || port <= 0) {
        throw new Error(`Invalid REDIS_PORT value: ${String(seed.REDIS_PORT)}`);
    }

    const redisUrl = buildRedisUrl({
        host,
        port,
        db: fallbackDb,
        username: redisUsernameFromEnv,
        password: redisPasswordFromEnv,
        tlsEnabled: false,
    });

    return {
        source: 'discrete',
        host,
        port,
        db: fallbackDb,
        username: redisUsernameFromEnv,
        password: redisPasswordFromEnv,
        tlsEnabled: false,
        redisUrl,
        sanitizedRedisUrl: sanitizeRedisUrl(redisUrl),
    };
};

