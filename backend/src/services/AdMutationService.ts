import mongoose from 'mongoose';
import Ad from '../models/Ad';
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

export const updateAd = async (
    adId: string,
    data: unknown,
    context: AdContext,
    externalSession?: mongoose.ClientSession
): Promise<Record<string, unknown> | null> => {
    return updateAdLogic(adId, data, context, externalSession);
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
    return promoteAdLogic(id, days, type, userId, isAdmin);
};

export const repostAd = async (
    id: string,
    userId: string
): Promise<Record<string, unknown> | null> => {
    return repostAdLogic(id, userId);
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
    const objectId = new (await import('mongoose')).default.Types.ObjectId(id);
    if (fetchFull) {
        return Ad.findOne({ _id: objectId, listingType, sellerId: userId });
    }
    return Ad.findOne({ _id: objectId, listingType, sellerId: userId, isDeleted: { $ne: true } }).select('status');
};

export const findServiceForUpdate = async (
    id: string,
    userId: string | { toString(): string },
    businessId: string | { toString(): string } | null | undefined,
    listingType: string
) =>
    Ad.findOne({
        _id: id,
        listingType,
        businessId: businessId || { $exists: false },
        sellerId: userId,
    })
    .select('images status approvedAt categoryId brandId')
    .lean();

export const updateServiceByOwner = async (
    id: string,
    userId: string | { toString(): string },
    businessId: string | { toString(): string } | null | undefined,
    listingType: string,
    updates: Record<string, unknown>
) =>
    Ad.findOneAndUpdate(
        { _id: id, listingType, businessId: businessId || { $exists: false }, sellerId: userId },
        updates,
        { new: true }
    );
