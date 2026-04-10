type RuntimeOriginEnv = {
    NODE_ENV?: string;
    CORS_ORIGIN?: string;
    COOKIE_DOMAIN?: string;
    FRONTEND_URL?: string;
    FRONTEND_INTERNAL_URL?: string;
    ADMIN_FRONTEND_URL?: string;
    ADMIN_URL?: string;
};

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
const LOCAL_IPV4_PATTERN = /^(10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/;
const DEFAULT_LOCAL_ALLOWED_ORIGINS = ['http://localhost:3000', 'http://localhost:3001'];

export const normalizeOrigin = (value: string): string => value.trim().replace(/\/+$/, '').toLowerCase();

export const normalizeCookieDomainValue = (value: string | undefined): string | undefined => {
    const configured = value?.trim();
    if (!configured) return undefined;

    const normalized = configured
        .replace(/^\./, '')
        .replace(/\.$/, '')
        .toLowerCase();

    if (!normalized) return undefined;
    if (normalized.includes('://') || normalized.includes('/')) return undefined;
    if (!/^[a-z0-9.-]+$/.test(normalized)) return undefined;
    if (normalized.split('.').length < 2) return undefined;

    return normalized;
};

const parseOriginHosts = (rawValue: string | undefined): string[] =>
    (rawValue || '')
        .split(',')
        .map(normalizeOrigin)
        .filter(Boolean)
        .flatMap((origin) => {
            try {
                return [new URL(origin).hostname.toLowerCase()];
            } catch {
                return [];
            }
        });

const parseUrlHost = (rawValue: string | undefined): string | undefined => {
    const trimmed = rawValue?.trim();
    if (!trimmed) return undefined;

    try {
        return new URL(trimmed).hostname.toLowerCase();
    } catch {
        return undefined;
    }
};

const isLocalHost = (hostname: string): boolean =>
    LOCAL_HOSTS.has(hostname) || LOCAL_IPV4_PATTERN.test(hostname);

const getRootDomain = (hostname: string): string | undefined => {
    if (isLocalHost(hostname)) {
        return undefined;
    }

    const segments = hostname.toLowerCase().split('.').filter(Boolean);
    if (segments.length < 2) {
        return undefined;
    }

    return segments.slice(-2).join('.');
};

const collectFirstPartyHosts = (sourceEnv: RuntimeOriginEnv): string[] => {
    const candidates = [
        parseUrlHost(sourceEnv.FRONTEND_URL),
        parseUrlHost(sourceEnv.FRONTEND_INTERNAL_URL),
        parseUrlHost(sourceEnv.ADMIN_FRONTEND_URL),
        parseUrlHost(sourceEnv.ADMIN_URL),
        ...parseOriginHosts(sourceEnv.CORS_ORIGIN),
    ].filter((host): host is string => Boolean(host));

    return Array.from(new Set(candidates));
};

export const inferCookieDomainFromEnv = (sourceEnv: RuntimeOriginEnv): string | undefined => {
    const explicit = normalizeCookieDomainValue(sourceEnv.COOKIE_DOMAIN);
    if (explicit) {
        return explicit;
    }

    const hosts = collectFirstPartyHosts(sourceEnv).filter((host) => !isLocalHost(host));
    if (hosts.length < 2) {
        return undefined;
    }

    const rootDomains = hosts
        .map(getRootDomain)
        .filter((root): root is string => Boolean(root));

    if (rootDomains.length < 2) {
        return undefined;
    }

    const uniqueRoots = Array.from(new Set(rootDomains));
    if (uniqueRoots.length !== 1) {
        return undefined;
    }

    return uniqueRoots[0];
};

export const requiresSharedCookieDomain = (sourceEnv: RuntimeOriginEnv): boolean => {
    const appHosts = [
        parseUrlHost(sourceEnv.FRONTEND_URL),
        parseUrlHost(sourceEnv.ADMIN_FRONTEND_URL),
        parseUrlHost(sourceEnv.ADMIN_URL),
    ].filter((host): host is string => typeof host === 'string' && !isLocalHost(host));

    return appHosts.length >= 2;
};

export const getAllowedOriginList = (sourceEnv: RuntimeOriginEnv): string[] => {
    const configuredAllowedOrigins = (sourceEnv.CORS_ORIGIN || '')
        .split(',')
        .map(normalizeOrigin)
        .filter(Boolean);

    const inferredCookieDomain = inferCookieDomainFromEnv(sourceEnv);
    const inferredOrigins = inferredCookieDomain
        ? [`https://${inferredCookieDomain}`, `https://admin.${inferredCookieDomain}`]
        : [];

    const configuredAppOrigins = [
        sourceEnv.FRONTEND_URL,
        sourceEnv.FRONTEND_INTERNAL_URL,
        sourceEnv.ADMIN_FRONTEND_URL,
        sourceEnv.ADMIN_URL,
    ]
        .map((origin) => origin?.trim())
        .filter((origin): origin is string => Boolean(origin))
        .map(normalizeOrigin);

    const origins = Array.from(
        new Set([
            ...configuredAllowedOrigins,
            ...inferredOrigins.map(normalizeOrigin),
            ...configuredAppOrigins,
        ])
    );

    if (origins.length > 0) {
        return origins;
    }

    return sourceEnv.NODE_ENV === 'production'
        ? []
        : DEFAULT_LOCAL_ALLOWED_ORIGINS;
};
