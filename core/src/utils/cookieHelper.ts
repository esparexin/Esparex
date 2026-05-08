import { env } from '../config/env';
import { inferCookieDomainFromEnv, normalizeCookieDomainValue } from './originConfig';

/**
 * Portable CookieOptions interface to avoid direct Express dependency in core
 */
export interface CookieOptions {
    maxAge?: number;
    signed?: boolean;
    expires?: Date;
    httpOnly?: boolean;
    path?: string;
    domain?: string;
    secure?: boolean;
    encode?: (val: string) => string;
    sameSite?: boolean | 'lax' | 'strict' | 'none';
}

const resolveCookieDomain = (): string | undefined => {
    if (env.NODE_ENV === 'production') {
        return '.esparex.in';
    }
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
    if (env.NODE_ENV === 'production') {
        return 'none';
    }
    if (env.COOKIE_SAME_SITE) {
        return env.COOKIE_SAME_SITE;
    }
    return 'lax';
};

const resolveCookieSecure = (sameSite: SameSiteValue): boolean => {
    if (env.NODE_ENV === 'production') {
        return true;
    }
    if (env.COOKIE_SECURE === true) return true;
    if (env.COOKIE_SECURE === false) return sameSite === 'none' ? true : false;
    if (sameSite === 'none') return true;
    return false;
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
): CookieOptions => {
    const domain = resolveCookieDomain();

    return {
        ...buildBaseCookieOptions(maxAgeMs),
        ...(domain ? { domain } : {})
    };
};

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

