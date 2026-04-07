import { Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';
import mongoose from 'mongoose';
import IdempotencyRequest from '../models/IdempotencyRequest';
import logger from '../utils/logger';
import { sendErrorResponse } from '../utils/errorResponse';

const MAX_KEY_LENGTH = 128;
const IDEMPOTENCY_SCOPE_CREATE_AD = 'POST:/api/v1/ads';
const IDEMPOTENCY_SCOPE_CREATE_SERVICE = 'POST:/api/v1/services';
const IDEMPOTENCY_TTL_HOURS = 24;
const PROCESSING_LOCK_MS = 90_000;
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const stableStringify = (value: unknown): string => {
    if (value === null || typeof value !== 'object') {
        return JSON.stringify(value);
    }

    if (Array.isArray(value)) {
        return `[${value.map((item) => stableStringify(item)).join(',')}]`;
    }

    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    return `{${keys
        .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
        .join(',')}}`;
};

const payloadHash = (body: unknown): string =>
    createHash('sha256').update(stableStringify(body || {})).digest('hex');

type IdempotencyErrorOptions = {
    idempotencyKey?: string;
    conflictType?: 'IDEMPOTENCY' | 'DUPLICATE_AD';
};

const idempotencyError = (
    req: Request,
    res: Response,
    status: number,
    code: string,
    message: string,
    options: IdempotencyErrorOptions = {}
) => sendErrorResponse(req, res, status, message, {
    code,
    message,
    idempotencyKey: options.idempotencyKey,
    conflictType: options.conflictType
});

const buildCreateListingIdempotencyGuard = (scope: string) => async (req: Request, res: Response, next: NextFunction) => {
    try {
        const request = req as Request & { idempotencyRecordId?: string; idempotencyKey?: string };
        const rawKey = req.header('Idempotency-Key') || req.header('x-idempotency-key');
        if (!rawKey) return next();

        const key = rawKey.trim();
        if (!key || key.length > MAX_KEY_LENGTH || !UUID_V4_REGEX.test(key)) {
            return idempotencyError(
                req,
                res,
                400,
                'INVALID_IDEMPOTENCY_KEY',
                'Idempotency key must be a valid UUID v4.',
                { idempotencyKey: key || undefined }
            );
        }
        request.idempotencyKey = key;

        const requesterId = (req.user as { _id?: mongoose.Types.ObjectId } | undefined)?._id;
        if (!requesterId) {
            return idempotencyError(req, res, 401, 'UNAUTHORIZED', 'Unauthorized', {
                idempotencyKey: key
            });
        }

        const userId = requesterId.toString();
        const bodyHash = payloadHash(req.body);
        const requestFingerprint = {
            method: req.method.toUpperCase(),
            route: scope,
            userId,
            bodyHash,
        };
        const requestHash = payloadHash(requestFingerprint);
        const now = new Date();

        logger.info('Idempotency guard invoked', {
            requestId: req.requestId,
            userId,
            idempotencyKey: key,
            requestFingerprint,
        });

        const existing = await IdempotencyRequest.findOne({
            userId,
            scope,
            key,
        }).lean();

        if (existing) {
            if (existing.requestHash !== requestHash) {
                logger.warn('Idempotency conflict detected', {
                    requestId: req.requestId,
                    userId,
                    idempotencyKey: key,
                    conflictCode: 'IDEMPOTENCY_KEY_REUSED',
                    route: scope,
                });
                return idempotencyError(
                    req,
                    res,
                    409,
                    'IDEMPOTENCY_KEY_REUSED',
                    'This idempotency key was already used with a different payload.',
                    {
                        idempotencyKey: key,
                        conflictType: 'IDEMPOTENCY',
                    }
                );
            }

            if (existing.status === 'completed' && existing.responseBody) {
                return res.status(existing.responseStatus || 200).json(existing.responseBody);
            }

            if (existing.status === 'processing') {
                logger.warn('Idempotency request already in progress', {
                    requestId: req.requestId,
                    userId,
                    idempotencyKey: key,
                    conflictCode: 'IDEMPOTENCY_IN_PROGRESS',
                    route: scope,
                });
                return idempotencyError(
                    req,
                    res,
                    429,
                    'IDEMPOTENCY_IN_PROGRESS',
                    'A request with this idempotency key is already being processed. Please retry with exponential backoff.',
                    {
                        idempotencyKey: key,
                        conflictType: 'IDEMPOTENCY',
                    }
                );
            }
        }

        const expiresAt = new Date(now.getTime() + IDEMPOTENCY_TTL_HOURS * 60 * 60 * 1000);

        try {
            const upserted = await IdempotencyRequest.findOneAndUpdate(
                { userId, scope, key },
                {
                    $set: {
                        requestHash,
                        status: 'processing',
                        responseStatus: undefined,
                        responseBody: undefined,
                        expiresAt,
                    },
                    $setOnInsert: {
                        userId,
                        scope,
                        key,
                    },
                },
                { upsert: true, new: true }
            ).lean();

            if (upserted?._id) {
                request.idempotencyRecordId = upserted._id.toString();
            }
        } catch (error) {
            logger.warn('Failed to upsert idempotency request', {
                requestId: req.requestId,
                userId,
                idempotencyKey: key,
                route: scope,
                error: error instanceof Error ? error.message : String(error),
            });
        }

        const originalJson = res.json.bind(res);
        let persisted = false;

        const persistResponse = (statusCode: number, body: unknown) => {
            if (persisted || !request.idempotencyRecordId) return;
            persisted = true;

            void IdempotencyRequest.updateOne(
                { _id: request.idempotencyRecordId },
                {
                    $set: {
                        status: 'completed',
                        responseStatus: statusCode,
                        responseBody: body,
                    },
                }
            ).catch((error: unknown) => {
                logger.warn('Failed to persist idempotency response', {
                    requestId: req.requestId,
                    idempotencyRecordId: request.idempotencyRecordId,
                    route: scope,
                    error: error instanceof Error ? error.message : String(error),
                });
            });
        };

        res.json = ((body: unknown) => {
            persistResponse(res.statusCode, body);
            return originalJson(body);
        }) as typeof res.json;

        return next();
    } catch (error) {
        // Fail-open: idempotency storage must not block creation path.
        logger.warn('Idempotency middleware failed-open', {
            requestId: req.requestId,
            idempotencyKey: (req as Request & { idempotencyKey?: string }).idempotencyKey,
            route: scope,
            error: error instanceof Error ? error.message : String(error)
        });
        return next();
    }
};

export const enforceCreateListingIdempotency = (scope: string) => buildCreateListingIdempotencyGuard(scope);
export const enforceCreateAdIdempotency = buildCreateListingIdempotencyGuard(IDEMPOTENCY_SCOPE_CREATE_AD);
export const enforceCreateServiceIdempotency = buildCreateListingIdempotencyGuard(IDEMPOTENCY_SCOPE_CREATE_SERVICE);

export default enforceCreateAdIdempotency;

/**
 * SSOT Generic Idempotency Middleware
 * Enforces exactly-once execution for mutation routes (POST, PUT, PATCH).
 * The client must present an `x-request-id` UUID header.
 * Stores UUID in Redis for 60 seconds. Returns 409 if duplicate.
 */
import redisClient from '../config/redis';

export const idempotencyMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
        return next();
    }

    const requestId = req.headers['x-request-id'];

    if (!requestId || typeof requestId !== 'string') {
        return next();
    }

    const key = `idemp:${requestId}`;

    try {
        const result = await redisClient.set(key, '1', 'EX', 60, 'NX');

        if (!result) {
            logger.warn(`Idempotency collision detected for Request ID: ${requestId}`);
            sendErrorResponse(req, res, 409, 'Duplicate request detected. Action is already processing.', {
                code: 'IDEMPOTENCY_KEY_REUSED',
                message: 'Duplicate request detected. Action is already processing.',
                conflictType: 'IDEMPOTENCY',
                idempotencyKey: requestId,
            });
            return;
        }

        next();
    } catch (error) {
        logger.error('Redis idempotency error:', error);
        next();
    }
};
