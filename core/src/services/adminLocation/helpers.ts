import mongoose from 'mongoose';
import slugify from 'slugify';
import logger from '../../utils/logger';
import { delCache, invalidateLocationCaches } from '../../utils/redisCache';
import { loadHierarchyMapForLocations, buildLocationSummary, type CanonicalLocationDoc } from '../../utils/locationHierarchy';
import { normalizeLocationResponse } from '../location/LocationNormalizer';

const ADMIN_STATES_CACHE_KEY = 'admin:locations:states';

export const safeSlugify = (text: string): string => slugify(text, { lower: true, strict: true, trim: true });

export const toScopeQuery = (locationIds: mongoose.Types.ObjectId[] | null) => {
    if (locationIds === undefined || locationIds === null) return {};
    if (locationIds.length === 0) return { _id: { $in: [] as mongoose.Types.ObjectId[] } };
    return { $or: [{ _id: { $in: locationIds } }, { path: { $in: locationIds } }] };
};

export const hydrateLocationResponses = async (locations: CanonicalLocationDoc[]) => {
    const hierarchyMap = await loadHierarchyMapForLocations(locations);
    return locations.map((loc) => {
        const summary = buildLocationSummary(loc, hierarchyMap);
        return normalizeLocationResponse({ ...loc, name: loc.name || summary.name, city: summary.city, district: summary.district, state: summary.state, country: summary.country });
    }).filter((loc): loc is NonNullable<typeof loc> => Boolean(loc));
};

export const invalidateLocationStateCache = async () => {
    try { await Promise.all([delCache(ADMIN_STATES_CACHE_KEY), invalidateLocationCaches()]); }
    catch (error) { logger.warn('Failed to invalidate admin location states cache', { error: error instanceof Error ? error.message : String(error) }); }
};

export const parsePaginationParams = (query: { page?: unknown; limit?: unknown }) => {
    const page = Math.max(1, parseInt(String(query.page ?? '1')) || 1);
    const limit = Math.max(1, Math.min(parseInt(String(query.limit ?? '20')) || 20, 100));
    return { page, limit, skip: (page - 1) * limit };
};

export { ADMIN_STATES_CACHE_KEY };
