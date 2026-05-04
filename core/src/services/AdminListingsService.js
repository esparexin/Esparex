"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminGetListingCounts = exports.adminResolveListingReport = exports.adminSoftDeleteListing = exports.adminExtendListing = exports.adminExpireListing = exports.adminDeactivateListing = exports.adminRejectListing = exports.adminApproveListing = exports.adminUpdateListing = exports.adminCreateListing = exports.adminGetListingById = exports.adminListListings = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const AdDetailService_1 = require("./ad/AdDetailService");
const AdMutationService_1 = require("./AdMutationService");
const ReportService_1 = require("./ReportService");
const StatusMutationService_1 = require("./StatusMutationService");
const actor_1 = require("@core/constants/enums/actor");
const listingStatus_1 = require("@core/constants/enums/listingStatus");
const AdStatusService_1 = require("./AdStatusService");
const listingType_1 = require("@core/constants/enums/listingType");
const AdMutationService_2 = require("./AdMutationService");
const AdOrchestrator_1 = require("./AdOrchestrator");
const ListingModerationQueryService_1 = require("./ListingModerationQueryService");
const reportStatus_1 = require("@core/constants/enums/reportStatus");
const AppError_1 = require("@core/utils/AppError");
// ---------------------------------------------------------
// Helpers
// ---------------------------------------------------------
const parsePositiveInt = (value, fallback, bounds) => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed))
        return fallback;
    const normalized = Math.floor(parsed);
    if (normalized < bounds.min)
        return bounds.min;
    if (normalized > bounds.max)
        return bounds.max;
    return normalized;
};
const asString = (value) => typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
const asNumber = (value) => {
    if (value === null || value === undefined || value === '')
        return undefined;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
};
const parseDuplicateBypassPayload = (body) => {
    const allowDuplicateBypass = body?.allowDuplicateBypass === true;
    const duplicateBypassReason = typeof body?.duplicateBypassReason === 'string'
        ? body.duplicateBypassReason.trim()
        : '';
    return { allowDuplicateBypass, duplicateBypassReason };
};
const sanitizeDuplicateBypassPayload = (body) => {
    const payload = { ...body };
    delete payload.allowDuplicateBypass;
    delete payload.duplicateBypassReason;
    return payload;
};
const validateDuplicateBypass = (allowDuplicateBypass, duplicateBypassReason) => {
    if (allowDuplicateBypass && duplicateBypassReason.length < 12) {
        throw new AppError_1.AppError('A detailed duplicate bypass reason (minimum 12 characters) is required.', 400);
    }
};
const resolveListingTypeFilter = (raw) => {
    const val = typeof raw === 'string' ? raw.trim().toLowerCase() : undefined;
    return val && (0, ListingModerationQueryService_1.isValidListingType)(val) ? (val) : undefined;
};
const buildAdminActor = (actorId) => ({
    type: actor_1.ACTOR_TYPE.ADMIN,
    id: actorId,
});
const validateListingId = (id) => {
    if (!id || !mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw new AppError_1.AppError('Invalid listing id', 400);
    }
    return id;
};
const getListingForMutation = async (id) => {
    const listing = await (0, AdDetailService_1.getAdForModerationById)(id);
    if (!listing) {
        throw new AppError_1.AppError('Listing not found', 404);
    }
    return listing;
};
// ---------------------------------------------------------
// Service Methods
// ---------------------------------------------------------
const adminListListings = async (query) => {
    const page = parsePositiveInt(query.page, 1, { min: 1, max: 100000 });
    const limit = parsePositiveInt(query.limit, 20, { min: 1, max: 100 });
    const listingType = resolveListingTypeFilter(query.listingType);
    const result = await (0, ListingModerationQueryService_1.listModerationListings)({
        status: (0, ListingModerationQueryService_1.normalizeModerationStatusFilter)(asString(query.status)),
        sellerId: asString(query.sellerId),
        categoryId: asString(query.categoryId),
        brandId: asString(query.brandId),
        modelId: asString(query.modelId),
        locationId: asString(query.locationId),
        q: asString(query.q),
        minPrice: asNumber(query.minPrice),
        maxPrice: asNumber(query.maxPrice),
        createdAfter: asString(query.createdAfter),
        createdBefore: asString(query.createdBefore),
        listingType,
        sortBy: asString(query.sortBy),
    }, { page, limit });
    const total = result.pagination.total || 0;
    const totalPages = result.pagination.totalPages || Math.max(1, Math.ceil(total / Math.max(1, limit)));
    return {
        items: result.data,
        page,
        limit,
        total,
        totalPages,
    };
};
exports.adminListListings = adminListListings;
const adminGetListingById = async (id) => {
    validateListingId(id);
    const listing = await (0, ListingModerationQueryService_1.getModerationListingById)(id);
    if (!listing) {
        throw new AppError_1.AppError('Listing not found', 404);
    }
    return listing;
};
exports.adminGetListingById = adminGetListingById;
const adminCreateListing = async (actorId, body, logFn) => {
    const safeBody = (body && typeof body === 'object' ? body : {});
    const { allowDuplicateBypass, duplicateBypassReason } = parseDuplicateBypassPayload(safeBody);
    validateDuplicateBypass(allowDuplicateBypass, duplicateBypassReason);
    const payload = sanitizeDuplicateBypassPayload(safeBody);
    const ad = await (0, AdOrchestrator_1.createAd)(payload, {
        actor: 'ADMIN',
        authUserId: actorId,
        sellerId: actorId,
        allowQuotaBypass: true,
    });
    if (!ad) {
        throw new AppError_1.AppError('Failed to create listing', 500);
    }
    const createdAdId = (ad._id ?? '').toString();
    if (!createdAdId) {
        throw new AppError_1.AppError('Created listing id is missing', 500);
    }
    await logFn('CREATE_LISTING', 'Ad', createdAdId, {
        ...payload,
        allowDuplicateBypass,
        duplicateBypassReason: allowDuplicateBypass ? duplicateBypassReason : undefined,
    });
    await logFn('SLOT_QUOTA_BYPASS', 'Ad', createdAdId, {
        via: 'adminCreateListing',
        reason: 'Admin quota bypass — admin actor',
        adminId: actorId,
        allowDuplicateBypass,
        duplicateBypassReason: allowDuplicateBypass ? duplicateBypassReason : undefined,
    });
    return ad;
};
exports.adminCreateListing = adminCreateListing;
const adminUpdateListing = async (id, actorId, body, logFn) => {
    validateListingId(id);
    const safeBody = (body && typeof body === 'object' ? body : {});
    const { allowDuplicateBypass, duplicateBypassReason } = parseDuplicateBypassPayload(safeBody);
    validateDuplicateBypass(allowDuplicateBypass, duplicateBypassReason);
    const payload = sanitizeDuplicateBypassPayload(safeBody);
    const restPayload = { ...payload };
    delete restPayload.status;
    delete restPayload.rejectionReason;
    const updatedAd = await (0, AdMutationService_2.updateAdTransactional)({
        adId: id,
        patch: restPayload,
        context: {
            actor: 'ADMIN',
            authUserId: actorId,
            sellerId: actorId,
            allowQuotaBypass: true,
            allowDuplicateBypass,
            duplicateBypassReason: allowDuplicateBypass ? duplicateBypassReason : undefined,
        }
    });
    await logFn('UPDATE_LISTING', 'Ad', id, {
        ...restPayload,
        allowDuplicateBypass,
        duplicateBypassReason: allowDuplicateBypass ? duplicateBypassReason : undefined,
    });
    await logFn('SLOT_QUOTA_BYPASS', 'Ad', id, {
        via: 'adminUpdateListing',
        reason: 'Admin quota bypass — admin actor',
        adminId: actorId,
        allowDuplicateBypass,
        duplicateBypassReason: allowDuplicateBypass ? duplicateBypassReason : undefined,
    });
    return updatedAd;
};
exports.adminUpdateListing = adminUpdateListing;
const adminApproveListing = async (id, actorId, logFn, reviewVersion) => {
    validateListingId(id);
    const listing = await getListingForMutation(id);
    if (typeof reviewVersion === 'number'
        && typeof listing.reviewVersion === 'number'
        && reviewVersion !== listing.reviewVersion) {
        throw new AppError_1.AppError('Conflict: listing was edited while under review', 409);
    }
    const approvedAt = new Date();
    const expiresAt = await (0, AdStatusService_1.computeActiveExpiry)(listing.listingType || listingType_1.LISTING_TYPE.AD);
    const updated = await (0, StatusMutationService_1.mutateStatus)({
        domain: 'ad',
        entityId: id,
        toStatus: listingStatus_1.LISTING_STATUS.LIVE,
        actor: buildAdminActor(actorId),
        reason: 'Approved by moderation',
        metadata: {
            action: 'moderation_approve',
            sourceRoute: '/api/v1/admin/listings/:id/approve',
            listingType: listing.listingType || 'ad',
        },
        patch: {
            moderatorId: actorId,
            approvedAt,
            approvedBy: actorId,
            expiresAt,
            moderationStatus: 'manual_approved',
            rejectionReason: undefined,
            $push: {
                timeline: {
                    status: listingStatus_1.LISTING_STATUS.LIVE,
                    timestamp: approvedAt,
                    reason: 'Approved by moderation',
                },
            },
        },
    });
    await logFn('LISTING_APPROVE', 'Ad', id, { status: listingStatus_1.LISTING_STATUS.LIVE });
    return updated;
};
exports.adminApproveListing = adminApproveListing;
const adminRejectListing = async (id, actorId, rejectionReason, logFn) => {
    validateListingId(id);
    if (!rejectionReason || !rejectionReason.trim()) {
        throw new AppError_1.AppError('Rejection reason is required', 400);
    }
    await getListingForMutation(id);
    const updated = await (0, StatusMutationService_1.mutateStatus)({
        domain: 'ad',
        entityId: id,
        toStatus: listingStatus_1.LISTING_STATUS.REJECTED,
        actor: buildAdminActor(actorId),
        reason: rejectionReason,
        metadata: {
            action: 'moderation_reject',
            sourceRoute: '/api/v1/admin/listings/:id/reject',
        },
        patch: {
            rejectionReason,
            moderatorId: actorId,
            moderationStatus: 'rejected',
            $push: {
                timeline: {
                    status: listingStatus_1.LISTING_STATUS.REJECTED,
                    timestamp: new Date(),
                    reason: rejectionReason,
                },
            },
        },
    });
    await logFn('LISTING_REJECT', 'Ad', id, { rejectionReason });
    return updated;
};
exports.adminRejectListing = adminRejectListing;
const adminDeactivateListing = async (id, actorId, logFn) => {
    validateListingId(id);
    const listing = await getListingForMutation(id);
    if (listing.status === listingStatus_1.LISTING_STATUS.DEACTIVATED) {
        const currentListing = await (0, ListingModerationQueryService_1.getModerationListingById)(id);
        return { action: 'deactivated', listing: currentListing || { id, status: listingStatus_1.LISTING_STATUS.DEACTIVATED, listingType: listing.listingType || 'ad' }, message: 'Listing is already deactivated' };
    }
    const updated = await (0, StatusMutationService_1.mutateStatus)({
        domain: 'ad',
        entityId: id,
        toStatus: listingStatus_1.LISTING_STATUS.DEACTIVATED,
        actor: buildAdminActor(actorId),
        reason: 'Deactivated by moderation',
        metadata: {
            action: 'moderation_deactivate',
            sourceRoute: '/api/v1/admin/listings/:id/deactivate',
        },
        patch: {
            isSpotlight: false,
            isChatLocked: true,
            $push: {
                timeline: {
                    status: listingStatus_1.LISTING_STATUS.DEACTIVATED,
                    timestamp: new Date(),
                    reason: 'Deactivated by moderation',
                },
            },
        },
    });
    await logFn('LISTING_DEACTIVATE', 'Ad', id, {});
    return { action: 'deactivated', listing: updated, message: 'Listing deactivated successfully' };
};
exports.adminDeactivateListing = adminDeactivateListing;
const adminExpireListing = async (id, actorId, logFn) => {
    validateListingId(id);
    await getListingForMutation(id);
    const updated = await (0, StatusMutationService_1.mutateStatus)({
        domain: 'ad',
        entityId: id,
        toStatus: listingStatus_1.LISTING_STATUS.EXPIRED,
        actor: buildAdminActor(actorId),
        reason: 'Expired by moderation',
        metadata: {
            action: 'moderation_expire',
            sourceRoute: '/api/v1/admin/listings/:id/expire',
        },
        patch: {
            isSpotlight: false,
            isChatLocked: true,
            $push: {
                timeline: {
                    status: listingStatus_1.LISTING_STATUS.EXPIRED,
                    timestamp: new Date(),
                    reason: 'Expired by moderation',
                },
            },
        },
    });
    await logFn('LISTING_EXPIRE', 'Ad', id, {});
    return updated;
};
exports.adminExpireListing = adminExpireListing;
const adminExtendListing = async (id, actorId, logFn) => {
    validateListingId(id);
    const listing = await getListingForMutation(id);
    const newExpiresAt = await (0, AdStatusService_1.computeActiveExpiry)(listing.listingType || listingType_1.LISTING_TYPE.AD);
    const now = new Date();
    const isExpired = listing.status === listingStatus_1.LISTING_STATUS.EXPIRED;
    let updated;
    if (isExpired) {
        updated = await (0, StatusMutationService_1.mutateStatus)({
            domain: 'ad',
            entityId: id,
            toStatus: listingStatus_1.LISTING_STATUS.LIVE,
            actor: buildAdminActor(actorId),
            reason: 'Expiry extended by admin',
            metadata: {
                action: 'moderation_approve',
                sourceRoute: '/api/v1/admin/listings/:id/extend',
                listingType: listing.listingType || 'ad',
            },
            patch: {
                approvedAt: now,
                approvedBy: actorId,
                expiresAt: newExpiresAt,
                isChatLocked: false,
                moderationStatus: 'manual_approved',
                $push: {
                    timeline: {
                        status: listingStatus_1.LISTING_STATUS.LIVE,
                        timestamp: now,
                        reason: 'Expiry extended by admin',
                    },
                },
            },
        });
    }
    else {
        updated = await (0, AdMutationService_1.extendListingExpiry)(id, newExpiresAt, listing.status, now);
    }
    await logFn('LISTING_EXTEND', 'Ad', id, { expiresAt: newExpiresAt });
    return updated;
};
exports.adminExtendListing = adminExtendListing;
const adminSoftDeleteListing = async (id, actorId, logFn, hardDelete) => {
    validateListingId(id);
    if (hardDelete === true) {
        throw new AppError_1.AppError('Hard delete is forbidden. Listings must be soft deleted.', 400);
    }
    const listing = await getListingForMutation(id);
    if (listing.isDeleted) {
        const currentListing = await (0, ListingModerationQueryService_1.getModerationListingById)(id);
        return {
            action: 'deleted',
            listing: currentListing || { id, status: listing.status, listingType: listing.listingType || 'ad', isDeleted: true },
            message: 'Listing is already deleted'
        };
    }
    const updated = await (0, StatusMutationService_1.mutateStatus)({
        domain: 'ad',
        entityId: id,
        toStatus: listingStatus_1.LISTING_STATUS.DEACTIVATED,
        actor: buildAdminActor(actorId),
        reason: 'Soft deleted by moderation',
        metadata: {
            action: 'moderation_soft_delete',
            sourceRoute: 'DELETE /api/v1/admin/listings/:id',
        },
        patch: {
            isDeleted: true,
            deletedAt: new Date(),
            isSpotlight: false,
            isChatLocked: true,
            $push: {
                timeline: {
                    status: listingStatus_1.LISTING_STATUS.DEACTIVATED,
                    timestamp: new Date(),
                    reason: 'Soft deleted by moderation',
                },
            },
        },
    });
    await logFn('LISTING_SOFT_DELETE', 'Ad', id, { isDeleted: true });
    return { action: 'deleted', listing: updated, message: 'Listing soft deleted successfully' };
};
exports.adminSoftDeleteListing = adminSoftDeleteListing;
const adminResolveListingReport = async (id, actorId, action, note, logFn) => {
    validateListingId(id);
    await getListingForMutation(id);
    const resolvedAction = action || 'dismiss';
    if (!['dismiss', 'take_down', 'warn_user'].includes(resolvedAction)) {
        throw new AppError_1.AppError('Invalid action. Allowed: dismiss, take_down, warn_user', 400);
    }
    let listingResult = await (0, ListingModerationQueryService_1.getModerationListingById)(id);
    if (resolvedAction === 'take_down') {
        listingResult = await (0, StatusMutationService_1.mutateStatus)({
            domain: 'ad',
            entityId: id,
            toStatus: listingStatus_1.LISTING_STATUS.REJECTED,
            actor: buildAdminActor(actorId),
            reason: note || 'Taken down from reports queue',
            metadata: {
                action: 'moderation_report_take_down',
                sourceRoute: '/api/v1/admin/listings/:id/report-resolve',
            },
            patch: {
                rejectionReason: note || 'Taken down from reports queue',
                moderatorId: actorId,
            },
        });
    }
    const listingObjectId = new mongoose_1.default.Types.ObjectId(id);
    const resolvedStatus = resolvedAction === 'dismiss'
        ? reportStatus_1.REPORT_STATUS.DISMISSED
        : reportStatus_1.REPORT_STATUS.RESOLVED;
    const reportResult = await (0, ReportService_1.bulkResolveReports)(listingObjectId, resolvedStatus, note, actorId);
    await logFn('LISTING_REPORT_RESOLVE', 'Ad', id, {
        action: resolvedAction,
        note,
        resolvedReports: reportResult.modifiedCount,
    });
    return listingResult;
};
exports.adminResolveListingReport = adminResolveListingReport;
const adminGetListingCounts = async (listingTypeRaw) => {
    const listingType = resolveListingTypeFilter(listingTypeRaw);
    return (0, ListingModerationQueryService_1.getModerationCounts)(listingType);
};
exports.adminGetListingCounts = adminGetListingCounts;
//# sourceMappingURL=AdminListingsService.js.map