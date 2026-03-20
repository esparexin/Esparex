import crypto from 'crypto';
import { Request, Response } from 'express';
import mongoose from 'mongoose';

import ApiKey from '../../models/ApiKey';
import { getPaginationParams, sendPaginatedResponse, sendSuccessResponse } from './adminBaseController';
import { sendErrorResponse } from '../../utils/errorResponse';
import { logAdminAction } from '../../utils/adminLogger';
import { getSingleParam } from '../../utils/requestParams';
import { API_KEY_STATUS } from '../../../../shared/enums/apiKeyStatus';

const sendApiKeyError = (req: Request, res: Response, error: unknown) => {
    const message = error instanceof Error ? error.message : 'API key operation failed';
    sendErrorResponse(req, res, 500, message);
};

const hashApiKey = (rawKey: string) => crypto.createHash('sha256').update(rawKey).digest('hex');

export const getApiKeys = async (req: Request, res: Response) => {
    try {
        const { page, limit, skip } = getPaginationParams(req);
        const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
        const query: Record<string, unknown> = {};
        if (status && status !== 'all') query.status = status;

        const [items, total] = await Promise.all([
            ApiKey.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('createdBy', 'firstName lastName email'),
            ApiKey.countDocuments(query)
        ]);

        sendPaginatedResponse(res, items, total, page, limit);
    } catch (error: unknown) {
        sendApiKeyError(req, res, error);
    }
};

export const createApiKey = async (req: Request, res: Response) => {
    try {
        const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
        const scopes = Array.isArray(req.body?.scopes)
            ? req.body.scopes.filter((scope: unknown) => typeof scope === 'string')
            : [];
        const expiresAt = req.body?.expiresAt ? new Date(req.body.expiresAt) : undefined;

        if (!name) {
            return sendErrorResponse(req, res, 400, 'API key name is required');
        }

        const rawKey = `esk_live_${crypto.randomBytes(24).toString('hex')}`;
        const keyHash = hashApiKey(rawKey);
        const keyPrefix = rawKey.slice(0, 12);

        const createdBy = req.user?._id;
        if (!createdBy || !mongoose.Types.ObjectId.isValid(String(createdBy))) {
            return sendErrorResponse(req, res, 401, 'Unauthorized');
        }

        const apiKey = await ApiKey.create({
            name,
            keyHash,
            keyPrefix,
            scopes,
            status: API_KEY_STATUS.ACTIVE,
            createdBy: new mongoose.Types.ObjectId(String(createdBy)),
            expiresAt
        });

        await logAdminAction(req, 'CREATE_API_KEY', 'ApiKey', apiKey._id.toString(), {
            name,
            scopes,
            expiresAt
        });

        sendSuccessResponse(res, {
            ...apiKey.toJSON(),
            key: rawKey
        }, 'API key created successfully');
    } catch (error: unknown) {
        sendApiKeyError(req, res, error);
    }
};

export const revokeApiKey = async (req: Request, res: Response) => {
    try {
        const id = getSingleParam(req, res, 'id', { error: 'Invalid API key ID' });
        if (!id) return;

        const apiKey = await ApiKey.findByIdAndUpdate(
            id,
            { status: API_KEY_STATUS.REVOKED, revokedAt: new Date() },
            { new: true }
        );

        if (!apiKey) {
            return sendErrorResponse(req, res, 404, 'API key not found');
        }

        await logAdminAction(req, 'REVOKE_API_KEY', 'ApiKey', id, { keyPrefix: apiKey.keyPrefix });
        sendSuccessResponse(res, apiKey, 'API key revoked successfully');
    } catch (error: unknown) {
        sendApiKeyError(req, res, error);
    }
};

