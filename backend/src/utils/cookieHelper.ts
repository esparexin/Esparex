import { CookieOptions } from 'express';
import { env } from '../config/env';

const resolveCookieDomain = (): string | undefined => {
    const configured = env.COOKIE_DOMAIN?.trim();
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
