"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSellerPhone = exports.logPhoneReveal = exports.maskPhone = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const Ad_1 = __importDefault(require("@core/models/Ad"));
const PhoneRevealLog_1 = __importDefault(require("@core/models/PhoneRevealLog"));
const PhoneRequest_1 = __importDefault(require("@core/models/PhoneRequest"));
const logger_1 = __importDefault(require("@core/utils/logger"));
const mobileVisibility_1 = require("@shared/constants/mobileVisibility");
const adStatus_1 = require("@core/constants/enums/adStatus");
const userStatus_1 = require("@core/constants/enums/userStatus");
/**
 * Mask phone number for display
 * e.g., "+1234567890" → "+1****7890"
 */
const maskPhone = (phone) => {
    if (!phone || phone.length < 4) {
        return undefined;
    }
    const start = phone.substring(0, 3);
    const end = phone.substring(phone.length - 4);
    return `${start}****${end}`;
};
exports.maskPhone = maskPhone;
/**
 * Log when a phone number is revealed to a buyer
 * This helps track suspicious activity and validate business metrics
 */
/* eslint-disable @typescript-eslint/require-await */
const logPhoneReveal = async (entityId, entityType, sellerId, buyerId, ipAddress, device) => {
    try {
        // 1. Persistent Audit Log (Non-blocking DB insertion)
        const logData = {
            entityId: new mongoose_1.default.Types.ObjectId(entityId),
            entityType: entityType,
            sellerId: new mongoose_1.default.Types.ObjectId(sellerId),
            buyerId: new mongoose_1.default.Types.ObjectId(buyerId),
            ipAddress,
            device,
            revealedAt: new Date()
        };
        // Create log record asynchronously
        PhoneRevealLog_1.default.create(logData).catch((err) => {
            logger_1.default.error('Failed to create PhoneRevealLog document', { error: err instanceof Error ? err.message : String(err) });
        });
        // 2. Technical Debug Log for Developer awareness
        logger_1.default.debug('Phone number revealed', {
            entityId,
            entityType,
            sellerId,
            buyerId,
            ipAddress,
            device,
            timestamp: logData.revealedAt.toISOString()
        });
    }
    catch (error) {
        logger_1.default.error('Failed to log phone reveal', {
            error: error instanceof Error ? error.message : String(error)
        });
    }
};
exports.logPhoneReveal = logPhoneReveal;
/**
 * Canonical service for getting seller phone numbers for all listings
 */
const getSellerPhone = async (entityId, entityType, // Keep for compatibility, but query Ad
buyerId, metadata) => {
    if (!mongoose_1.default.Types.ObjectId.isValid(String(entityId))) {
        return null;
    }
    const id = new mongoose_1.default.Types.ObjectId(String(entityId));
    try {
        const entity = await Ad_1.default.findById(id)
            .select('sellerId status isDeleted listingType')
            .populate('sellerId', 'mobile status mobileVisibility')
            .lean();
        if (!entity)
            return { error: 'Listing not found' };
        const seller = entity.sellerId;
        if (!seller)
            return { error: 'Seller not found' };
        const sellerPhone = seller.mobile;
        const entityActive = entity.status === adStatus_1.AD_STATUS.LIVE && !entity.isDeleted;
        const resolvedEntityType = entity.listingType || (entityType === 'spare_part' ? 'spare_part' : 'ad');
        const isOwner = Boolean(buyerId && seller._id && buyerId === seller._id.toString());
        // Privacy Logic Enforcement (Bypass for owners)
        if (!isOwner) {
            const sellerMobileVisibility = (0, mobileVisibility_1.normalizeMobileVisibility)(seller.mobileVisibility, mobileVisibility_1.MOBILE_VISIBILITY.SHOW);
            if (sellerMobileVisibility === mobileVisibility_1.MOBILE_VISIBILITY.HIDE) {
                return { error: 'HIDDEN' };
            }
            if (sellerMobileVisibility === mobileVisibility_1.MOBILE_VISIBILITY.ON_REQUEST) {
                // Check for approved request
                const approvedRequest = await PhoneRequest_1.default.findOne({
                    buyerId: new mongoose_1.default.Types.ObjectId(buyerId),
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
        // Validate seller status is canonical LIVE status
        const sellerActive = seller.status === userStatus_1.USER_STATUS.LIVE;
        if (!isOwner && (!entityActive || !sellerActive)) {
            const err = new Error('Phone number is unavailable for this listing.');
            err.statusCode = 403;
            throw err;
        }
        // Phone numbers should only be revealed to logged-in buyers
        if (!buyerId) {
            // Return masked phone for unauthenticated users
            const maskedPhone = (0, exports.maskPhone)(sellerPhone);
            return { masked: maskedPhone };
        }
        // Log phone reveal for audit trail
        if (buyerId && !isOwner) {
            (0, exports.logPhoneReveal)(String(id), resolvedEntityType, String(seller._id || ''), buyerId, metadata?.ip, metadata?.device).catch((err) => {
                logger_1.default.error('Failed to log phone reveal', { error: err instanceof Error ? err.message : String(err) });
            });
        }
        return {
            phone: sellerPhone,
            mobile: sellerPhone,
        };
    }
    catch (error) {
        logger_1.default.error(`Failed to get listing phone`, {
            error: error instanceof Error ? error.message : String(error),
            entityId: String(id)
        });
        if (error.statusCode === 403) {
            throw error;
        }
        return { error: 'Failed to retrieve phone number' };
    }
};
exports.getSellerPhone = getSellerPhone;
//# sourceMappingURL=ContactRevealService.js.map