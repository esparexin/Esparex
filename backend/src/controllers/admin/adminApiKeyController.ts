import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { getPaginationParams, sendPaginatedResponse, sendSuccessResponse, sendAdminError } from './adminBaseController';
import { logAdminAction } from '../../utils/adminLogger';
import { getSingleParam } from '../../utils/requestParams';
import {
    getApiKeys as getApiKeysService,
    createApiKey as createApiKeyService,
    revokeApiKey as revokeApiKeyService,
} from '../../services/ApiKeyService';


export const getApiKeys = async (req: Request, res: Response) => {
    try {
        const { page, limit, skip } = getPaginationParams(req);
        const status = typeof req.query.status === 'string' ? req.query.status.trim() : '';
        const query: Record<string, unknown> = {};
        if (status && status !== 'all') query.status = status;

        const { items, total } = await getApiKeysService(query, skip, limit);
        sendPaginatedResponse(res, items, total, page, limit);
    } catch (error: unknown) {
        sendAdminError(req, res, error);
    }
};

export const createApiKey = async (req: Request, res: Response) => {
    try {
        const keyBody = req.body as { name?: unknown; scopes?: unknown; expiresAt?: unknown };
        const name = typeof keyBody.name === 'string' ? keyBody.name.trim() : '';
        const scopes = Array.isArray(keyBody.scopes)
            ? (keyBody.scopes as unknown[]).filter((scope) => typeof scope === 'string')
            : [];
        const expiresAt = keyBody.expiresAt ? new Date(keyBody.expiresAt as string | number) : undefined;

        if (!name) {
            return sendAdminError(req, res, 'API key name is required', 400);
        }

        const createdBy = req.user?._id;
        if (!createdBy || !mongoose.Types.ObjectId.isValid(String(createdBy))) {
            return sendAdminError(req, res, 'Unauthorized', 401);
        }

        const { apiKey, rawKey } = await createApiKeyService({
            name,
            scopes,
            expiresAt,
            createdBy: new mongoose.Types.ObjectId(String(createdBy)),
        }) as { apiKey: { _id: { toString(): string }; toJSON(): Record<string, unknown> }; rawKey: string };

        await logAdminAction(req, 'CREATE_API_KEY', 'ApiKey', apiKey._id.toString(), {
            name,
            scopes,
            expiresAt,
        });

        sendSuccessResponse(res, { ...apiKey.toJSON(), key: rawKey }, 'API key created successfully');
    } catch (error: unknown) {
        sendAdminError(req, res, error);
    }
};

export const revokeApiKey = async (req: Request, res: Response) => {
    try {
        const id = getSingleParam(req, res, 'id', { error: 'Invalid API key ID' });
        if (!id) return;

        const apiKey = await revokeApiKeyService(id);
        if (!apiKey) {
            return sendAdminError(req, res, 'API key not found', 404);
        }

        await logAdminAction(req, 'REVOKE_API_KEY', 'ApiKey', id, { keyPrefix: apiKey.keyPrefix });
        sendSuccessResponse(res, apiKey, 'API key revoked successfully');
    } catch (error: unknown) {
        sendAdminError(req, res, error);
    }
};

