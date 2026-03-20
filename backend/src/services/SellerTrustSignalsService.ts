import mongoose from 'mongoose';
import Ad from '../models/Ad';
import { AD_STATUS } from '../../../shared/enums/adStatus';
import logger from '../utils/logger';

type ReputationSummary = {
    score: number;
    adsPosted: number;
};

const EMPTY_SIGNALS: ReputationSummary = {
    score: 0,
    adsPosted: 0
};

const toObjectId = (value: unknown): mongoose.Types.ObjectId | null => {
    if (value instanceof mongoose.Types.ObjectId) return value;
    if (typeof value === 'string' && mongoose.Types.ObjectId.isValid(value)) {
        return new mongoose.Types.ObjectId(value);
    }
    return null;
};

const logDeprecatedSignal = (signal: string, userIdInput: string | mongoose.Types.ObjectId): void => {
    logger.debug('Deprecated seller reputation signal ignored', {
        signal,
        userId: String(userIdInput ?? '')
    });
};

export const recordSellerAdPosted = async (
    userIdInput: string | mongoose.Types.ObjectId
): Promise<void> => {
    logDeprecatedSignal('recordSellerAdPosted', userIdInput);
};


export const recordSellerAdSold = async (
    userIdInput: string | mongoose.Types.ObjectId
): Promise<void> => {
    logDeprecatedSignal('recordSellerAdSold', userIdInput);
};

export const getSellerReputation = async (
    userIdInput: string | mongoose.Types.ObjectId
): Promise<ReputationSummary> => {
    const userId = toObjectId(userIdInput);
    if (!userId) return EMPTY_SIGNALS;

    try {
        const adsPosted = await Ad.countDocuments({
            sellerId: userId,
            status: AD_STATUS.LIVE,
            isDeleted: { $ne: true }
        });

        return {
            ...EMPTY_SIGNALS,
            adsPosted
        };
    } catch (error) {
        logger.warn('Failed to load seller trust signals', {
            userId: userId.toHexString(),
            error: error instanceof Error ? error.message : String(error)
        });
        return EMPTY_SIGNALS;
    }
};

export const getSellerScoresMap = async (
    _userIds: Array<string | mongoose.Types.ObjectId>
): Promise<Map<string, number>> => {
    return new Map<string, number>();
};

export const isHighReputationScore = (_score: number): boolean => false;
