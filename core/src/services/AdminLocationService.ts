import mongoose from 'mongoose';
import {
    findLocationById,
    findLocationByIdLean,
    findActiveParentById,
    locationExists,
    findLocationParent,
    findDuplicateLocation,
    getDistinctStateLocations,
    getLocationsPaginated,
    getModerationQueuePaginated,
    countAdsForLocation,
    countUsersForLocation,
} from './location/LocationQueryService';
import {
    generateLocationId,
    createLocationRecord,
    saveLocation,
    softDeleteLocation,
} from './location/LocationMutationService';
import {
    getAllGeofences,
    createGeofenceRecord,
    updateGeofenceById,
    deleteGeofenceById,
} from './location/GeofenceService';
import { updateLocationStats as runStatsUpdate } from '../workers/locationAnalyticsWorker';
import type { AdminLogFn } from './AdminListingsService';
import slugify from 'slugify';
import { escapeRegExp } from '../utils/stringUtils';
import logger from '../utils/logger';
import { delCache, getCache, setCache, invalidateLocationCaches } from '../utils/redisCache';
import { LOCATION_STATUS } from '../constants/enums/locationStatus';
import {
    normalizeLocationResponse,
    normalizeCoordinates
} from './location/LocationNormalizer';
import { reverseGeocode as getReverseGeocodeMatch } from './location/ReverseGeocodeService';
import { dispatchTemplatedNotification } from './NotificationService';
import {
    buildLocationSummary,
    buildHierarchyPath,
    loadHierarchyMapForLocations,
    resolveParentLocation,
    resolveLocationScope,
    resolveLocationSummary,
    asString as resolveStringField,
    CanonicalLocationDoc
} from '../utils/locationHierarchy';
import { AppError } from '../utils/AppError';

// --- Helpers ---

const safeSlugify = (text: string): string => {
    return slugify(text, { lower: true, strict: true, trim: true });
};

const ADMIN_STATES_CACHE_KEY = 'admin:locations:states';
const ADMIN_STATES_CACHE_TTL_SECONDS = 300;

const toScopeQuery = (locationIds: mongoose.Types.ObjectId[] | null) => {
    if (locationIds === undefined || locationIds === null) return {};
    if (locationIds.length === 0) {
        return { _id: { $in: [] as mongoose.Types.ObjectId[] } };
    }

    return {
        $or: [
            { _id: { $in: locationIds } },
            { path: { $in: locationIds } },
        ],
    };
};

const hydrateLocationResponses = async (locations: CanonicalLocationDoc[]) => {
    const hierarchyMap = await loadHierarchyMapForLocations(locations);

    return locations
        .map((location) => {
            const summary = buildLocationSummary(location, hierarchyMap);
            return normalizeLocationResponse({
                ...location,
                name: location.name || summary.name,
                city: summary.city,
                district: summary.district,
                state: summary.state,
                country: summary.country,
            });
        })
        .filter((location): location is NonNullable<ReturnType<typeof normalizeLocationResponse>> => Boolean(location));
};

const invalidateLocationStateCache = async () => {
    try {
        await Promise.all([
            delCache(ADMIN_STATES_CACHE_KEY),
            invalidateLocationCaches()
        ]);
    } catch (error) {
        logger.warn('Failed to invalidate admin location states cache', {
            error: error instanceof Error ? error.message : String(error)
        });
    }
};

// --- Service Methods ---

export interface AdminLocationPaginationQuery {
    page?: unknown;
    limit?: unknown;
    q?: unknown;
    status?: unknown;
    state?: unknown;
    level?: unknown;
}

const parsePaginationParams = (query: AdminLocationPaginationQuery) => {
    const page = Math.max(1, parseInt(String(query.page ?? '1')) || 1);
    const limit = Math.max(1, Math.min(parseInt(String(query.limit ?? '20')) || 20, 100));
    const skip = (page - 1) * limit;
    return { page, limit, skip };
};

export interface AdminCreateLocationBody {
    name?: unknown;
    state?: unknown;
    country?: unknown;
    level?: unknown;
    parentId?: unknown;
    latitude?: unknown;
    longitude?: unknown;
    isActive?: unknown;
    city?: unknown;
    district?: unknown;
    [key: string]: unknown;
}

export const adminCreateStateLocation = async (body: AdminCreateLocationBody) => {
    const stateName = resolveStringField(body.name) || resolveStringField(body.state);
    if (!stateName) {
        throw new AppError('State name is required.', 400);
    }
    return adminCreateLocation({
        ...body,
        name: stateName,
        level: 'state',
        parentId: null,
    });
};

export const adminCreateCityLocation = async (body: AdminCreateLocationBody) => {
    const stateId = resolveStringField(body.stateId);
    const cityName = resolveStringField(body.name) || resolveStringField(body.city);

    if (!stateId) throw new AppError('stateId is required.', 400);
    if (!cityName) throw new AppError('City name is required.', 400);
    if (!mongoose.Types.ObjectId.isValid(stateId)) {
        throw new AppError('Invalid stateId.', 400);
    }

    const stateAnchor = await findLocationByIdLean<CanonicalLocationDoc>(stateId, '_id name country level parentId path');
    const stateSummary = await resolveLocationSummary(stateAnchor);
    if (!stateSummary?.state) {
        throw new AppError('State not found.', 404);
    }

    return adminCreateLocation({
        ...body,
        name: cityName,
        country: resolveStringField(body.country) || stateSummary.country || 'Unknown',
        level: 'city',
        parentId: stateId,
    });
};

export const adminCreateAreaLocation = async (body: AdminCreateLocationBody) => {
    const cityId = resolveStringField(body.cityId);
    const areaName = resolveStringField(body.name) || resolveStringField(body.area);

    if (!cityId) throw new AppError('cityId is required.', 400);
    if (!areaName) throw new AppError('Area name is required.', 400);
    if (!mongoose.Types.ObjectId.isValid(cityId)) {
        throw new AppError('Invalid cityId.', 400);
    }

    const cityAnchor = await findLocationByIdLean<CanonicalLocationDoc>(cityId, '_id name country level parentId path');
    const citySummary = await resolveLocationSummary(cityAnchor);
    if (!citySummary?.city || !citySummary?.state) {
        throw new AppError('City not found.', 404);
    }

    return adminCreateLocation({
        ...body,
        name: areaName,
        country: resolveStringField(body.country) || citySummary.country || 'Unknown',
        level: 'area',
        parentId: cityId,
    });
};

export const adminGetDistinctStates = async () => {
    const cachedStates = await getCache<string[]>(ADMIN_STATES_CACHE_KEY);
    if (Array.isArray(cachedStates)) {
        return cachedStates;
    }

    const states = await getDistinctStateLocations();
    const sorted = states
        .map((entry) => resolveStringField(entry.name))
        .filter((value): value is string => Boolean(value))
        .sort((a, b) => a.localeCompare(b));

    await setCache(ADMIN_STATES_CACHE_KEY, sorted, ADMIN_STATES_CACHE_TTL_SECONDS);
    return sorted;
};

export const adminReverseGeocode = async (latRaw: string, lngRaw: string) => {
    const lat = parseFloat(latRaw);
    const lng = parseFloat(lngRaw);

    if (isNaN(lat) || isNaN(lng)) {
        throw new AppError('Coordinates (lat, lng) are required.', 400);
    }

    return getReverseGeocodeMatch(lat, lng);
};

export const adminGetAllLocations = async (query: AdminLocationPaginationQuery) => {
    const { page, limit, skip } = parsePaginationParams(query);
    const search = typeof query.q === 'string' ? query.q.trim() : undefined;
    const status = typeof query.status === 'string' ? query.status : undefined;
    const state = typeof query.state === 'string' ? query.state : undefined;
    const level = typeof query.level === 'string' ? query.level : undefined;

    const dbQuery: Record<string, unknown> = {};

    if (status === 'active') dbQuery.isActive = true;
    if (status === 'inactive') dbQuery.isActive = false;

    if (level && level !== 'all') dbQuery.level = level;

    if (search) {
        const escaped = escapeRegExp(search);
        dbQuery.$or = [
            { name: { $regex: escaped, $options: 'i' } },
            { normalizedName: { $regex: escaped, $options: 'i' } },
            { slug: { $regex: escaped, $options: 'i' } },
            { aliases: { $regex: escaped, $options: 'i' } },
        ];
    }

    const scope = state && state !== 'all'
        ? await resolveLocationScope({ state })
        : { locationIds: null as mongoose.Types.ObjectId[] | null };
    Object.assign(dbQuery, toScopeQuery(scope.locationIds));

    const { locations, total } = await getLocationsPaginated(dbQuery, skip, limit);
    const items = await hydrateLocationResponses(locations as CanonicalLocationDoc[]);

    return { items, total, page, limit };
};

export const adminCreateLocation = async (createBody: AdminCreateLocationBody) => {
    const { country, latitude, longitude, isActive, level, name } = createBody;

    const coords = normalizeCoordinates({ lat: latitude, lng: longitude });
    if (!coords || (coords.coordinates[0] === 0 && coords.coordinates[1] === 0)) {
        throw new AppError('Valid map coordinates are required.', 400);
    }

    const displayName = resolveStringField(name);
    if (!displayName) {
        throw new AppError('Location name is required.', 400);
    }

    const requestedLevel = resolveStringField(level)?.toLowerCase();
    const finalLevel: 'country' | 'state' | 'district' | 'city' | 'area' | 'village' =
        requestedLevel === 'country' ||
            requestedLevel === 'state' ||
            requestedLevel === 'district' ||
            requestedLevel === 'city' ||
            requestedLevel === 'area' ||
            requestedLevel === 'village'
            ? requestedLevel
            : 'city';

    const explicitParentId = resolveStringField(createBody.parentId);
    let parentLocation: { _id: unknown; level?: string; path?: unknown } | null = null;

    if (explicitParentId) {
        if (!/^[a-f\d]{24}$/i.test(explicitParentId)) {
            throw new AppError('Invalid parentId.', 400);
        }
        parentLocation = await findActiveParentById(explicitParentId);
        if (!parentLocation) {
            throw new AppError('Parent location not found.', 404);
        }
    } else {
        parentLocation = await resolveParentLocation({
            level: finalLevel,
            country: resolveStringField(country) || 'Unknown',
            state: resolveStringField(createBody.state),
            district: resolveStringField(createBody.district),
            city: resolveStringField(createBody.city) || displayName
        });
    }

    const parentSummary = parentLocation
        ? await resolveLocationSummary(parentLocation as CanonicalLocationDoc)
        : null;
    const normalizedCountry = resolveStringField(country) || parentSummary?.country || 'Unknown';
    const slug = safeSlugify(
        [displayName, parentSummary?.state, normalizedCountry]
            .filter((part): part is string => Boolean(part))
            .join('-')
    );

    const existing = await findDuplicateLocation(displayName, normalizedCountry, finalLevel, parentLocation?._id);

    if (existing) {
        throw new AppError('Location already exists in this state.', 400);
    }

    const locationId = generateLocationId();
    const location = await createLocationRecord({
        _id: locationId,
        name: displayName,
        country: normalizedCountry,
        coordinates: coords,
        level: finalLevel,
        parentId: parentLocation?._id || null,
        path: buildHierarchyPath(locationId, parentLocation as { _id: mongoose.Types.ObjectId; path?: mongoose.Types.ObjectId[] } | null),
        slug,
        isActive: isActive !== undefined ? isActive : true,
        priority: 0
    });

    await invalidateLocationStateCache();

    const [response] = await hydrateLocationResponses([location.toObject()]);
    return response;
};

export interface AdminUpdateLocationBody {
    name?: unknown;
    country?: unknown;
    level?: unknown;
    parentId?: unknown;
    latitude?: unknown;
    longitude?: unknown;
    isActive?: unknown;
    [key: string]: unknown;
}

export const adminUpdateLocation = async (id: string, updateBody: AdminUpdateLocationBody) => {
    const { country, latitude, longitude, isActive, level, name } = updateBody;
    const nextCountry = resolveStringField(country);
    const nextName = resolveStringField(name);

    const location = await findLocationById(id);
    if (!location) {
        throw new AppError('Location not found', 404);
    }

    if (level) {
        const normalizedLevel = resolveStringField(level)?.toLowerCase();
        if (
            normalizedLevel === 'country' ||
            normalizedLevel === 'state' ||
            normalizedLevel === 'district' ||
            normalizedLevel === 'city' ||
            normalizedLevel === 'area' ||
            normalizedLevel === 'village'
        ) {
            location.level = normalizedLevel;
        }
    }
    if (nextCountry) location.country = nextCountry;
    if (nextName) {
        location.name = nextName;
    }

    const parentIdFromBody = updateBody.parentId;
    const hasParentMutation = parentIdFromBody !== undefined;
    if (hasParentMutation) {
        if (parentIdFromBody === undefined || parentIdFromBody === '') {
            location.parentId = undefined;
        } else {
            const parentId = resolveStringField(parentIdFromBody);
            if (!parentId || !/^[a-f\d]{24}$/i.test(parentId)) {
                throw new AppError('Invalid parentId.', 400);
            }
            const parentExists = await locationExists(parentId);
            if (!parentExists) {
                throw new AppError('Parent location not found.', 404);
            }
            location.parentId = new mongoose.Types.ObjectId(parentId);
        }
    }

    if (latitude !== undefined && longitude !== undefined) {
        const coords = normalizeCoordinates({ lat: latitude, lng: longitude });
        if (!coords || (coords.coordinates[0] === 0 && coords.coordinates[1] === 0)) {
            throw new AppError('Valid map coordinates are required.', 400);
        }
        location.coordinates = coords;
    }
    if (isActive !== undefined) location.isActive = Boolean(isActive);

    if (name || country || level || hasParentMutation) {
        let parentLocation: { _id: mongoose.Types.ObjectId; path?: mongoose.Types.ObjectId[]; country?: string; level?: string } | null = null;
        if (location.parentId) {
            parentLocation = await findLocationParent(location.parentId);
        }
        location.path = buildHierarchyPath(location._id, parentLocation);
        const parentSummary = parentLocation
            ? await resolveLocationSummary(parentLocation)
            : null;

        const slugParts = [
            location.name,
            parentSummary?.state,
            location.country || 'unknown'
        ].filter((part): part is string => Boolean(part));
        location.slug = safeSlugify(slugParts.join('-'));
    }

    await saveLocation(location);
    await invalidateLocationStateCache();

    const [response] = await hydrateLocationResponses([location.toObject()]);
    return response;
};

export const adminToggleLocationStatus = async (id: string) => {
    const location = await findLocationById(id);

    if (!location) {
        throw new AppError('Location not found', 404);
    }

    location.isActive = !location.isActive;
    await saveLocation(location);
    await invalidateLocationStateCache();

    return normalizeLocationResponse(location);
};

export const adminDeleteLocation = async (
    id: string,
    logFn: AdminLogFn
) => {
    const location = await findLocationById(id);

    if (!location) {
        throw new AppError('Location not found', 404);
    }

    const locationSummary = await resolveLocationSummary(location.toObject());

    const adUsageQuery = {
        $or: [
            { 'location.locationId': id }
        ] as Array<Record<string, unknown>>
    };
    const userUsageQuery = {
        $or: [
            { locationId: id }
        ] as Array<Record<string, unknown>>
    };
    if (locationSummary?.city && locationSummary?.state) {
        adUsageQuery.$or.push({ 'location.city': locationSummary.city, 'location.state': locationSummary.state });
        userUsageQuery.$or.push({ 'location.city': locationSummary.city, 'location.state': locationSummary.state });
    }
    const [adsCount, usersCount] = await Promise.all([
        countAdsForLocation(adUsageQuery),
        countUsersForLocation(userUsageQuery)
    ]);

    if (adsCount > 0 || usersCount > 0) {
        throw new AppError(
            `Cannot delete location "${locationSummary?.name || location.name}". It is currently used by ${adsCount} ads and ${usersCount} users. Consider deactivating it instead.`,
            409
        );
    }

    await softDeleteLocation(location);
    await invalidateLocationStateCache();
    await logFn('DELETE_LOCATION', 'Location', id, {
        name: locationSummary?.name || location.name,
        city: locationSummary?.city,
        state: locationSummary?.state
    });

    return true;
};

export const adminGetGeofences = async () => {
    return getAllGeofences();
};

export const adminCreateGeofence = async (
    body: Record<string, unknown>,
    logFn: AdminLogFn
) => {
    const geofence = await createGeofenceRecord(body);
    await logFn('CREATE_GEOFENCE', 'Geofence', (geofence as { _id: { toString(): string } })._id.toString(), { name: (geofence as { name?: string }).name });
    return geofence;
};

export const adminUpdateGeofence = async (
    id: string,
    body: Record<string, unknown>,
    logFn: AdminLogFn
) => {
    const geofence = await updateGeofenceById(id, body);
    if (!geofence) throw new AppError('Geofence not found', 404);
    await logFn('UPDATE_GEOFENCE', 'Geofence', id, { name: (geofence as { name?: string }).name });
    return geofence;
};

export const adminDeleteGeofence = async (
    id: string,
    logFn: AdminLogFn
) => {
    const geofence = await deleteGeofenceById(id);
    if (!geofence) throw new AppError('Geofence not found', 404);
    await logFn('DELETE_GEOFENCE', 'Geofence', id, { name: (geofence as { name?: string }).name });
    return true;
};

export const adminGetModerationQueue = async (query: AdminLocationPaginationQuery) => {
    const { page, limit } = parsePaginationParams(query);
    const { total, locations } = await getModerationQueuePaginated(page, limit);
    return { locations, total, page, limit };
};

export const adminApproveRejectLocation = async (
    id: string,
    status: 'verified' | 'rejected',
    reason: string | undefined,
    logFn: AdminLogFn
) => {
    if (![LOCATION_STATUS.VERIFIED, LOCATION_STATUS.REJECTED].includes(status)) {
        throw new AppError('Invalid status', 400);
    }

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
        const params = { name: locationSummary?.name || location.name, reason };

        dispatchTemplatedNotification(
            userId,
            'SYSTEM',
            templateKey,
            params,
            { locationId: location._id.toString(), status }
        ).catch((notifyError: unknown) =>
            logger.warn('Failed to notify user about location moderation', {
                locationId: String(location._id),
                status,
                error: notifyError instanceof Error ? notifyError.message : String(notifyError)
            })
        );
    }

    return location;
};

export const adminRefreshLocationStats = async (logFn: AdminLogFn) => {
    runStatsUpdate('manual').catch(err =>
        logger.error('Location stats update failed', { error: err instanceof Error ? err.message : String(err) })
    );
    await logFn('REFRESH_STATS', 'System', 'LocationAnalytics', {});
    return true;
};
