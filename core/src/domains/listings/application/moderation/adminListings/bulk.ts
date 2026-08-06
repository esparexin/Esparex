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
    return executeBulkWarningOperation(ids, actorId, logFn, {
        notificationTemplate: 'LISTING_EXPIRY_WARNING_3D',
        getNotificationData: (ad) => ({ title: ad.title, date: ad.expiresAt?.toLocaleDateString() || 'N/A' }),
        getNotificationOptions: (ad) => ({ adId: ad._id.toString() }),
        updateSet: { expiryWarningSentAt: new Date(), lastExpiryWarningChannel: 'in-app' },
        updateInc: { expiryWarningCount: 1 },
        logDomain: 'ExpiryWarning',
        getLogData: (adminId) => ({ entityType: 'Ad', adminId })
    });
};

export const adminBulkResendSpotlightWarnings = async (ids: string[], actorId: string, logFn: AdminLogFn) => {
    return executeBulkWarningOperation(ids, actorId, logFn, {
        validate: (ad) => (!ad.isSpotlight ? 'Listing is not in spotlight' : null),
        notificationTemplate: 'SPOTLIGHT_EXPIRY_WARNING_3D',
        getNotificationData: (ad) => ({ title: ad.title, date: ad.spotlightExpiresAt?.toLocaleDateString() || 'N/A' }),
        getNotificationOptions: (ad) => ({ adId: ad._id.toString(), type: 'spotlight' }),
        updateSet: { spotlightWarningSentAt: new Date(), lastExpiryWarningChannel: 'in-app' },
        updateInc: { spotlightWarningCount: 1 },
        logDomain: 'SpotlightPromotion',
        getLogData: (adminId) => ({ type: 'spotlight', adminId })
    });
};

type AdDocument = InstanceType<typeof Ad>;

const executeBulkWarningOperation = async (
    ids: string[],
    actorId: string,
    logFn: AdminLogFn,
    config: {
        validate?: (ad: AdDocument) => string | null;
        notificationTemplate: string;
        getNotificationData: (ad: AdDocument) => Record<string, unknown>;
        getNotificationOptions: (ad: AdDocument) => Record<string, unknown>;
        updateSet: Record<string, unknown>;
        updateInc: Record<string, number>;
        logDomain: string;
        getLogData: (actorId: string) => Record<string, unknown>;
    }
) => {
    if (!Array.isArray(ids) || ids.length === 0) throw new AppError('A non-empty list of listing IDs is required', 400);
    const ads = await Ad.find({ _id: { $in: ids } });
    const adsById = new Map(ads.map(a => [a._id.toString(), a]));
    const results: Array<{ id: string; success: boolean; message?: string }> = [];
    const bulkOps: Array<{
        updateOne: {
            filter: { _id: typeof ads[0]['_id'] };
            update: { $set: Record<string, unknown>; $inc?: Record<string, number> };
        };
    }> = [];

    for (const id of ids) {
        const ad = adsById.get(id);
        if (!ad) { results.push({ id, success: false, message: 'Listing not found' }); continue; }
        
        if (config.validate) {
            const errorMsg = config.validate(ad);
            if (errorMsg) { results.push({ id, success: false, message: errorMsg }); continue; }
        }

        try {
            await dispatchTemplatedNotification(
                ad.sellerId.toString(),
                'SYSTEM',
                config.notificationTemplate,
                config.getNotificationData(ad),
                config.getNotificationOptions(ad)
            );
            
            bulkOps.push({
                updateOne: {
                    filter: { _id: ad._id },
                    update: { $set: config.updateSet, $inc: config.updateInc }
                }
            });
            
            await logFn('expiry_warning_resent', config.logDomain as any, id, config.getLogData(actorId));
            results.push({ id, success: true });
        } catch (error) {
            results.push({ id, success: false, message: error instanceof Error ? error.message : String(error) });
        }
    }

    if (bulkOps.length > 0) await Ad.bulkWrite(bulkOps, { ordered: false });
    return { processedCount: ids.length, successCount: results.filter(r => r.success).length, errorCount: results.filter(r => !r.success).length, results };
};
