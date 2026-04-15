import { Request, Response } from 'express';
import mongoose from 'mongoose';
import {
    findLocationById,
    findLocationByIdLean,
    findActiveParentById,
    locationExists,
    findLocationParent,
    findDuplicateLocation,
    getDistinctStateLocations,
    generateLocationId,
    createLocationRecord,
    saveLocation,
    softDeleteLocation,
    getLocationsPaginated,
    getModerationQueuePaginated,
    countAdsForLocation,
    countUsersForLocation,
    getAllGeofences,
    createGeofenceRecord,
    updateGeofenceById,
    deleteGeofenceById,
} from '../../services/AdminLocationService';
import { updateLocationStats as runStatsUpdate } from '../../workers/locationAnalyticsWorker';
import { logAdminAction } from '../../utils/adminLogger';
import slugify from 'slugify';
import { escapeRegExp } from '../../utils/stringUtils';
import logger from '../../utils/logger';
import { delCache, getCache, setCache, invalidateLocationCaches } from '../../utils/redisCache';
import { LOCATION_STATUS } from '../../../../shared/enums/locationStatus';
import {
    getPaginationParams,
    sendPaginatedResponse,
    sendSuccessResponse,
    sendAdminError as sendBaseAdminError
} from './adminBaseController';
import {
    normalizeLocationResponse,
    normalizeCoordinates
} from '../../services/location/LocationNormalizer';
import { reverseGeocode as getReverseGeocodeMatch } from '../../services/location/ReverseGeocodeService';
import {
    buildLocationSummary,
    buildHierarchyPath,
    loadHierarchyMapForLocations,
    resolveParentLocation,
    resolveLocationScope,
    resolveLocationSummary,
    asString as resolveStringField,
    CanonicalLocationDoc
} from '../../utils/locationHierarchy';

const safeSlugify = (text: string): string => {
    return slugify(text, { lower: true, strict: true, trim: true });
};

const getErrorCode = (error: unknown): number | undefined => {
    if (typeof error !== 'object' || error === null) return undefined;
    const code = (error as { code?: unknown }).code;
    return typeof code === 'number' ? code : undefined;
};

// Local helper removed, using sendBaseAdminError directly.

const ADMIN_STATES_CACHE_KEY = 'admin:locations:states';
const ADMIN_STATES_CACHE_TTL_SECONDS = 300;

const toScopeQuery = (locationIds: mongoose.Types.ObjectId[] | null) => {
    if (locationIds === null) return {};
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



/**
 * Create a state anchor location.
 * Uses canonical Location collection (no parallel schema).
 */
export const createStateLocation = async (req: Request, res: Response) => {
    const stateName =
        resolveStringField(req.body?.name) ||
        resolveStringField(req.body?.state);

    if (!stateName) {
        return sendBaseAdminError(req, res, 'State name is required.', 400);
    }

    req.body = {
        ...req.body,
        name: stateName,
        level: 'state',
        parentId: null,
    };

    return createLocation(req, res);
};

/**
 * Create a city under a state anchor.
 * Input: { stateId, name, latitude, longitude, ... }
 */
export const createCityLocation = async (req: Request, res: Response) => {
    const stateId = resolveStringField(req.body?.stateId);
    const cityName =
        resolveStringField(req.body?.name) ||
        resolveStringField(req.body?.city);

    if (!stateId) return sendBaseAdminError(req, res, 'stateId is required.', 400);
    if (!cityName) return sendBaseAdminError(req, res, 'City name is required.', 400);
    if (!mongoose.Types.ObjectId.isValid(stateId)) {
        return sendBaseAdminError(req, res, 'Invalid stateId.', 400);
    }

    const stateAnchor = await findLocationByIdLean<CanonicalLocationDoc>(stateId, '_id name country level parentId path');
    const stateSummary = await resolveLocationSummary(stateAnchor);
    if (!stateSummary?.state) {
        return sendBaseAdminError(req, res, 'State not found.', 404);
    }

    req.body = {
        ...req.body,
        name: cityName,
        country: resolveStringField(req.body?.country) || stateSummary.country || 'Unknown',
        level: 'city',
        parentId: stateId,
    };

    return createLocation(req, res);
};

/**
 * Create an area under a city anchor.
 * Input: { cityId, name, latitude, longitude, ... }
 */
export const createAreaLocation = async (req: Request, res: Response) => {
    const cityId = resolveStringField(req.body?.cityId);
    const areaName =
        resolveStringField(req.body?.name) ||
        resolveStringField(req.body?.area);

    if (!cityId) return sendBaseAdminError(req, res, 'cityId is required.', 400);
    if (!areaName) return sendBaseAdminError(req, res, 'Area name is required.', 400);
    if (!mongoose.Types.ObjectId.isValid(cityId)) {
        return sendBaseAdminError(req, res, 'Invalid cityId.', 400);
    }

    const cityAnchor = await findLocationByIdLean<CanonicalLocationDoc>(cityId, '_id name country level parentId path');
    const citySummary = await resolveLocationSummary(cityAnchor);
    if (!citySummary?.city || !citySummary?.state) {
        return sendBaseAdminError(req, res, 'City not found.', 404);
    }

    req.body = {
        ...req.body,
        name: areaName,
        country: resolveStringField(req.body?.country) || citySummary.country || 'Unknown',
        level: 'area',
        parentId: cityId,
    };

    return createLocation(req, res);
};

/**
 * Get distinct state values from the location collection.
 * Powers the admin state filter dropdown without hardcoded lists.
 */
export const getDistinctStates = async (req: Request, res: Response) => {
    try {
        const cachedStates = await getCache<string[]>(ADMIN_STATES_CACHE_KEY);
        if (Array.isArray(cachedStates)) {
            return sendSuccessResponse(res, cachedStates);
        }

        const states = await getDistinctStateLocations();
        const sorted = states
            .map((entry) => resolveStringField(entry.name))
            .filter((value): value is string => Boolean(value))
            .sort((a, b) => a.localeCompare(b));

        await setCache(ADMIN_STATES_CACHE_KEY, sorted, ADMIN_STATES_CACHE_TTL_SECONDS);
        return sendSuccessResponse(res, sorted);
    } catch (error: unknown) {
        return sendBaseAdminError(req, res, error);
    }
};

export const reverseGeocode = async (req: Request, res: Response) => {
    try {
        const lat = parseFloat(req.query.lat as string);
        const lng = parseFloat(req.query.lng as string);

        if (isNaN(lat) || isNaN(lng)) {
            return sendBaseAdminError(req, res, 'Coordinates (lat, lng) are required.', 400);
        }

        const match = await getReverseGeocodeMatch(lat, lng);
        sendSuccessResponse(res, match);
    } catch (error: unknown) {
        return sendBaseAdminError(req, res, error);
    }
};

/**
 * Get all locations with pagination and filtering
 */
export const getAllLocations = async (req: Request, res: Response) => {
    try {
        const { page, limit, skip } = getPaginationParams(req);
        const search = (req.query.search as string | undefined)?.trim();
        const status = req.query.status as string;
        const state = req.query.state as string;
        const level = req.query.level as string;

        const query: Record<string, unknown> = {};

        if (status === 'active') query.isActive = true;
        if (status === 'inactive') query.isActive = false;

        if (level && level !== 'all') query.level = level;

        if (search) {
            const escaped = escapeRegExp(search);
            query.$or = [
                { name: { $regex: escaped, $options: 'i' } },
                { normalizedName: { $regex: escaped, $options: 'i' } },
                { slug: { $regex: escaped, $options: 'i' } },
                { aliases: { $regex: escaped, $options: 'i' } },
            ];
        }

        const scope = state && state !== 'all'
            ? await resolveLocationScope({ state })
            : { locationIds: null as mongoose.Types.ObjectId[] | null };
        Object.assign(query, toScopeQuery(scope.locationIds));

        const { locations, total } = await getLocationsPaginated(query, skip, limit);
        const items = await hydrateLocationResponses(locations as CanonicalLocationDoc[]);

        return sendPaginatedResponse(res, items, total, page, limit);

    } catch (error: unknown) {
        return sendBaseAdminError(req, res, error);
    }
};

/**
 * Create a new location
 */
export const createLocation = async (req: Request, res: Response) => {
    try {
        const { country, latitude, longitude, isActive, level, name } = req.body;

        // Use locationService to normalize coordinates and detect Null Island
        const coords = normalizeCoordinates({ lat: latitude, lng: longitude });
        if (!coords || (coords.coordinates[0] === 0 && coords.coordinates[1] === 0)) {
            return sendBaseAdminError(req, res, 'Valid map coordinates are required.', 400);
        }

        const displayName = resolveStringField(name);
        if (!displayName) {
            return sendBaseAdminError(req, res, 'Location name is required.', 400);
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
        const explicitParentId = resolveStringField(req.body?.parentId);
        let parentLocation: { _id: unknown; level?: string; path?: unknown } | null = null;

        if (explicitParentId) {
            if (!/^[a-f\d]{24}$/i.test(explicitParentId)) {
                return sendBaseAdminError(req, res, 'Invalid parentId.', 400);
            }
            parentLocation = await findActiveParentById(explicitParentId);
            if (!parentLocation) {
                return sendBaseAdminError(req, res, 'Parent location not found.', 404);
            }
        } else {
            parentLocation = await resolveParentLocation({
                level: finalLevel,
                country: country || 'Unknown',
                state: resolveStringField(req.body?.state),
                district: resolveStringField(req.body?.district),
                city: resolveStringField(req.body?.city) || displayName
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

        // Check duplicate
        const existing = await findDuplicateLocation(displayName, normalizedCountry, finalLevel, parentLocation?._id);

        if (existing) {
            return sendBaseAdminError(req, res, 'Location already exists in this state.', 400);
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

        const [response] = await hydrateLocationResponses([location.toObject() as CanonicalLocationDoc]);
        return sendSuccessResponse(res, response);

    } catch (error: unknown) {
        if (getErrorCode(error) === 11000) {
            return sendBaseAdminError(req, res, 'Duplicate location detected.', 400);
        }
        return sendBaseAdminError(req, res, error);
    }
};

/**
 * Update a location
 */
export const updateLocation = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { country, latitude, longitude, isActive, level, name } = req.body;
        const nextCountry = resolveStringField(country);
        const nextName = resolveStringField(name);

        const location = await findLocationById(id);
        if (!location) {
            return sendBaseAdminError(req, res, 'Location not found', 404);
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

        const parentIdFromBody = req.body?.parentId;
        const hasParentMutation = parentIdFromBody !== undefined;
        if (hasParentMutation) {
            if (parentIdFromBody === null || parentIdFromBody === '') {
                location.parentId = null;
            } else {
                const parentId = resolveStringField(parentIdFromBody);
                if (!parentId || !/^[a-f\d]{24}$/i.test(parentId)) {
                    return sendBaseAdminError(req, res, 'Invalid parentId.', 400);
                }
                const parentExists = await locationExists(parentId);
                if (!parentExists) {
                    return sendBaseAdminError(req, res, 'Parent location not found.', 404);
                }
                location.parentId = new mongoose.Types.ObjectId(parentId);
            }
        }

        if (latitude !== undefined && longitude !== undefined) {
            const coords = normalizeCoordinates({ lat: latitude, lng: longitude });
            if (!coords || (coords.coordinates[0] === 0 && coords.coordinates[1] === 0)) {
                return sendBaseAdminError(req, res, 'Valid map coordinates are required.', 400);
            }
            location.coordinates = coords;
        }
        if (isActive !== undefined) location.isActive = isActive;

        // Regenerate slug if Name/City/State changes
        if (name || country || level || hasParentMutation) {
            let parentLocation: { _id: mongoose.Types.ObjectId; path?: mongoose.Types.ObjectId[]; country?: string; level?: string } | null = null;
            if (location.parentId) {
                parentLocation = await findLocationParent(location.parentId) as typeof parentLocation;
            }
            location.path = buildHierarchyPath(location._id, parentLocation) as typeof location.path;
            const parentSummary = parentLocation
                ? await resolveLocationSummary(parentLocation as CanonicalLocationDoc)
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

        const [response] = await hydrateLocationResponses([location.toObject() as CanonicalLocationDoc]);
        return sendSuccessResponse(res, response);

    } catch (error: unknown) {
        return sendBaseAdminError(req, res, error);
    }
};

/**
 * Toggle location status
 */
export const toggleLocationStatus = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const location = await findLocationById(id);

        if (!location) {
            return sendBaseAdminError(req, res, 'Location not found', 404);
        }

        location.isActive = !location.isActive;
        await saveLocation(location);
        await invalidateLocationStateCache();

        return sendSuccessResponse(res, normalizeLocationResponse(location));

    } catch (error: unknown) {
        return sendBaseAdminError(req, res, error);
    }
};

/**
 * Delete a location
 */
export const deleteLocation = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const location = await findLocationById(id);

        if (!location) {
            return sendBaseAdminError(req, res, 'Location not found', 404);
        }

        const locationSummary = await resolveLocationSummary(location.toObject());

        // 🛡️ DEPENDENCY CHECK: Check if any Ads or Users are using this location
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
            return sendBaseAdminError(
                req,
                res,
                `Cannot delete location "${locationSummary?.name || location.name}". It is currently used by ${adsCount} ads and ${usersCount} users. Consider deactivating it instead.`,
                409
            );
        }

        await softDeleteLocation(location);
        await invalidateLocationStateCache();
        await logAdminAction(req, 'DELETE_LOCATION', 'Location', id, {
            name: locationSummary?.name || location.name,
            city: locationSummary?.city,
            state: locationSummary?.state
        });

        return sendSuccessResponse(res, null, 'Location deleted successfully');

    } catch (error: unknown) {
        return sendBaseAdminError(req, res, error);
    }
};

/**
 * --- Geofencing ---
 */

export const getGeofences = async (req: Request, res: Response) => {
    try {
        const geofences = await getAllGeofences();
        return sendSuccessResponse(res, geofences);
    } catch (error) {
        return sendBaseAdminError(req, res, error);
    }
};

export const createGeofence = async (req: Request, res: Response) => {
    try {
        const geofence = await createGeofenceRecord(req.body);
        await logAdminAction(req, 'CREATE_GEOFENCE', 'Geofence', (geofence as { _id: { toString(): string } })._id.toString(), { name: (geofence as { name?: string }).name });
        return sendSuccessResponse(res, geofence);
    } catch (error) {
        return sendBaseAdminError(req, res, error);
    }
};

export const updateGeofence = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const geofence = await updateGeofenceById(id, req.body);
        if (!geofence) return sendBaseAdminError(req, res, 'Geofence not found', 404);
        await logAdminAction(req, 'UPDATE_GEOFENCE', 'Geofence', id, { name: (geofence as { name?: string }).name });
        return sendSuccessResponse(res, geofence);
    } catch (error) {
        return sendBaseAdminError(req, res, error);
    }
};

export const deleteGeofence = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const geofence = await deleteGeofenceById(id);
        if (!geofence) return sendBaseAdminError(req, res, 'Geofence not found', 404);
        await logAdminAction(req, 'DELETE_GEOFENCE', 'Geofence', id, { name: (geofence as { name?: string }).name });
        return sendSuccessResponse(res, null, 'Geofence deleted');
    } catch (error) {
        return sendBaseAdminError(req, res, error);
    }
};

/**
 * --- Moderation ---
 */

export const getModerationQueue = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);

        const { total, locations } = await getModerationQueuePaginated(page, limit);

        return sendPaginatedResponse(res, locations, total, page, limit);
    } catch (error) {
        return sendBaseAdminError(req, res, error);
    }
};

export const approveRejectLocation = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { status, reason } = req.body;

        if (![LOCATION_STATUS.VERIFIED, LOCATION_STATUS.REJECTED].includes(status)) {
            return sendBaseAdminError(req, res, 'Invalid status', 400);
        }

        const location = await findLocationById(id);
        if (!location) return sendBaseAdminError(req, res, 'Location not found', 404);
        const locationSummary = await resolveLocationSummary(location.toObject());

        location.verificationStatus = status;
        if (status === LOCATION_STATUS.VERIFIED) location.isActive = true;

        await saveLocation(location);
        await invalidateLocationStateCache();
        await logAdminAction(req, 'MODERATE_LOCATION', 'Location', id, { status, reason });

        // Notify User
        if (location.requestedBy) {
            const userId = location.requestedBy.toString();
            import('../../services/NotificationService').then(({ createInAppNotification }) => {
                const title = status === LOCATION_STATUS.VERIFIED ? 'Location Request Approved' : 'Location Request Rejected';
                const message = status === LOCATION_STATUS.VERIFIED
                    ? `Your location request for "${locationSummary?.name || location.name}" has been approved.`
                    : `Your location request for "${locationSummary?.name || location.name}" has been rejected. Reason: ${reason}`;

                createInAppNotification(
                    userId,
                    'SYSTEM',
                    title,
                    message,
                    { locationId: location._id, status }
                ).catch((notifyError: unknown) =>
                    logger.warn('Failed to notify user about location moderation', {
                        locationId: String(location._id),
                        status,
                        error: notifyError instanceof Error ? notifyError.message : String(notifyError)
                    })
                );
            });
        }

        return sendSuccessResponse(res, location);
    } catch {
        return sendBaseAdminError(req, res, 'Internal Server Error', 500);
    }
};


export const refreshLocationStats = async (req: Request, res: Response) => {
    try {
        // Fire-and-forget async update to prevent timeout
        runStatsUpdate('manual').catch(err =>
            logger.error('Location stats update failed', { error: err instanceof Error ? err.message : String(err) })
        );
        await logAdminAction(req, 'REFRESH_STATS', 'System', 'LocationAnalytics', {});
        return sendSuccessResponse(res, null, 'Location statistics update queued successfully');
    } catch (error: unknown) {
        return sendBaseAdminError(req, res, error);
    }
};
