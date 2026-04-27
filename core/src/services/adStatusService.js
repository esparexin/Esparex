"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.expireBoosts = exports.expireOutdatedAds = exports.extendAdExpiry = exports.computeActiveExpiry = exports.restoreAd = exports.deleteAd = exports.updateAdStatus = exports.isValidAdStatus = exports.normalizeAdStatus = void 0;
const lifecycle_1 = require("@core/constants/enums/lifecycle");
const listingType_1 = require("@core/constants/enums/listingType");
const adStatus_1 = require("@core/constants/enums/adStatus");
const SystemConfigService_1 = require("./SystemConfigService");
/**
 * Normalizes status input to canonical LIFECYCLE_STATUS.
 * Maps legacy 'active' and 'approved' to 'live'.
 */
const normalizeAdStatus = (status) => {
    if (!status)
        return status;
    const s = String(status).toLowerCase().trim();
    if (s === 'active' || s === 'approved')
        return lifecycle_1.LIFECYCLE_STATUS.LIVE;
    return s;
};
exports.normalizeAdStatus = normalizeAdStatus;
/**
 * Validates if a string is a recognized Ad status.
 */
const isValidAdStatus = (status) => {
    if (!status || typeof status !== 'string')
        return false;
    return adStatus_1.AD_STATUS_VALUES.includes(status);
};
exports.isValidAdStatus = isValidAdStatus;
const Ad_1 = __importDefault(require("@core/models/Ad"));
const StatusMutationService_1 = require("./StatusMutationService");
const constants_1 = require("@core/config/constants");
const logger_1 = __importDefault(require("@core/utils/logger"));
const events_1 = require("../events");
const ListingExpiryService_1 = require("./ListingExpiryService");
// E1: mutateStatus returns doc.toObject() — typed as Record<string, unknown> | null
const updateAdStatus = async (id, newStatus, data) => {
    return (0, StatusMutationService_1.mutateStatus)({
        domain: 'ad',
        entityId: id,
        toStatus: (0, exports.normalizeAdStatus)(newStatus),
        actor: { type: data.actorType || 'admin', id: data.actorId, ip: '', userAgent: '' },
        reason: data.reason || data.rejectionReason || data.soldReason,
        patch: {
            soldReason: data.soldReason,
            rejectionReason: data.rejectionReason
        }
    });
};
exports.updateAdStatus = updateAdStatus;
const deleteAd = async (id, actorId, actorType = 'user') => {
    return (0, StatusMutationService_1.mutateStatus)({
        domain: 'ad',
        entityId: id,
        toStatus: lifecycle_1.LIFECYCLE_STATUS.DEACTIVATED,
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
exports.deleteAd = deleteAd;
const restoreAd = async (id, actorId, actorType = 'user') => {
    return (0, StatusMutationService_1.mutateStatus)({
        domain: 'ad',
        entityId: id,
        toStatus: lifecycle_1.LIFECYCLE_STATUS.PENDING,
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
exports.restoreAd = restoreAd;
/**
 * Calculates the expiration date for a listing based on its type.
 * Fetches dynamic values from SystemConfig (DB) if available,
 * otherwise falls back to hardcoded GOVERNANCE constants.
 */
const computeActiveExpiry = async (listingType = listingType_1.LISTING_TYPE.AD) => {
    let days = constants_1.GOVERNANCE.AD.EXPIRY_DAYS; // Default 30
    try {
        const config = await (0, SystemConfigService_1.getSystemConfigForRead)();
        if (config?.listing?.expiryDays) {
            const dynamicDays = config.listing.expiryDays[listingType];
            if (typeof dynamicDays === 'number') {
                days = dynamicDays;
            }
            else if (listingType === listingType_1.LISTING_TYPE.SERVICE || listingType === listingType_1.LISTING_TYPE.SPARE_PART) {
                days = constants_1.GOVERNANCE.CONTENT.EXPIRY_DAYS;
            }
        }
        else if (listingType === listingType_1.LISTING_TYPE.SERVICE || listingType === listingType_1.LISTING_TYPE.SPARE_PART) {
            days = constants_1.GOVERNANCE.CONTENT.EXPIRY_DAYS;
        }
    }
    catch (error) {
        logger_1.default.warn('computeActiveExpiry: Failed to fetch SystemConfig, falling back to constants', { error });
        if (listingType === listingType_1.LISTING_TYPE.SERVICE || listingType === listingType_1.LISTING_TYPE.SPARE_PART) {
            days = constants_1.GOVERNANCE.CONTENT.EXPIRY_DAYS;
        }
    }
    return new Date(Date.now() + days * constants_1.MS_IN_DAY);
};
exports.computeActiveExpiry = computeActiveExpiry;
const extendAdExpiry = async (id, daysToAdd, actorId, actorType = 'admin') => {
    // E2: Use typed lean generic instead of 'as any' cast
    const ad = await Ad_1.default.findById(id).lean();
    if (!ad)
        return null;
    const currentExpiry = ad.expiresAt ? new Date(ad.expiresAt).getTime() : Date.now();
    const newExpiresAt = new Date(currentExpiry + daysToAdd * constants_1.MS_IN_DAY);
    const toStatus = (ad.status === lifecycle_1.LIFECYCLE_STATUS.EXPIRED ? lifecycle_1.LIFECYCLE_STATUS.LIVE : ad.status) ?? lifecycle_1.LIFECYCLE_STATUS.LIVE;
    return (0, StatusMutationService_1.mutateStatus)({
        domain: 'ad',
        entityId: id,
        toStatus,
        actor: { type: actorType, id: actorId, ip: '', userAgent: '' },
        reason: `Extended by ${daysToAdd} days`,
        patch: { expiresAt: newExpiresAt }
    });
};
exports.extendAdExpiry = extendAdExpiry;
const expireOutdatedAds = async () => {
    const result = await ListingExpiryService_1.ListingExpiryService.runSweep(new Date());
    return result.expiredCount;
};
exports.expireOutdatedAds = expireOutdatedAds;
const expireBoosts = async () => {
    const result = await Ad_1.default.updateMany({ isSpotlight: true, spotlightExpiresAt: { $lt: new Date() } }, { $set: { isSpotlight: false } });
    const count = result.modifiedCount || 0;
    if (count > 0) {
        await events_1.lifecycleEvents.dispatch('ad.spotlight.expired', { count, source: 'cron_expireBoosts' });
    }
    return count;
};
exports.expireBoosts = expireBoosts;
//# sourceMappingURL=adStatusService.js.map