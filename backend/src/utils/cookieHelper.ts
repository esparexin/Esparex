import { CookieOptions } from 'express';
import { env } from '../config/env';

export const getAuthCookieOptions = (maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): CookieOptions => {
    const isProduction = env.NODE_ENV === 'production';

    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        path: '/',
        maxAge: maxAgeMs
    };
};

export const getAdminCookieOptions = (
    maxAgeMs: number = 7 * 24 * 60 * 60 * 1000
): CookieOptions => {
    const isProduction = env.NODE_ENV === 'production';

    return {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        path: '/',
        maxAge: maxAgeMs
    };
};
