import { pLimit } from '../../utils/pLimit';
import Business from '../../models/Business';
import { ACTOR_TYPE } from '@esparex/contracts';
import { AppError } from '../../utils/AppError';
import type { AdminLogFn } from '../AdminListingsService';
import * as businessLifecycleService from '../business/BusinessLifecycleService';
import * as businessUtils from '../business/BusinessUtils';
import { findBusinessForAdmin, cascadeExpireBusinessListings, approveAdminBusiness, rejectAdminBusiness, expireAdminBusiness } from './business';
import { normalizeLocation } from '../location/LocationNormalizer';
import logger from '../../utils/logger';
import { dispatchTemplatedNotification } from '../NotificationService';

export { approveAdminBusiness, rejectAdminBusiness, expireAdminBusiness };

export const suspendAdminBusiness = async (id: string, reason: string, actorId: string, logFn: AdminLogFn) => {
    const finalReason = reason || 'Suspended by admin';
    const { mutateStatus } = await import('../lifecycle/StatusMutationService');
    const { BUSINESS_STATUS } = await import('@esparex/contracts');
    const business = await mutateStatus({ domain: 'business', entityId: id, toStatus: BUSINESS_STATUS.SUSPENDED, actor: { type: ACTOR_TYPE.ADMIN, id: actorId }, reason: finalReason, patch: { rejectionReason: finalReason } });
    if (!business) throw new AppError('Business not found', 404);
    await logFn('SUSPEND_BUSINESS', 'Business', id, { reason: finalReason });
    return business;
};

export const updateAdminBusinessFields = async (id: string, rawBody: Record<string, unknown>, actorId: string, logFn: AdminLogFn) => {
    const allowedFields = ['name', 'description', 'mobile', 'email', 'website', 'gstNumber', 'registrationNumber', 'location', 'businessTypes'];
    const patch: Record<string, unknown> = {};
    for (const field of allowedFields) { if (Object.prototype.hasOwnProperty.call(rawBody, field)) patch[field] = rawBody[field]; }
    if (Object.keys(patch).length === 0) throw new AppError('No valid fields provided for update', 400);
    const existingBusiness = await findBusinessForAdmin(id);
    if (!existingBusiness) throw new AppError('Business not found', 404);
    if (patch.location && typeof patch.location === 'object' && !Array.isArray(patch.location)) {
        const incoming = patch.location as Record<string, unknown>;
        const bizDoc = existingBusiness as any;
        const current = bizDoc.location;
        const normalized = await normalizeLocation({ locationId: incoming.locationId || bizDoc.locationId, city: incoming.city || current?.city, state: incoming.state || current?.state, country: incoming.country || current?.country || 'India', display: incoming.display || incoming.address, coordinates: incoming.coordinates, address: incoming.address, pincode: incoming.pincode || current?.pincode });
        const resolved = businessUtils.buildBusinessLocationPayload({ currentLocation: current, incomingLocation: incoming, normalizedLocation: normalized, fallbackLocationId: bizDoc.locationId });
        patch.location = resolved.location;
        if (resolved.locationId) patch.locationId = resolved.locationId;
    }
    const business = await Business.findByIdAndUpdate(id, { $set: patch }, { new: true, runValidators: true }).populate('userId');
    if (!business) throw new AppError('Business not found', 404);
    await logFn('UPDATE_BUSINESS', 'Business', id, { patch });
    return business;
};

export const renewAdminBusiness = async (id: string, actorId: string, logFn: AdminLogFn) => {
    const business = await businessLifecycleService.renewBusiness(id, { type: ACTOR_TYPE.ADMIN, id: actorId }) as any;
    if (!business) throw new AppError('Business not found', 404);
    await logFn('RENEW_BUSINESS', 'Business', id, { expiresAt: business.expiresAt });
    await dispatchTemplatedNotification(business.userId.toString(), 'BUSINESS_STATUS', 'BUSINESS_RENEWED', { name: business.name, expiresAt: business.expiresAt?.toLocaleDateString() }, { businessId: id, status: 'live' });
    return business;
};

export const deleteAdminBusiness = async (id: string, actorId: string, logFn: AdminLogFn) => {
    const business = await findBusinessForAdmin(id);
    if (!business) throw new AppError('Business not found', 404);
    const businessName = business.name; const userId = business.userId.toString();
    const actor = { type: ACTOR_TYPE.ADMIN, id: actorId };
    const cc = await cascadeExpireBusinessListings(business._id, actor, 'Cascaded from business deletion');
    const deleted = await businessLifecycleService.softDeleteBusiness(id);
    if (!deleted) throw new AppError('Business not found', 404);
    await logFn('DELETE_BUSINESS', 'Business', id, { businessName, cascadedListings: cc });
    await dispatchTemplatedNotification(userId, 'BUSINESS_STATUS', 'BUSINESS_REMOVED', { name: businessName }, { businessId: id, status: 'deleted' });
    return true;
};

const ADMIN_BULK_CONCURRENCY = 5;

const execBulk = async (ids: string[], actionName: string, fn: (id: string) => Promise<unknown>): Promise<number> => {
    if (!Array.isArray(ids) || !ids.length) return 0;
    const limit = pLimit(ADMIN_BULK_CONCURRENCY);
    const results = await Promise.all(ids.map(id =>
        limit(async () => {
            try { await fn(id); return true; }
            catch (err) { logger.error(`Bulk ${actionName} failed for business ${id}:`, err); return false; }
        })
    ));
    return results.filter(Boolean).length;
};

export const adminBulkApproveBusinesses = async (ids: string[], actorId: string, logFn: AdminLogFn) => execBulk(ids, 'approve', (id) => approveAdminBusiness(id as any, actorId, logFn) as any);
export const adminBulkRejectBusinesses = async (ids: string[], reason: string, actorId: string, logFn: AdminLogFn) => execBulk(ids, 'reject', (id) => rejectAdminBusiness(id as any, reason, actorId, logFn) as any);
export const adminBulkDeactivateBusinesses = async (ids: string[], actorId: string, logFn: AdminLogFn) => execBulk(ids, 'deactivate', (id) => suspendAdminBusiness(id, 'Deactivated by admin', actorId, logFn));
export const adminBulkExpireBusinesses = async (ids: string[], actorId: string, logFn: AdminLogFn) => execBulk(ids, 'expire', (id) => expireAdminBusiness(id as any, actorId, logFn) as any);
export const adminBulkRenewBusinesses = async (ids: string[], actorId: string, logFn: AdminLogFn) => execBulk(ids, 'renew', (id) => renewAdminBusiness(id, actorId, logFn));

export const adminBulkResendBusinessWarnings = async (ids: string[], actorId: string, logFn: AdminLogFn) => {
    if (!Array.isArray(ids) || ids.length === 0) throw new AppError('A non-empty list of business IDs is required', 400);
    const businesses = await Business.find({ _id: { $in: ids } });
    const bizById = new Map(businesses.map(b => [b._id.toString(), b]));
    const results: Array<{ id: string; success: boolean; message?: string }> = [];
    const bulkOps: Array<{
        updateOne: {
            filter: { _id: typeof businesses[0]['_id'] };
            update: { $set: Record<string, unknown>; $inc?: { expiryWarningCount: number } };
        };
    }> = [];
    for (const id of ids) {
        const biz = bizById.get(id);
        if (!biz) { results.push({ id, success: false, message: 'Business not found' }); continue; }
        try {
            await dispatchTemplatedNotification(biz.userId.toString(), 'BUSINESS_STATUS', 'BUSINESS_EXPIRY_WARNING_3D', { name: biz.name, date: biz.expiresAt?.toLocaleDateString() || 'N/A' }, { businessId: biz._id.toString() });
            bulkOps.push({ updateOne: { filter: { _id: biz._id }, update: { $set: { expiryWarningSentAt: new Date(), lastExpiryWarningChannel: 'in-app' }, $inc: { expiryWarningCount: 1 } } } });
            await logFn('expiry_warning_resent', 'ExpiryWarning', id, { entityType: 'Business', adminId: actorId });
            results.push({ id, success: true });
        } catch (error) { results.push({ id, success: false, message: error instanceof Error ? error.message : String(error) }); }
    }
    if (bulkOps.length > 0) await Business.bulkWrite(bulkOps, { ordered: false });
    return { processedCount: ids.length, successCount: results.filter(r => r.success).length, errorCount: results.filter(r => !r.success).length, results };
};
