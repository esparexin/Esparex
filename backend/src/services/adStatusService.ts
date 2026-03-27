import { LIFECYCLE_STATUS, type LifecycleStatus } from '../../../shared/enums/lifecycle';
import { LISTING_TYPE, type ListingTypeValue } from '../../../shared/enums/listingType';
import { getSystemConfigForRead } from './SystemConfigService';

export type AdStatus = LifecycleStatus;

export interface StatusTransitionData {
    reason?: string;
    rejectionReason?: string;
    soldReason?: 'sold_on_platform' | 'sold_outside' | 'no_longer_available';
    actorId?: string;
    actorType?: 'user' | 'admin' | 'system';
}

/**
 * Normalizes status input to canonical LIFECYCLE_STATUS.
 * Maps legacy 'active' and 'approved' to 'live'.
 */
export const normalizeAdStatus = (status: string): string => {
    if (!status) return status;
    const s = String(status).toLowerCase().trim();
    if (s === 'active' || s === 'approved') return LIFECYCLE_STATUS.LIVE;
    return s;
};

import Ad from '../models/Ad';
import { mutateStatus } from './StatusMutationService';
import { MS_IN_DAY, GOVERNANCE } from '../config/constants';
import logger from '../utils/logger';
import { lifecycleEvents } from '../events';

export const updateAdStatus = async (
    id: string,
    newStatus: string,
    data: StatusTransitionData
): Promise<any> => {
    return mutateStatus({
        domain: 'ad',
        entityId: id,
        toStatus: normalizeAdStatus(newStatus),
        actor: { type: data.actorType || 'admin', id: data.actorId, ip: '', userAgent: '' },
        reason: data.reason || data.rejectionReason || data.soldReason,
        patch: {
            soldReason: data.soldReason,
            rejectionReason: data.rejectionReason
        }
    });
};

export const deleteAd = async (id: string, actorId?: string, actorType: 'user' | 'admin' | 'system' = 'user'): Promise<any> => {
    return mutateStatus({
        domain: 'ad',
        entityId: id,
        toStatus: LIFECYCLE_STATUS.DEACTIVATED,
        actor: { type: actorType, id: actorId, ip: '', userAgent: '' },
        reason: 'Ad soft deleted',
        metadata: {
            action: 'soft_delete',
        },
        patch: {
            isDeleted: true,
            deletedAt: new Date(),
            isSpotlight: false,
            isChatLocked: true,
        },
    });
};

export const restoreAd = async (id: string, actorId?: string, actorType: 'user' | 'admin' | 'system' = 'user'): Promise<any> => {
    return mutateStatus({
        domain: 'ad',
        entityId: id,
        toStatus: LIFECYCLE_STATUS.PENDING,
        actor: { type: actorType, id: actorId, ip: '', userAgent: '' },
        reason: 'Ad restored for moderation review',
        metadata: {
            action: 'restore',
        },
        patch: {
            isDeleted: false,
            deletedAt: undefined,
            moderationStatus: 'held_for_review',
        },
    });
};

/**
 * Calculates the expiration date for a listing based on its type.
 * Fetches dynamic values from SystemConfig (DB) if available, 
 * otherwise falls back to hardcoded GOVERNANCE constants.
 */
export const computeActiveExpiry = async (listingType: ListingTypeValue = LISTING_TYPE.AD): Promise<Date> => {
    let days = GOVERNANCE.AD.EXPIRY_DAYS; // Default 30

    try {
        const config = await getSystemConfigForRead();
        if (config?.listing?.expiryDays) {
            const dynamicDays = config.listing.expiryDays[listingType as keyof typeof config.listing.expiryDays];
            if (typeof dynamicDays === 'number') {
                days = dynamicDays;
            } else if (listingType === LISTING_TYPE.SERVICE || listingType === LISTING_TYPE.SPARE_PART) {
                days = GOVERNANCE.CONTENT.EXPIRY_DAYS;
            }
        } else if (listingType === LISTING_TYPE.SERVICE || listingType === LISTING_TYPE.SPARE_PART) {
            days = GOVERNANCE.CONTENT.EXPIRY_DAYS;
        }
    } catch (error) {
        logger.warn('computeActiveExpiry: Failed to fetch SystemConfig, falling back to constants', { error });
        if (listingType === LISTING_TYPE.SERVICE || listingType === LISTING_TYPE.SPARE_PART) {
            days = GOVERNANCE.CONTENT.EXPIRY_DAYS;
        }
    }

    return new Date(Date.now() + days * MS_IN_DAY);
};

export const extendAdExpiry = async (id: string, daysToAdd: number, actorId?: string, actorType: 'user' | 'admin' | 'system' = 'admin'): Promise<any> => {
    const ad = await Ad.findById(id).lean() as any;
    if (!ad) return null;
    const currentExpiry = ad.expiresAt ? new Date(ad.expiresAt).getTime() : Date.now();
    const newExpiresAt = new Date(currentExpiry + daysToAdd * MS_IN_DAY);
    const toStatus = ad.status === LIFECYCLE_STATUS.EXPIRED ? LIFECYCLE_STATUS.LIVE : ad.status;
    
    return mutateStatus({
        domain: 'ad',
        entityId: id,
        toStatus,
        actor: { type: actorType, id: actorId, ip: '', userAgent: '' },
        reason: `Extended by ${daysToAdd} days`,
        patch: { expiresAt: newExpiresAt }
    });
};

export const expireOutdatedAds = async (): Promise<number> => {
    const { ListingExpiryService } = await import('./ListingExpiryService');
    const result = await ListingExpiryService.runSweep(new Date());
    return result.expiredCount;
};

export const expireBoosts = async (): Promise<number> => {
    const result = await Ad.updateMany(
        { isSpotlight: true, spotlightExpiresAt: { $lt: new Date() } },
        { $set: { isSpotlight: false } }
    );
    
    const count = result.modifiedCount || 0;
    if (count > 0) {
        await lifecycleEvents.dispatch('ad.spotlight.expired', { count, source: 'cron_expireBoosts' });
    }
    
    return count;
};
