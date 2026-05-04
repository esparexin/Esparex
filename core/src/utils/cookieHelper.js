"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveCookieDomain = exports.getCsrfCookieOptions = exports.getAdminCookieOptions = exports.getLegacyHostOnlyAuthCookieOptions = exports.getAuthCookieOptions = void 0;
const env_1 = require("@core/config/env");
const originConfig_1 = require("./originConfig");
const resolveCookieDomain = () => {
    return ((0, originConfig_1.inferCookieDomainFromEnv)({
        NODE_ENV: env_1.env.NODE_ENV,
        CORS_ORIGIN: env_1.env.CORS_ORIGIN,
        COOKIE_DOMAIN: env_1.env.COOKIE_DOMAIN,
        FRONTEND_URL: env_1.env.FRONTEND_URL,
        FRONTEND_INTERNAL_URL: env_1.env.FRONTEND_INTERNAL_URL,
        ADMIN_FRONTEND_URL: env_1.env.ADMIN_FRONTEND_URL,
        ADMIN_URL: env_1.env.ADMIN_URL,
    }) ||
        (0, originConfig_1.normalizeCookieDomainValue)(env_1.env.COOKIE_DOMAIN));
};
exports.resolveCookieDomain = resolveCookieDomain;
const resolveCookieSameSite = () => {
    if (env_1.env.COOKIE_SAME_SITE) {
        return env_1.env.COOKIE_SAME_SITE;
    }
    return env_1.env.NODE_ENV === 'production' ? 'none' : 'lax';
};
const resolveCookieSecure = (sameSite) => {
    if (env_1.env.COOKIE_SECURE === true)
        return true;
    if (env_1.env.COOKIE_SECURE === false)
        return sameSite === 'none' ? true : false;
    if (sameSite === 'none')
        return true;
    return env_1.env.NODE_ENV === 'production';
};
const buildBaseCookieOptions = (maxAgeMs) => {
    const sameSite = resolveCookieSameSite();
    const secure = resolveCookieSecure(sameSite);
    return {
        httpOnly: true,
        secure,
        sameSite,
        path: '/',
        maxAge: maxAgeMs
    };
};
const getAuthCookieOptions = (maxAgeMs = 7 * 24 * 60 * 60 * 1000) => {
    const domain = resolveCookieDomain();
    return {
        ...buildBaseCookieOptions(maxAgeMs),
        ...(domain ? { domain } : {})
    };
};
exports.getAuthCookieOptions = getAuthCookieOptions;
const getLegacyHostOnlyAuthCookieOptions = (maxAgeMs = 7 * 24 * 60 * 60 * 1000) => buildBaseCookieOptions(maxAgeMs);
exports.getLegacyHostOnlyAuthCookieOptions = getLegacyHostOnlyAuthCookieOptions;
const getAdminCookieOptions = (maxAgeMs = 7 * 24 * 60 * 60 * 1000) => {
    const domain = resolveCookieDomain();
    return {
        ...buildBaseCookieOptions(maxAgeMs),
        ...(domain ? { domain } : {})
    };
};
exports.getAdminCookieOptions = getAdminCookieOptions;
const getCsrfCookieOptions = (maxAgeMs = 24 * 60 * 60 * 1000) => {
    const domain = resolveCookieDomain();
    return {
        ...buildBaseCookieOptions(maxAgeMs),
        ...(domain ? { domain } : {})
    };
};
exports.getCsrfCookieOptions = getCsrfCookieOptions;
//# sourceMappingURL=cookieHelper.js.map