import { CookieOptions } from 'express';
import { env } from '../config/env';

const resolveCookieDomain = (): string | undefined => {
    const configured = env.COOKIE_DOMAIN?.trim();
    if (!configured) return undefined;

    return configured.replace(/^\./, '') || undefined;
};

const buildBaseCookieOptions = (maxAgeMs: number): CookieOptions => {
    const isProduction = env.NODE_ENV === 'production';

    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
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

export { resolveCookieDomain };
