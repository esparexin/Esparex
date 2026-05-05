import logger from './logger';
import { env } from '../config/env';

const PRODUCTION_FRONTEND_URL = 'https://esparex.in';
const PRODUCTION_ADMIN_URL = 'https://admin.esparex.in';
const LOCAL_FRONTEND_URL = 'http://localhost:3000';
const LOCAL_ADMIN_URL = 'http://localhost:3001';

const warnedFallbackKeys = new Set<string>();

const isProduction = (): boolean => env.NODE_ENV === 'production';

const normalizeBaseUrl = (value: string): string => value.trim().replace(/\/+$/, '');

const resolveAppUrl = (key: string, rawValue: string | undefined, fallback: string): string => {
    const configuredValue = rawValue?.trim();
    if (configuredValue) {
        return normalizeBaseUrl(configuredValue);
    }

    if (!warnedFallbackKeys.has(key)) {
        warnedFallbackKeys.add(key);
        logger.warn('[AppUrl] Missing app URL env, using fallback', {
            envKey: key,
            fallback,
            nodeEnv: env.NODE_ENV,
        });
    }

    return fallback;
};

export const getFrontendAppUrl = (): string =>
    resolveAppUrl(
        'FRONTEND_URL',
        env.FRONTEND_URL,
        isProduction() ? PRODUCTION_FRONTEND_URL : LOCAL_FRONTEND_URL
    );

export const getFrontendInternalUrl = (): string =>
    resolveAppUrl(
        'FRONTEND_INTERNAL_URL',
        env.FRONTEND_INTERNAL_URL || env.FRONTEND_URL,
        isProduction() ? PRODUCTION_FRONTEND_URL : LOCAL_FRONTEND_URL
    );

export const getAdminAppUrl = (): string =>
    resolveAppUrl(
        'ADMIN_URL',
        env.ADMIN_URL || env.ADMIN_FRONTEND_URL,
        isProduction() ? PRODUCTION_ADMIN_URL : LOCAL_ADMIN_URL
    );
