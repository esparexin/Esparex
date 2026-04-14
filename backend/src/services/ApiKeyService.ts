import crypto from 'crypto';
import mongoose from 'mongoose';
import ApiKey from '../models/ApiKey';
import { API_KEY_STATUS } from '../../../shared/enums/apiKeyStatus';

const hashApiKey = (rawKey: string) => crypto.createHash('sha256').update(rawKey).digest('hex');

export const getApiKeys = async (
    query: Record<string, unknown>,
    skip: number,
    limit: number
) => {
    const [items, total] = await Promise.all([
        ApiKey.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('createdBy', 'firstName lastName email'),
        ApiKey.countDocuments(query),
    ]);
    return { items, total };
};

export const createApiKey = async (params: {
    name: string;
    scopes: string[];
    expiresAt?: Date;
    createdBy: mongoose.Types.ObjectId;
}) => {
    const rawKey = `esk_live_${crypto.randomBytes(24).toString('hex')}`;
    const keyHash = hashApiKey(rawKey);
    const keyPrefix = rawKey.slice(0, 12);

    const apiKey = await ApiKey.create({
        name: params.name,
        keyHash,
        keyPrefix,
        scopes: params.scopes,
        status: API_KEY_STATUS.ACTIVE,
        createdBy: params.createdBy,
        expiresAt: params.expiresAt,
    });

    return { apiKey, rawKey };
};

export const revokeApiKey = async (id: string) => {
    return ApiKey.findByIdAndUpdate(
        id,
        { status: API_KEY_STATUS.REVOKED, revokedAt: new Date() },
        { new: true }
    );
};
