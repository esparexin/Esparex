"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllowedOriginList = exports.requiresSharedCookieDomain = exports.inferCookieDomainFromEnv = exports.normalizeCookieDomainValue = exports.normalizeOrigin = void 0;
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '[::1]']);
const LOCAL_IPV4_PATTERN = /^(10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/;
const DEFAULT_LOCAL_ALLOWED_ORIGINS = ['http://localhost:3000', 'http://localhost:3001'];
const normalizeOrigin = (value) => value.trim().replace(/\/+$/, '').toLowerCase();
exports.normalizeOrigin = normalizeOrigin;
const normalizeCookieDomainValue = (value) => {
    const configured = value?.trim();
    if (!configured)
        return undefined;
    const normalized = configured
        .replace(/^\./, '')
        .replace(/\.$/, '')
        .toLowerCase();
    if (!normalized)
        return undefined;
    if (normalized.includes('://') || normalized.includes('/'))
        return undefined;
    if (!/^[a-z0-9.-]+$/.test(normalized))
        return undefined;
    if (normalized.split('.').length < 2)
        return undefined;
    return normalized;
};
exports.normalizeCookieDomainValue = normalizeCookieDomainValue;
const parseOriginHosts = (rawValue) => (rawValue || '')
    .split(',')
    .map(exports.normalizeOrigin)
    .filter(Boolean)
    .flatMap((origin) => {
    try {
        return [new URL(origin).hostname.toLowerCase()];
    }
    catch {
        return [];
    }
});
const parseUrlHost = (rawValue) => {
    const trimmed = rawValue?.trim();
    if (!trimmed)
        return undefined;
    try {
        return new URL(trimmed).hostname.toLowerCase();
    }
    catch {
        return undefined;
    }
};
const isLocalHost = (hostname) => LOCAL_HOSTS.has(hostname) || LOCAL_IPV4_PATTERN.test(hostname);
const getRootDomain = (hostname) => {
    if (isLocalHost(hostname)) {
        return undefined;
    }
    const segments = hostname.toLowerCase().split('.').filter(Boolean);
    if (segments.length < 2) {
        return undefined;
    }
    return segments.slice(-2).join('.');
};
const collectFirstPartyHosts = (sourceEnv) => {
    const candidates = [
        parseUrlHost(sourceEnv.FRONTEND_URL),
        parseUrlHost(sourceEnv.FRONTEND_INTERNAL_URL),
        parseUrlHost(sourceEnv.ADMIN_FRONTEND_URL),
        parseUrlHost(sourceEnv.ADMIN_URL),
        ...parseOriginHosts(sourceEnv.CORS_ORIGIN),
    ].filter((host) => Boolean(host));
    return Array.from(new Set(candidates));
};
const inferCookieDomainFromEnv = (sourceEnv) => {
    const explicit = (0, exports.normalizeCookieDomainValue)(sourceEnv.COOKIE_DOMAIN);
    if (explicit) {
        return explicit;
    }
    const hosts = collectFirstPartyHosts(sourceEnv).filter((host) => !isLocalHost(host));
    if (hosts.length < 2) {
        return undefined;
    }
    const rootDomains = hosts
        .map(getRootDomain)
        .filter((root) => Boolean(root));
    if (rootDomains.length < 2) {
        return undefined;
    }
    const uniqueRoots = Array.from(new Set(rootDomains));
    if (uniqueRoots.length !== 1) {
        return undefined;
    }
    return uniqueRoots[0];
};
exports.inferCookieDomainFromEnv = inferCookieDomainFromEnv;
const requiresSharedCookieDomain = (sourceEnv) => {
    const appHosts = [
        parseUrlHost(sourceEnv.FRONTEND_URL),
        parseUrlHost(sourceEnv.ADMIN_FRONTEND_URL),
        parseUrlHost(sourceEnv.ADMIN_URL),
    ].filter((host) => typeof host === 'string' && !isLocalHost(host));
    return appHosts.length >= 2;
};
exports.requiresSharedCookieDomain = requiresSharedCookieDomain;
const getAllowedOriginList = (sourceEnv) => {
    const configuredAllowedOrigins = (sourceEnv.CORS_ORIGIN || '')
        .split(',')
        .map(exports.normalizeOrigin)
        .filter(Boolean);
    const inferredCookieDomain = (0, exports.inferCookieDomainFromEnv)(sourceEnv);
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
        .filter((origin) => Boolean(origin))
        .map(exports.normalizeOrigin);
    const origins = Array.from(new Set([
        ...configuredAllowedOrigins,
        ...inferredOrigins.map(exports.normalizeOrigin),
        ...configuredAppOrigins,
    ]));
    if (origins.length > 0) {
        return origins;
    }
    return sourceEnv.NODE_ENV === 'production'
        ? []
        : DEFAULT_LOCAL_ALLOWED_ORIGINS;
};
exports.getAllowedOriginList = getAllowedOriginList;
//# sourceMappingURL=originConfig.js.map