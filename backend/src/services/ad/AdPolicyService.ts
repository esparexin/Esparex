import mongoose from 'mongoose';
import { AppError } from '../../utils/AppError';
import Ad from '../../models/Ad';
import User from '../../models/User';
import { AD_STATUS } from '../../../../shared/enums/adStatus';
import { LISTING_TYPE, type ListingTypeValue } from '../../../../shared/enums/listingType';
import { getSystemConfigForRead } from '../SystemConfigService';
import logger from '../../utils/logger';


export const assertOwnership = async (adId: string, userId: string): Promise<{ sellerId: mongoose.Types.ObjectId; status: string }> => {
    const ad = await Ad.findById(adId).select('sellerId status').lean();
    if (!ad) {
        throw new AppError('Ad not found', 404, 'NOT_FOUND');
    }
    if (String(ad.sellerId) !== String(userId)) {
        throw new AppError('Unauthorized', 403, 'UNAUTHORIZED');
    }
    return ad as { sellerId: mongoose.Types.ObjectId; status: string };
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
            user.role === 'business' || 
            user.role === 'admin' || 
            user.role === 'super_admin' || 
            user.role === 'superadmin'
        ) {
            return { ok: true };
        }

        const config = await getSystemConfigForRead();
        const threshold = config?.listing?.thresholds?.proSparePartLimit ?? 5; // Default 5

        const activeCount = await Ad.countDocuments({
            sellerId: new mongoose.Types.ObjectId(sellerId),
            listingType: LISTING_TYPE.SPARE_PART,
            status: { $in: [AD_STATUS.LIVE, 'pending'] },
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
