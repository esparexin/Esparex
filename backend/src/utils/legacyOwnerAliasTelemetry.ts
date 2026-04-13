import { Request } from 'express';
import logger from './logger';

type AliasSource = 'body' | 'query';

const hasOwn = (value: unknown, key: string): boolean =>
    Boolean(value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, key));

/**
 * Telemetry-only logger for deprecated ownership aliases.
 * This must never mutate request state or alter response behavior.
 */
export const warnIfLegacyAdUserIdAliasUsed = (
    req: Request,
    source: AliasSource
): void => {
    const container = source === 'body' ? req.body : req.query;
    if (!hasOwn(container, 'userId')) return;

    const hasSellerId = hasOwn(container, 'sellerId');
    const rawAliasValue = (container as Record<string, unknown>).userId;

    logger.warn('Deprecated ad ownership alias detected', {
        alias: 'userId',
        canonical: 'sellerId',
        source,
        method: req.method,
        route: req.originalUrl || req.url,
        requestId: req.requestId,
        hasSellerId,
        userIdAliasType: Array.isArray(rawAliasValue) ? 'array' : typeof rawAliasValue,
    });
};

