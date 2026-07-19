import mongoose from 'mongoose';
import { AppError } from '../../utils/AppError';
import { getListingRepository } from '../../composition/listings';
import User from '../../models/User';
import { LISTING_STATUS } from '@esparex/contracts';
import { LISTING_TYPE, type ListingTypeValue } from '@esparex/contracts';
import { Role } from '@esparex/contracts';
import { getSystemConfigForRead } from '../SystemConfigService';
import logger from '../../utils/logger';


export const assertOwnership = async (adId: string, userId: string): Promise<{ sellerId: mongoose.Types.ObjectId; status: string }> => {
    const ad = await getListingRepository().findById(adId);
    if (!ad) {
        throw new AppError('Ad not found', 404, 'NOT_FOUND');
    }
    if (ad.sellerId !== userId) {
        throw new AppError('Unauthorized', 403, 'UNAUTHORIZED');
    }
    return { sellerId: new mongoose.Types.ObjectId(ad.sellerId), status: ad.status as string };
};

/**
 * Validates if a seller is within their allowed listing threshold for a specific type.
 * Specifically used to enforce Business Account requirement for high-volume Spare Part sellers.
 */
export const validateSellerTypeThreshold = async (
    sellerId: string,
    listingType: ListingTypeValue
): Promise<{ ok: boolean; reason?: string; code?: string }> => {
    // Currently policy only applies to Spare Parts
    if (listingType !== LISTING_TYPE.SPARE_PART) {
        return { ok: true };
    }

    try {
        const user = await User.findById(sellerId).select('role').lean();
        if (!user) return { ok: false, reason: 'Seller not found', code: 'SELLER_NOT_FOUND' };

        // Business accounts have no threshold limits on spare parts
        if (
            user.role === Role.BUSINESS || 
            user.role === Role.ADMIN || 
            user.role === Role.SUPER_ADMIN ||
            user.role === Role.MODERATOR
        ) {
            return { ok: true };
        }

        const config = await getSystemConfigForRead();
        const threshold = config?.listing?.thresholds?.proSparePartLimit ?? 5; // Default 5

        const activeCount = await getListingRepository().count({
            sellerId,
            listingType: LISTING_TYPE.SPARE_PART,
            status: { $in: [LISTING_STATUS.LIVE, 'pending'] } as any,
            isDeleted: false
        });

        if (activeCount >= threshold) {
            return {
                ok: false,
                reason: `You have reached the limit of ${threshold} spare part listings for individual accounts. Please upgrade to a Business Account to post more.`,
                code: 'BUSINESS_REQUIRED_THRESHOLD'
            };
        }

        return { ok: true };
    } catch (error) {
        logger.error('validateSellerTypeThreshold: Error during validation', { error, sellerId });
        return { ok: true }; // Fail open for safety
    }
};
