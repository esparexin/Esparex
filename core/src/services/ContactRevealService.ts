import mongoose from 'mongoose';
import { getListingRepository } from '../composition/listings';
import User from '../models/User';
import PhoneRevealLog from '../models/PhoneRevealLog';
import PhoneRequest from '../models/PhoneRequest';
import logger from '../utils/logger';
import { MOBILE_VISIBILITY, normalizeMobileVisibility } from "@esparex/shared";
import { LISTING_STATUS } from '@esparex/contracts';
import { USER_STATUS } from '@esparex/shared';
import { REQUEST_STATUS } from '@esparex/shared';

type SellerContact = {
    _id?: mongoose.Types.ObjectId;
    mobile?: string;
    status?: string;
    mobileVisibility?: string;
};


/**
 * Mask phone number for display
 * e.g., "+1234567890" → "+1****7890"
 */
export const maskPhone = (phone?: string): string | undefined => {
    if (!phone || phone.length < 4) {
        return undefined;
    }

    const start = phone.substring(0, 3);
    const end = phone.substring(phone.length - 4);
    return `${start}****${end}`;
};

/**
 * Log when a phone number is revealed to a buyer
 * This helps track suspicious activity and validate business metrics
 */
 
export const logPhoneReveal = async (
    entityId: string,
    entityType: 'ad' | 'service' | 'spare_part',
    sellerId: string,
    buyerId: string,
    ipAddress?: string,
    device?: string
): Promise<void> => {  
    try {
        // 1. Persistent Audit Log (Non-blocking DB insertion)
        const logData = {
            entityId: new mongoose.Types.ObjectId(entityId),
            entityType: entityType,
            sellerId: new mongoose.Types.ObjectId(sellerId),
            buyerId: new mongoose.Types.ObjectId(buyerId),
            ipAddress,
            device,
            revealedAt: new Date()
        };

        // Create log record asynchronously
        PhoneRevealLog.create(logData).catch((err: unknown) => {
            logger.error('Failed to create PhoneRevealLog document', { error: err instanceof Error ? err.message : String(err) });
        });

        // 2. Technical Debug Log for Developer awareness
        logger.debug('Phone number revealed', {
            entityId,
            entityType,
            sellerId,
            buyerId,
            ipAddress,
            device,
            timestamp: logData.revealedAt.toISOString()
        });
    } catch (error) {
        logger.error('Failed to log phone reveal', {
            error: error instanceof Error ? error.message : String(error)
        });
    }
};

/**
 * Canonical service for getting seller phone numbers for all listings
 */
export const getSellerPhone = async (
    entityId: string | mongoose.Types.ObjectId,
    entityType: 'ad' | 'service' | 'spare_part', // Keep for compatibility, but query Ad
    buyerId?: string,
    metadata?: { ip?: string; device?: string }
): Promise<{
    phone?: string;
    mobile?: string;
    masked?: string;
    error?: string;
} | null> => {
    if (!mongoose.Types.ObjectId.isValid(String(entityId))) {
        return null;
    }

    const id = new mongoose.Types.ObjectId(String(entityId));

    try {
        const listing = await getListingRepository().findById(String(id));
        if (!listing) return { error: 'Listing not found' };

        const seller = await User.findById(listing.sellerId)
            .select('_id mobile status mobileVisibility')
            .lean() as SellerContact | null;
        if (!seller) return { error: 'Seller not found' };

        const sellerPhone = seller.mobile;
        const entityActive = listing.status === LISTING_STATUS.LIVE && !listing.isDeleted;
        const resolvedEntityType = (listing.listingType as 'ad' | 'service' | 'spare_part') || (entityType === 'spare_part' ? 'spare_part' : 'ad');

        const isOwner = Boolean(buyerId && seller._id && buyerId === seller._id.toString());

        // Privacy Logic Enforcement (Bypass for owners)
        if (!isOwner) {
            const sellerMobileVisibility = normalizeMobileVisibility(seller.mobileVisibility, MOBILE_VISIBILITY.SHOW);

            if (sellerMobileVisibility === MOBILE_VISIBILITY.HIDE) {
                return { error: 'HIDDEN' };
            }
            if (sellerMobileVisibility === MOBILE_VISIBILITY.ON_REQUEST) {
                // Check for approved request
                const approvedRequest = await PhoneRequest.findOne({
                    buyerId: new mongoose.Types.ObjectId(buyerId),
                    sellerId: seller._id,
                    entityId: id,
                    entityType: resolvedEntityType,
                    status: REQUEST_STATUS.APPROVED,
                }).lean();

                if (!approvedRequest) {
                    return { error: 'REQUEST_REQUIRED' };
                }
            }
        }

        // Validate seller status is canonical LIVE status
        const sellerActive = seller.status === USER_STATUS.LIVE;

        if (!isOwner && (!entityActive || !sellerActive)) {
            const err = new Error('Phone number is unavailable for this listing.');
            (err as Error & { statusCode?: number }).statusCode = 403;
            throw err;
        }

        // Phone numbers should only be revealed to logged-in buyers
        if (!buyerId) {
            // Return masked phone for unauthenticated users
            const maskedPhone = maskPhone(sellerPhone);
            return { masked: maskedPhone };
        }

        // Log phone reveal for audit trail
        if (buyerId && !isOwner) {
            logPhoneReveal(
                String(id),
                resolvedEntityType,
                String(seller._id || ''),
                buyerId,
                metadata?.ip,
                metadata?.device
            ).catch((err: unknown) => {
                logger.error('Failed to log phone reveal', { error: err instanceof Error ? err.message : String(err) });
            });
        }

        return {
            phone: sellerPhone,
            mobile: sellerPhone,
        };
    } catch (error) {
        logger.error(`Failed to get listing phone`, {
            error: error instanceof Error ? error.message : String(error),
            entityId: String(id)
        });

        if ((error as Error & { statusCode?: number }).statusCode === 403) {
            throw error;
        }

        return { error: 'Failed to retrieve phone number' };
    }
};
