import { AppError } from '../../utils/AppError';
import { dispatchTemplatedNotification } from '../NotificationService';
import Ad from '../../models/Ad';
import type { AdminLogFn } from './types';
import {
    adminApproveListing, adminRejectListing, adminDeactivateListing,
    adminExpireListing, adminExtendListing,
} from './mutations';
import { validateListingId } from './helpers';

const executeAdminListingsBulkOperation = async <T>(
    ids: string[],
    actionFn: (id: string) => Promise<T>,
    includeResults: boolean = true
) => {
    if (!Array.isArray(ids) || ids.length === 0) throw new AppError('A non-empty list of listing IDs is required', 400);
    const results: Array<{ id: string; success: boolean; message?: string; statusCode?: number; listing?: unknown }> = [];
    for (const id of ids) {
        try {
            const updated = await actionFn(id);
            results.push({ id, success: true, listing: (updated as any)?.listing || updated });
        } catch (error) {
            results.push({ id, success: false, message: error instanceof Error ? error.message : String(error), statusCode: (error as any).statusCode || 500 });
        }
    }
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

export const adminBulkResendListingWarnings = async (ids: string[], actorId: string, logFn: AdminLogFn) =>
    executeAdminListingsBulkOperation(ids, async (id) => {
        validateListingId(id);
        const ad = await Ad.findById(id);
        if (!ad) throw new AppError('Listing not found', 404);
        await dispatchTemplatedNotification(ad.sellerId.toString(), 'SYSTEM', 'LISTING_EXPIRY_WARNING_3D', { title: ad.title, date: ad.expiresAt?.toLocaleDateString() || 'N/A' }, { adId: ad._id.toString() });
        ad.expiryWarningSentAt = new Date();
        ad.expiryWarningCount = (ad.expiryWarningCount || 0) + 1;
        ad.lastExpiryWarningChannel = 'in-app';
        await ad.save();
        await logFn('expiry_warning_resent', 'ExpiryWarning', id, { entityType: 'Ad', adminId: actorId });
        return null;
    }, true);

export const adminBulkResendSpotlightWarnings = async (ids: string[], actorId: string, logFn: AdminLogFn) =>
    executeAdminListingsBulkOperation(ids, async (id) => {
        validateListingId(id);
        const ad = await Ad.findById(id);
        if (!ad) throw new AppError('Listing not found', 404);
        if (!ad.isSpotlight) throw new AppError('Listing is not in spotlight', 400);
        await dispatchTemplatedNotification(ad.sellerId.toString(), 'SYSTEM', 'SPOTLIGHT_EXPIRY_WARNING_3D', { title: ad.title, date: ad.spotlightExpiresAt?.toLocaleDateString() || 'N/A' }, { adId: ad._id.toString(), type: 'spotlight' });
        ad.spotlightWarningSentAt = new Date();
        ad.spotlightWarningCount = (ad.spotlightWarningCount || 0) + 1;
        await ad.save();
        await logFn('expiry_warning_resent', 'SpotlightPromotion', id, { type: 'spotlight', adminId: actorId });
        return null;
    }, true);
