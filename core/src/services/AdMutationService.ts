import mongoose from 'mongoose';
import Ad from '../models/Ad';
import { ListingTypeValue } from '../constants/enums/listingType';
import { getUserConnection } from '../config/db';
import { AdContext } from '../types/ad.types';
import { mutateStatus } from './StatusMutationService';

// Leaf Services
import { updateAdLogic } from './ad/AdUpdateService';
import { promoteAdLogic } from './ad/AdPromotionService';
import { repostAdLogic } from './ad/AdRepostService';
import { assertOwnership } from './ad/AdPolicyService';

// Re-export for backward compatibility
export { assertOwnership };

import { invalidateAdFeedCaches, invalidatePublicAdCache } from '../utils/redisCache';

export const updateAd = async (
    adId: string,
    data: unknown,
    context: AdContext,
    externalSession?: mongoose.ClientSession
): Promise<Record<string, unknown> | null> => {
    const result = await updateAdLogic(adId, data, context, externalSession);
    if (result) {
        // 🛡️ STAFF+ CONSISTENCY GUARD
        // Bust both search and detail caches to prevent stale data visibility.
        void invalidateAdFeedCaches().catch(() => {});
        void invalidatePublicAdCache(adId).catch(() => {});
    }
    return result;
};

export const updateAdTransactional = async (options: {
    adId: string,
    patch: unknown,
    context: AdContext,
    optionalStatusTransition?: { toStatus: string, reason?: string }
}): Promise<Record<string, unknown> | null> => {
    const { adId, patch, context, optionalStatusTransition } = options;
    const connection = getUserConnection();
    const session = await connection.startSession();
    
    try {
        let result: Record<string, unknown> | null = null;
        await session.withTransaction(async () => {
            if (Object.keys(patch as object).length > 0) {
                result = await updateAdLogic(adId, patch, context, session);
            }
            if (optionalStatusTransition) {
                result = await mutateStatus({
                    domain: 'ad',
                    entityId: adId,
                    toStatus: optionalStatusTransition.toStatus,
                    actor: { type: context.actor === 'ADMIN' ? 'admin' : 'user', id: context.authUserId, ip: '', userAgent: '' },
                    reason: optionalStatusTransition.reason,
                    session
                });
            }
        });

        return result;
    } finally {
        await session.endSession();
    }
};

export const promoteAd = async (
    id: string,
    days: number = 7,
    type: 'spotlight_hp' | 'spotlight_cat' = 'spotlight_hp',
    userId: string,
    isAdmin: boolean = false
) => {
    const result = await promoteAdLogic(id, days, type, userId, isAdmin);
    if (result) {
        void invalidateAdFeedCaches().catch(() => {});
        void invalidatePublicAdCache(id).catch(() => {});
    }
    return result;
};

export const repostAd = async (
    id: string,
    userId: string
): Promise<Record<string, unknown> | null> => {
    const result = await repostAdLogic(id, userId);
    if (result) {
        void invalidateAdFeedCaches().catch(() => {});
        void invalidatePublicAdCache(id).catch(() => {});
    }
    return result;
};

export const extendListingExpiry = async (
    id: string,
    expiresAt: Date,
    currentStatus: string,
    now: Date
) => {
    return Ad.findByIdAndUpdate(
        id,
        {
            expiresAt,
            expiryWarningSentAt: null,
            expiryWarningCount: 0,
            lastExpiryWarningChannel: null,
            $push: {
                timeline: {
                    status: currentStatus,
                    timestamp: now,
                    reason: 'Expiry extended by admin',
                },
            },
        },
        { new: true }
    );
};

export const findOwnedService = async (
    id: string,
    userId: string | { toString(): string },
    listingType: string,
    fetchFull: boolean
) => {
    const objectId = new mongoose.Types.ObjectId(id);
    const sellerObjectId = new mongoose.Types.ObjectId(typeof userId === 'string' ? userId : userId.toString());
    if (fetchFull) {
        return Ad.findOne({ _id: objectId, listingType: listingType as ListingTypeValue, sellerId: sellerObjectId });
    }
    return Ad.findOne({ _id: objectId, listingType: listingType as ListingTypeValue, sellerId: sellerObjectId, isDeleted: { $ne: true } }).select('status');
};
