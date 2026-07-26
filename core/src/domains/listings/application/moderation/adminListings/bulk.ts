import { pLimit } from '../../../../../utils/pLimit';
import { AppError } from '../../../../../utils/AppError';
import { dispatchTemplatedNotification } from '../../../../notifications/application/NotificationService';
import Ad from '../../../../../models/Ad';
import type { AdminLogFn } from './types';
import {
    adminApproveListing, adminRejectListing, adminDeactivateListing,
    adminExpireListing, adminExtendListing,
} from './mutations';
import { validateListingId } from './helpers';

const ADMIN_BULK_CONCURRENCY = 5;

const executeAdminListingsBulkOperation = async <T>(
    ids: string[],
    actionFn: (id: string) => Promise<T>,
    includeResults: boolean = true
) => {
    if (!Array.isArray(ids) || ids.length === 0) throw new AppError('A non-empty list of listing IDs is required', 400);
    const limit = pLimit(ADMIN_BULK_CONCURRENCY);
    const tasks = ids.map(id =>
        limit(async () => {
            try {
                const updated = await actionFn(id);
                return { id, success: true as const, listing: (updated as any)?.listing || updated };
            } catch (error) {
                return { id, success: false as const, message: error instanceof Error ? error.message : String(error), statusCode: (error as any).statusCode || 500 };
            }
        })
    );
    const results = await Promise.all(tasks);
    const response: any = { processedCount: ids.length, successCount: results.filter(r => r.success).length, errorCount: results.filter(r => !r.success).length };
    if (includeResults) response.results = results;
    return response;
};

export const adminBulkApproveListings = async (ids: string[], actorId: string, logFn: AdminLogFn) =>
    executeAdminListingsBulkOperation(ids, id => adminApproveListing(id, actorId, logFn), true);

export const adminBulkRejectListings = async (ids: string[], actorId: string, rejectionReason: string, logFn: AdminLogFn) => {
    if (!rejectionReason || !rejectionReason.trim()) throw new AppError('Rejection reason is required for bulk rejection', 400);
    return executeAdminListingsBulkOperation(ids, id => adminRejectListing(id, actorId, rejectionReason, logFn), true);
};

export const adminBulkDeactivateListings = async (ids: string[], actorId: string, logFn: AdminLogFn) =>
    executeAdminListingsBulkOperation(ids, id => adminDeactivateListing(id, actorId, logFn), false);

export const adminBulkExpireListings = async (ids: string[], actorId: string, logFn: AdminLogFn) =>
    executeAdminListingsBulkOperation(ids, id => adminExpireListing(id, actorId, logFn), false);

export const adminBulkExtendListings = async (ids: string[], actorId: string, logFn: AdminLogFn) =>
    executeAdminListingsBulkOperation(ids, id => adminExtendListing(id, actorId, logFn), false);

export const adminBulkResendListingWarnings = async (ids: string[], actorId: string, logFn: AdminLogFn) => {
    if (!Array.isArray(ids) || ids.length === 0) throw new AppError('A non-empty list of listing IDs is required', 400);
    const ads = await Ad.find({ _id: { $in: ids } });
    const adsById = new Map(ads.map(a => [a._id.toString(), a]));
    const results: Array<{ id: string; success: boolean; message?: string }> = [];
    const bulkOps: Array<{
        updateOne: {
            filter: { _id: typeof ads[0]['_id'] };
            update: { $set: Record<string, unknown>; $inc?: { expiryWarningCount: number } };
        };
    }> = [];
    for (const id of ids) {
        const ad = adsById.get(id);
        if (!ad) { results.push({ id, success: false, message: 'Listing not found' }); continue; }
        try {
            await dispatchTemplatedNotification(ad.sellerId.toString(), 'SYSTEM', 'LISTING_EXPIRY_WARNING_3D', { title: ad.title, date: ad.expiresAt?.toLocaleDateString() || 'N/A' }, { adId: ad._id.toString() });
            bulkOps.push({ updateOne: { filter: { _id: ad._id }, update: { $set: { expiryWarningSentAt: new Date(), lastExpiryWarningChannel: 'in-app' }, $inc: { expiryWarningCount: 1 } } } });
            await logFn('expiry_warning_resent', 'ExpiryWarning', id, { entityType: 'Ad', adminId: actorId });
            results.push({ id, success: true });
        } catch (error) { results.push({ id, success: false, message: error instanceof Error ? error.message : String(error) }); }
    }
    if (bulkOps.length > 0) await Ad.bulkWrite(bulkOps, { ordered: false });
    return { processedCount: ids.length, successCount: results.filter(r => r.success).length, errorCount: results.filter(r => !r.success).length, results };
};

export const adminBulkResendSpotlightWarnings = async (ids: string[], actorId: string, logFn: AdminLogFn) => {
    if (!Array.isArray(ids) || ids.length === 0) throw new AppError('A non-empty list of listing IDs is required', 400);
    const ads = await Ad.find({ _id: { $in: ids } });
    const adsById = new Map(ads.map(a => [a._id.toString(), a]));
    const results: Array<{ id: string; success: boolean; message?: string }> = [];
    const bulkOps: Array<{
        updateOne: {
            filter: { _id: typeof ads[0]['_id'] };
            update: { $set: Record<string, unknown>; $inc?: { spotlightWarningCount: number } };
        };
    }> = [];
    for (const id of ids) {
        const ad = adsById.get(id);
        if (!ad) { results.push({ id, success: false, message: 'Listing not found' }); continue; }
        if (!ad.isSpotlight) { results.push({ id, success: false, message: 'Listing is not in spotlight' }); continue; }
        try {
            await dispatchTemplatedNotification(ad.sellerId.toString(), 'SYSTEM', 'SPOTLIGHT_EXPIRY_WARNING_3D', { title: ad.title, date: ad.spotlightExpiresAt?.toLocaleDateString() || 'N/A' }, { adId: ad._id.toString(), type: 'spotlight' });
            bulkOps.push({ updateOne: { filter: { _id: ad._id }, update: { $set: { spotlightWarningSentAt: new Date(), lastExpiryWarningChannel: 'in-app' }, $inc: { spotlightWarningCount: 1 } } } });
            await logFn('expiry_warning_resent', 'SpotlightPromotion', id, { type: 'spotlight', adminId: actorId });
            results.push({ id, success: true });
        } catch (error) { results.push({ id, success: false, message: error instanceof Error ? error.message : String(error) }); }
    }
    if (bulkOps.length > 0) await Ad.bulkWrite(bulkOps, { ordered: false });
    return { processedCount: ids.length, successCount: results.filter(r => r.success).length, errorCount: results.filter(r => !r.success).length, results };
};
