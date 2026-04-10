import { CookieOptions } from 'express';
import { env } from '../config/env';
import { inferCookieDomainFromEnv, normalizeCookieDomainValue } from './originConfig';

const resolveCookieDomain = (): string | undefined => {
    return (
        inferCookieDomainFromEnv({
            NODE_ENV: process.env.NODE_ENV,
            CORS_ORIGIN: process.env.CORS_ORIGIN,
            COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || env.COOKIE_DOMAIN,
            FRONTEND_URL: process.env.FRONTEND_URL,
            FRONTEND_INTERNAL_URL: process.env.FRONTEND_INTERNAL_URL,
            ADMIN_FRONTEND_URL: process.env.ADMIN_FRONTEND_URL,
            ADMIN_URL: process.env.ADMIN_URL,
        }) ||
        normalizeCookieDomainValue(process.env.COOKIE_DOMAIN || env.COOKIE_DOMAIN)
    );
};

type SameSiteValue = Exclude<CookieOptions['sameSite'], boolean | undefined>;

const resolveCookieSameSite = (): SameSiteValue => {
    const raw = process.env.COOKIE_SAME_SITE?.trim().toLowerCase();
    if (raw === 'strict' || raw === 'lax' || raw === 'none') {
        return raw;
    }

    return env.NODE_ENV === 'production' ? 'none' : 'lax';
};

const resolveCookieSecure = (sameSite: SameSiteValue): boolean => {
    const raw = process.env.COOKIE_SECURE?.trim().toLowerCase();
    if (raw === 'true') return true;
    if (raw === 'false') return sameSite === 'none' ? true : false;

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
