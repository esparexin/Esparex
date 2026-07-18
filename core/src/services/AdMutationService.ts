import { getListingRepository, getListingsCache, getListingUnitOfWork } from '../composition/listings';
import { ListingTypeValue } from '@esparex/contracts';
import { AdContext } from '../types/ad.types';
import { mutateStatus } from './lifecycle/StatusMutationService';

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
    externalSession?: unknown
): Promise<Record<string, unknown> | null> => {
    const result = await updateAdLogic(adId, data, context, externalSession);
    if (result) {
        // 🛡️ STAFF+ CONSISTENCY GUARD
        // Bust both search and detail caches to prevent stale data visibility.
        void getListingsCache().invalidateAdFeedCaches().catch(() => {});
        void getListingsCache().invalidatePublicAdCache(adId).catch(() => {});
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
    
    let result: Record<string, unknown> | null = null;
    await getListingUnitOfWork().executeTransaction(async (session) => {
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
                session: session as any
            });
        }
    });

    return result;
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
        void getListingsCache().invalidateAdFeedCaches().catch(() => {});
        void getListingsCache().invalidatePublicAdCache(id).catch(() => {});
    }
    return result;
};

export const repostAd = async (
    id: string,
    userId: string
): Promise<Record<string, unknown> | null> => {
    const result = await repostAdLogic(id, userId);
    if (result) {
        void getListingsCache().invalidateAdFeedCaches().catch(() => {});
        void getListingsCache().invalidatePublicAdCache(id).catch(() => {});
    }
    return result;
};


export const extendListingExpiry = async (
    id: string,
    expiresAt: Date,
    currentStatus: string,
    now: Date
) => {
    return getListingRepository().updateOne(id, {
        $set: {
            expiresAt,
            expiryWarningSentAt: null,
            expiryWarningCount: 0,
            lastExpiryWarningChannel: null,
        },
        $push: {
            timeline: {
                status: currentStatus,
                timestamp: now,
                reason: 'Expiry extended by admin',
            },
        },
    } as any);
};

export const findOwnedService = async (
    id: string,
    userId: string | { toString(): string },
    listingType: string,
    fetchFull: boolean
) => {
    const sellerId = typeof userId === 'string' ? userId : userId.toString();
    if (fetchFull) {
        return getListingRepository().findOne({ ids: [id], listingType: listingType as ListingTypeValue, sellerId });
    }
    return getListingRepository().findOne({ ids: [id], listingType: listingType as ListingTypeValue, sellerId, isDeleted: { $ne: true } } as any);
};
