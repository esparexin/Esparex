import { CookieOptions } from 'express';
import { env } from '../config/env';
import { inferCookieDomainFromEnv, normalizeCookieDomainValue } from './originConfig';

const resolveCookieDomain = (): string | undefined => {
    return (
        inferCookieDomainFromEnv({
            NODE_ENV: env.NODE_ENV,
            CORS_ORIGIN: env.CORS_ORIGIN,
            COOKIE_DOMAIN: env.COOKIE_DOMAIN,
            FRONTEND_URL: env.FRONTEND_URL,
            FRONTEND_INTERNAL_URL: env.FRONTEND_INTERNAL_URL,
            ADMIN_FRONTEND_URL: env.ADMIN_FRONTEND_URL,
            ADMIN_URL: env.ADMIN_URL,
        }) ||
        normalizeCookieDomainValue(env.COOKIE_DOMAIN)
    );
};

type SameSiteValue = Exclude<CookieOptions['sameSite'], boolean | undefined>;

const resolveCookieSameSite = (): SameSiteValue => {
    if (env.COOKIE_SAME_SITE) {
        return env.COOKIE_SAME_SITE;
    }
    return env.NODE_ENV === 'production' ? 'none' : 'lax';
};

const resolveCookieSecure = (sameSite: SameSiteValue): boolean => {
    if (env.COOKIE_SECURE === true) return true;
    if (env.COOKIE_SECURE === false) return sameSite === 'none' ? true : false;
    if (sameSite === 'none') return true;
    return env.NODE_ENV === 'production';
};

const buildBaseCookieOptions = (maxAgeMs: number): CookieOptions => {
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

export const getAuthCookieOptions = (maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): CookieOptions => {
    const domain = resolveCookieDomain();

    return {
        ...buildBaseCookieOptions(maxAgeMs),
        ...(domain ? { domain } : {})
    };
};

export const getLegacyHostOnlyAuthCookieOptions = (
    maxAgeMs: number = 7 * 24 * 60 * 60 * 1000
): CookieOptions => buildBaseCookieOptions(maxAgeMs);

export const getAdminCookieOptions = (
    maxAgeMs: number = 7 * 24 * 60 * 60 * 1000
): CookieOptions => {
    const domain = resolveCookieDomain();

    return {
        ...buildBaseCookieOptions(maxAgeMs),
        ...(domain ? { domain } : {})
    };
};

export const getCsrfCookieOptions = (
    maxAgeMs: number = 24 * 60 * 60 * 1000
): CookieOptions => {
    const domain = resolveCookieDomain();

    return {
        ...buildBaseCookieOptions(maxAgeMs),
        ...(domain ? { domain } : {})
    };
};

export { resolveCookieDomain };
