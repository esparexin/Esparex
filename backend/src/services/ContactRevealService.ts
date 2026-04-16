import mongoose from 'mongoose';
import Ad from '../models/Ad';
import PhoneRevealLog from '../models/PhoneRevealLog';
import PhoneRequest from '../models/PhoneRequest';
import logger from '../utils/logger';
import { MOBILE_VISIBILITY, normalizeMobileVisibility } from '../../../shared/constants/mobileVisibility';
import { AD_STATUS } from '../../../shared/enums/adStatus';

type SellerContact = {
    _id?: mongoose.Types.ObjectId;
    mobile?: string;
    status?: string;
    mobileVisibility?: string;
};

type ContactRevealEntity = {
    sellerId?: SellerContact;
    status?: string;
    isDeleted?: boolean;
    listingType?: string;
} | null;

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
/* eslint-disable @typescript-eslint/require-await */
export const logPhoneReveal = async (
    entityId: string,
    entityType: string,
    sellerId: string,
    buyerId: string,
    ipAddress?: string,
    device?: string
): Promise<void> => { /* eslint-enable @typescript-eslint/require-await */
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
        const entity = await Ad.findById(id)
            .select('sellerId status isDeleted listingType')
            .populate('sellerId', 'mobile status mobileVisibility')
            .lean() as ContactRevealEntity;

        if (!entity) return { error: 'Listing not found' };

        const seller = entity.sellerId;
        if (!seller) return { error: 'Seller not found' };

        const sellerPhone = seller.mobile;
        const entityActive = entity.status === AD_STATUS.LIVE && !entity.isDeleted;
        const resolvedEntityType = entity.listingType || (entityType === 'spare_part' ? 'spare_part' : 'ad');

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
                    status: 'approved'
                }).lean();

                if (!approvedRequest) {
                    return { error: 'REQUEST_REQUIRED' };
                }
            }
        }

        // Accept both 'live' (canonical) and legacy 'active' alias
        const sellerActive = seller.status === 'live' || seller.status === 'active';

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
