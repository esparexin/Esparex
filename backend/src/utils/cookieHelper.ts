import { CookieOptions } from 'express';

/**
 * Standardized Cookie Options for Esparex Authentication
 * 
 * Rules:
 * - HttpOnly: Always true (No JS access)
 * - Secure: True in production, False in dev (allows localhost http)
 * - SameSite: 'lax' (Balances security with usability for redirects/localhost)
 * - Path: '/' (Available across entire app)
 */
export const getAuthCookieOptions = (maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): CookieOptions => {
    const isProduction = process.env.NODE_ENV === 'production';

    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        path: '/',
        maxAge: maxAgeMs
    };
};

/**
 * Admin auth cookie is intentionally scoped to admin API surface
 * so it isn't attached to regular user-site requests.
 */
export const getAdminCookieOptions = (
    maxAgeMs: number = 7 * 24 * 60 * 60 * 1000
): CookieOptions => {
    const isProduction = process.env.NODE_ENV === 'production';

    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        path: '/',
        maxAge: maxAgeMs
    };
};
