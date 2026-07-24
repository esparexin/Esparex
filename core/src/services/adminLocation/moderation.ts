import { LOCATION_STATUS } from '@esparex/contracts';
import logger from '../../utils/logger';
import { AppError } from '../../utils/AppError';
import { findLocationById } from '../location/LocationQueryService';
import { getModerationQueuePaginated } from '../location/LocationQueryService';
import { saveLocation } from '../location/LocationMutationService';
import { dispatchTemplatedNotification } from '../../domains/notifications/application/NotificationService';
import { resolveLocationSummary } from '../../utils/locationHierarchy';
import { invalidateLocationStateCache } from './helpers';
import type { AdminLogFn } from '../AdminListingsService';
import type { AdminLocationPaginationQuery } from './types';
import { parsePaginationParams } from './helpers';

export const adminGetModerationQueue = async (query: AdminLocationPaginationQuery) => {
    const { page, limit } = parsePaginationParams(query);
    const { total, locations } = await getModerationQueuePaginated(page, limit);
    return { locations, total, page, limit };
};

export const adminApproveRejectLocation = async (id: string, status: 'verified' | 'rejected', reason: string | undefined, logFn: AdminLogFn) => {
    if (![LOCATION_STATUS.VERIFIED, LOCATION_STATUS.REJECTED].includes(status)) throw new AppError('Invalid status', 400);
    const location = await findLocationById(id);
    if (!location) throw new AppError('Location not found', 404);
    const locationSummary = await resolveLocationSummary(location.toObject());
    location.verificationStatus = status;
    if (status === LOCATION_STATUS.VERIFIED) location.isActive = true;
    await saveLocation(location);
    await invalidateLocationStateCache();
    await logFn('MODERATE_LOCATION', 'Location', id, { status, reason });
    if (location.requestedBy) {
        const userId = location.requestedBy.toString();
        const templateKey = status === LOCATION_STATUS.VERIFIED ? 'LOCATION_APPROVED' : 'LOCATION_REJECTED';
        dispatchTemplatedNotification(userId, 'SYSTEM', templateKey, { name: locationSummary?.name || location.name, reason }, { locationId: location._id.toString(), status }).catch((e: unknown) => logger.warn('Failed to notify user about location moderation', { locationId: String(location._id), status, error: e instanceof Error ? e.message : String(e) }));
    }
    return location;
};

export const adminRefreshLocationStats = async (logFn: AdminLogFn) => {
    const { updateLocationStats } = await import('../../workers/locationAnalyticsWorker');
    updateLocationStats('manual').catch((err: unknown) => logger.error('Location stats update failed', { error: err instanceof Error ? err.message : String(err) }));
    await logFn('REFRESH_STATS', 'System', 'LocationAnalytics', {});
    return true;
};
