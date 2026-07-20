import mongoose from 'mongoose';
import { LISTING_STATUS, LISTING_TYPE, REPORT_STATUS } from '@esparex/contracts';
import type { ListingTypeValue } from '@esparex/contracts';
import { AppError } from '../../../../../utils/AppError';
import { createAd } from '../../ad/AdOrchestrator';
import { updateAdTransactional, extendListingExpiry } from '../../mutations/AdMutationService';
import { bulkResolveReports } from '../../../../../services/ReportService';
import { mutateStatus } from '../../../../../services/lifecycle/StatusMutationService';
import { computeActiveExpiry } from '../../../../../services/lifecycle/AdStatusService';
import { getModerationListingById } from '../ListingModerationQueryService';
import type { AdminLogFn } from './types';
import {
    parseDuplicateBypassPayload,
    sanitizeDuplicateBypassPayload,
    validateDuplicateBypass,
    buildAdminActor,
    validateListingId,
    getListingForMutation,
} from './helpers';

export const adminCreateListing = async (actorId: string, body: unknown, logFn: AdminLogFn) => {
    const safeBody = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
    const { allowDuplicateBypass, duplicateBypassReason } = parseDuplicateBypassPayload(safeBody);
    validateDuplicateBypass(allowDuplicateBypass, duplicateBypassReason);
    const payload = sanitizeDuplicateBypassPayload(safeBody);

    const ad = await createAd(payload, {
        actor: 'ADMIN', authUserId: actorId, sellerId: actorId, allowQuotaBypass: true,
    });
    if (!ad) throw new AppError('Failed to create listing', 500);
    const createdAdId = ((ad as unknown as { _id?: unknown })._id ?? '').toString();
    if (!createdAdId) throw new AppError('Created listing id is missing', 500);

    await logFn('CREATE_LISTING', 'Ad', createdAdId, { ...payload, allowDuplicateBypass, duplicateBypassReason: allowDuplicateBypass ? duplicateBypassReason : undefined });
    await logFn('SLOT_QUOTA_BYPASS', 'Ad', createdAdId, { via: 'adminCreateListing', reason: 'Admin quota bypass — admin actor', adminId: actorId, allowDuplicateBypass, duplicateBypassReason: allowDuplicateBypass ? duplicateBypassReason : undefined });
    return ad;
};

export const adminUpdateListing = async (id: string, actorId: string, body: unknown, logFn: AdminLogFn) => {
    validateListingId(id);
    const safeBody = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
    const { allowDuplicateBypass, duplicateBypassReason } = parseDuplicateBypassPayload(safeBody);
    validateDuplicateBypass(allowDuplicateBypass, duplicateBypassReason);
    const payload = sanitizeDuplicateBypassPayload(safeBody);
    const restPayload = { ...payload };
    delete restPayload.status;
    delete restPayload.rejectionReason;

    const updatedAd = await updateAdTransactional({
        adId: id, patch: restPayload,
        context: { actor: 'ADMIN', authUserId: actorId, sellerId: actorId, allowQuotaBypass: true, allowDuplicateBypass, duplicateBypassReason: allowDuplicateBypass ? duplicateBypassReason : undefined },
    });

    await logFn('UPDATE_LISTING', 'Ad', id, { ...restPayload, allowDuplicateBypass, duplicateBypassReason: allowDuplicateBypass ? duplicateBypassReason : undefined });
    await logFn('SLOT_QUOTA_BYPASS', 'Ad', id, { via: 'adminUpdateListing', reason: 'Admin quota bypass — admin actor', adminId: actorId, allowDuplicateBypass, duplicateBypassReason: allowDuplicateBypass ? duplicateBypassReason : undefined });
    return updatedAd;
};

export const adminApproveListing = async (id: string, actorId: string, logFn: AdminLogFn, reviewVersion?: number) => {
    validateListingId(id);
    const listing = await getListingForMutation(id);
    if (typeof reviewVersion === 'number' && typeof listing.reviewVersion === 'number' && reviewVersion !== listing.reviewVersion) {
        throw new AppError('Conflict: listing was edited while under review', 409);
    }
    const approvedAt = new Date();
    const expiresAt = await computeActiveExpiry((listing.listingType as ListingTypeValue) || LISTING_TYPE.AD);
    const updated = await mutateStatus({
        domain: 'ad', entityId: id, toStatus: LISTING_STATUS.LIVE, actor: buildAdminActor(actorId),
        reason: 'Approved by moderation',
        metadata: { action: 'moderation_approve', sourceRoute: '/api/v1/admin/listings/:id/approve', listingType: listing.listingType || 'ad' },
        patch: { moderatorId: actorId, approvedAt, approvedBy: actorId, expiresAt, expiryWarningSentAt: null, expiryWarningCount: 0, lastExpiryWarningChannel: null, moderationStatus: 'manual_approved', rejectionReason: undefined, $push: { timeline: { status: LISTING_STATUS.LIVE, timestamp: approvedAt, reason: 'Approved by moderation' } } },
    });
    await logFn('LISTING_APPROVE', 'Ad', id, { status: LISTING_STATUS.LIVE });
    return updated;
};

export const adminRejectListing = async (id: string, actorId: string, rejectionReason: string, logFn: AdminLogFn) => {
    validateListingId(id);
    if (!rejectionReason || !rejectionReason.trim()) throw new AppError('Rejection reason is required', 400);
    await getListingForMutation(id);
    const updated = await mutateStatus({
        domain: 'ad', entityId: id, toStatus: LISTING_STATUS.REJECTED, actor: buildAdminActor(actorId),
        reason: rejectionReason,
        metadata: { action: 'moderation_reject', sourceRoute: '/api/v1/admin/listings/:id/reject' },
        patch: { rejectionReason, moderatorId: actorId, moderationStatus: 'rejected', $push: { timeline: { status: LISTING_STATUS.REJECTED, timestamp: new Date(), reason: rejectionReason } } },
    });
    await logFn('LISTING_REJECT', 'Ad', id, { rejectionReason });
    return updated;
};

export const adminDeactivateListing = async (id: string, actorId: string, logFn: AdminLogFn) => {
    validateListingId(id);
    const listing = await getListingForMutation(id);
    if (listing.status === LISTING_STATUS.DEACTIVATED) {
        const currentListing = await getModerationListingById(id);
        return { action: 'deactivated', listing: currentListing || { id, status: LISTING_STATUS.DEACTIVATED, listingType: listing.listingType || 'ad' }, message: 'Listing is already deactivated' };
    }
    const updated = await mutateStatus({
        domain: 'ad', entityId: id, toStatus: LISTING_STATUS.DEACTIVATED, actor: buildAdminActor(actorId),
        reason: 'Deactivated by moderation',
        metadata: { action: 'moderation_deactivate', sourceRoute: '/api/v1/admin/listings/:id/deactivate' },
        patch: { isSpotlight: false, isChatLocked: true, $push: { timeline: { status: LISTING_STATUS.DEACTIVATED, timestamp: new Date(), reason: 'Deactivated by moderation' } } },
    });
    await logFn('LISTING_DEACTIVATE', 'Ad', id, {});
    return { action: 'deactivated', listing: updated, message: 'Listing deactivated successfully' };
};

export const adminExpireListing = async (id: string, actorId: string, logFn: AdminLogFn) => {
    validateListingId(id);
    await getListingForMutation(id);
    const updated = await mutateStatus({
        domain: 'ad', entityId: id, toStatus: LISTING_STATUS.EXPIRED, actor: buildAdminActor(actorId),
        reason: 'Expired by moderation',
        metadata: { action: 'moderation_expire', sourceRoute: '/api/v1/admin/listings/:id/expire' },
        patch: { isSpotlight: false, isChatLocked: true, $push: { timeline: { status: LISTING_STATUS.EXPIRED, timestamp: new Date(), reason: 'Expired by moderation' } } },
    });
    await logFn('LISTING_EXPIRE', 'Ad', id, {});
    return updated;
};

export const adminExtendListing = async (id: string, actorId: string, logFn: AdminLogFn) => {
    validateListingId(id);
    const listing = await getListingForMutation(id);
    const newExpiresAt = await computeActiveExpiry((listing.listingType as ListingTypeValue) || LISTING_TYPE.AD);
    const now = new Date();
    const isExpired = listing.status === LISTING_STATUS.EXPIRED;
    let updated;
    if (isExpired) {
        updated = await mutateStatus({
            domain: 'ad', entityId: id, toStatus: LISTING_STATUS.LIVE, actor: buildAdminActor(actorId),
            reason: 'Expiry extended by admin',
            metadata: { action: 'moderation_approve', sourceRoute: '/api/v1/admin/listings/:id/extend', listingType: listing.listingType || 'ad' },
            patch: { approvedAt: now, approvedBy: actorId, expiresAt: newExpiresAt, isChatLocked: false, moderationStatus: 'manual_approved', $push: { timeline: { status: LISTING_STATUS.LIVE, timestamp: now, reason: 'Expiry extended by admin' } } },
        });
    } else {
        updated = await extendListingExpiry(id, newExpiresAt, listing.status, now);
    }
    await logFn('LISTING_EXTEND', 'Ad', id, { expiresAt: newExpiresAt });
    return updated;
};

export const adminSoftDeleteListing = async (id: string, actorId: string, logFn: AdminLogFn, hardDelete?: boolean) => {
    validateListingId(id);
    if (hardDelete === true) throw new AppError('Hard delete is forbidden. Listings must be soft deleted.', 400);
    const listing = await getListingForMutation(id);
    if (listing.isDeleted) {
        const currentListing = await getModerationListingById(id);
        return { action: 'deleted', listing: currentListing || { id, status: listing.status, listingType: listing.listingType || 'ad', isDeleted: true }, message: 'Listing is already deleted' };
    }
    const updated = await mutateStatus({
        domain: 'ad', entityId: id, toStatus: LISTING_STATUS.DEACTIVATED, actor: buildAdminActor(actorId),
        reason: 'Soft deleted by moderation',
        metadata: { action: 'moderation_soft_delete', sourceRoute: 'DELETE /api/v1/admin/listings/:id' },
        patch: { isDeleted: true, deletedAt: new Date(), isSpotlight: false, isChatLocked: true, $push: { timeline: { status: LISTING_STATUS.DEACTIVATED, timestamp: new Date(), reason: 'Soft deleted by moderation' } } },
    });
    await logFn('LISTING_SOFT_DELETE', 'Ad', id, { isDeleted: true });
    return { action: 'deleted', listing: updated, message: 'Listing soft deleted successfully' };
};

export const adminResolveListingReport = async (id: string, actorId: string, action: string, note: string | undefined, logFn: AdminLogFn) => {
    validateListingId(id);
    await getListingForMutation(id);
    const resolvedAction = action || 'dismiss';
    if (!['dismiss', 'take_down', 'warn_user'].includes(resolvedAction)) throw new AppError('Invalid action. Allowed: dismiss, take_down, warn_user', 400);
    let listingResult = await getModerationListingById(id);
    if (resolvedAction === 'take_down') {
        listingResult = await mutateStatus({
            domain: 'ad', entityId: id, toStatus: LISTING_STATUS.REJECTED, actor: buildAdminActor(actorId),
            reason: note || 'Taken down from reports queue',
            metadata: { action: 'moderation_report_take_down', sourceRoute: '/api/v1/admin/listings/:id/report-resolve' },
            patch: { rejectionReason: note || 'Taken down from reports queue', moderatorId: actorId },
        });
    }
    const listingObjectId = new mongoose.Types.ObjectId(id);
    const resolvedStatus = resolvedAction === 'dismiss' ? REPORT_STATUS.DISMISSED : REPORT_STATUS.RESOLVED;
    const reportResult = await bulkResolveReports(listingObjectId, resolvedStatus, note, actorId);
    await logFn('LISTING_REPORT_RESOLVE', 'Ad', id, { action: resolvedAction, note, resolvedReports: reportResult.modifiedCount });
    return listingResult;
};
