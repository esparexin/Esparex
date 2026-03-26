import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Location from '../../models/Location';
import Ad from '../../models/Ad';
import User from '../../models/User';
import Geofence from '../../models/Geofence';
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
    sendAdminError as sendBaseAdminError,
    respond
} from './adminBaseController';
import {
    normalizeLocationResponse,
    toGeoPoint,
    normalizeCoordinates
} from '../../services/LocationService';
import {
    buildHierarchyPath,
    resolveParentLocation,
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
const LOCATION_LIST_HINT = { isActive: 1, state: 1, level: 1, isPopular: -1, createdAt: -1 } as const;
let hasWarnedLocationListHintFailure = false;



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
        city: stateName,
        state: stateName,
        level: 'state',
        district: undefined
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

    const stateAnchor = await Location.findById(stateId)
        .select('_id name country level parentId path')
        .lean<CanonicalLocationDoc | null>();
    const stateSummary = await resolveLocationSummary(stateAnchor);
    if (!stateSummary?.state) {
        return sendBaseAdminError(req, res, 'State not found.', 404);
    }

    req.body = {
        ...req.body,
        name: cityName,
        city: cityName,
        state: stateSummary.state,
        country: resolveStringField(req.body?.country) || stateSummary.country || 'Unknown',
        level: 'city',
        parentId: stateId,
        district: undefined
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

    const cityAnchor = await Location.findById(cityId)
        .select('_id name country level parentId path')
        .lean<CanonicalLocationDoc | null>();
    const citySummary = await resolveLocationSummary(cityAnchor);
    if (!citySummary?.city || !citySummary?.state) {
        return sendBaseAdminError(req, res, 'City not found.', 404);
    }

    req.body = {
        ...req.body,
        name: areaName,
        city: citySummary.city,
        state: citySummary.state,
        country: resolveStringField(req.body?.country) || citySummary.country || 'Unknown',
        level: 'area',
        parentId: cityId,
        district: undefined
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

        const states = await Location.find({ isActive: true, level: 'state' })
            .select('name')
            .lean<Array<{ name?: string }>>();
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
        const isPopular = req.query.isPopular as string;

        const query: Record<string, unknown> = {};
        const hasSearchFilter = Boolean(search);

        if (search) {
            const escaped = escapeRegExp(search);
            query.$or = [
                { city: { $regex: escaped, $options: 'i' } },
                { state: { $regex: escaped, $options: 'i' } },
                { slug: { $regex: escaped, $options: 'i' } }
            ];
        }

        if (status === 'active') query.isActive = true;
        if (status === 'inactive') query.isActive = false;

        if (state && state !== 'all') query.state = state;
        if (level && level !== 'all') query.level = level;
        if (isPopular === 'true') query.isPopular = true;
        if (isPopular === 'false') query.isPopular = false;

        const hasAnyFilter = Object.keys(query).length > 0;
        const shouldAttemptHint = !hasSearchFilter && hasAnyFilter;

        const buildLocationsQuery = () =>
            Location.find(query)
                .select('_id name slug city district state country level coordinates isActive isPopular verificationStatus createdAt updatedAt')
                .lean()
                .sort({ isPopular: -1, createdAt: -1 })
                .skip(skip)
                .limit(limit);

        const totalPromise = (async () => {
            if (!hasAnyFilter) {
                return Location.estimatedDocumentCount();
            }
            if (shouldAttemptHint) {
                try {
                    return await Location.countDocuments(query).hint(LOCATION_LIST_HINT);
                } catch (error) {
                    if (!hasWarnedLocationListHintFailure) {
                        hasWarnedLocationListHintFailure = true;
                        logger.warn('Location count hint unavailable; retrying without hint', {
                            error: error instanceof Error ? error.message : String(error),
                            hint: LOCATION_LIST_HINT
                        });
                    }
                }
            }
            return Location.countDocuments(query);
        })();

        const locationsPromise = (async () => {
            if (!shouldAttemptHint) {
                return buildLocationsQuery();
            }

            try {
                return await buildLocationsQuery().hint(LOCATION_LIST_HINT);
            } catch (error) {
                if (!hasWarnedLocationListHintFailure) {
                    hasWarnedLocationListHintFailure = true;
                    logger.warn('Location list hint unavailable; retrying without hint', {
                        error: error instanceof Error ? error.message : String(error),
                        hint: LOCATION_LIST_HINT
                    });
                }
                return buildLocationsQuery();
            }
        })();

        const [total, locations] = await Promise.all([totalPromise, locationsPromise]);
        const items = (locations as unknown[])
            .map((location) => normalizeLocationResponse(location))
            .filter((location): location is NonNullable<ReturnType<typeof normalizeLocationResponse>> => Boolean(location));

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
        const { city, state, country, latitude, longitude, isActive, isPopular, level, district, name } = req.body;

        // Use locationService to normalize coordinates and detect Null Island
        const coords = normalizeCoordinates({ lat: latitude, lng: longitude });
        if (!coords || (coords.coordinates[0] === 0 && coords.coordinates[1] === 0)) {
            return sendBaseAdminError(req, res, 'Valid map coordinates are required.', 400);
        }

        if (!city || !state) {
            return sendBaseAdminError(req, res, 'City and State are required.', 400);
        }

        const districtName = district || name;
        const requestedLevel = resolveStringField(level)?.toLowerCase();
        let finalLevel: 'country' | 'state' | 'district' | 'city' | 'area' | 'village' =
            requestedLevel === 'country' ||
                requestedLevel === 'state' ||
                requestedLevel === 'district' ||
                requestedLevel === 'city' ||
                requestedLevel === 'area' ||
                requestedLevel === 'village'
                ? requestedLevel
                : 'city';
        const displayName = districtName || city;
        const slug = safeSlugify(`${displayName}-${city}-${state}`);
        const explicitParentId = resolveStringField(req.body?.parentId);
        let parentLocation: { _id: unknown; level?: string; path?: unknown } | null = null;

        if (explicitParentId) {
            if (!/^[a-f\d]{24}$/i.test(explicitParentId)) {
                return sendBaseAdminError(req, res, 'Invalid parentId.', 400);
            }
            parentLocation = await Location.findOne({ _id: explicitParentId, isActive: true })
                .select('_id level path')
                .lean();
            if (!parentLocation) {
                return sendBaseAdminError(req, res, 'Parent location not found.', 404);
            }
        } else {
            parentLocation = await resolveParentLocation({
                level: finalLevel,
                country: country || 'Unknown',
                state,
                district: districtName,
                city
            });
        }
        if (districtName && finalLevel === 'city' && parentLocation?.level === 'city') {
            finalLevel = 'area';
        }

        // Check duplicate
        const existing = await Location.findOne({
            name: { $regex: new RegExp(`^${escapeRegExp(displayName)}$`, 'i') },
            country: country || 'Unknown',
            level: finalLevel,
            parentId: parentLocation?._id || null
        });

        if (existing) {
            return sendBaseAdminError(req, res, 'Location already exists in this state.', 400);
        }

        const locationId = new Location()._id;
        const location = await Location.create({
            _id: locationId,
            name: displayName,
            country: country || 'Unknown',
            coordinates: coords,
            level: finalLevel,
            parentId: parentLocation?._id || null,
            path: buildHierarchyPath(locationId, parentLocation as any),
            slug,
            isActive: isActive !== undefined ? isActive : true,
            isPopular: isPopular || false,
            priority: isPopular ? 100 : 0
        });

        await invalidateLocationStateCache();

        return sendSuccessResponse(res, normalizeLocationResponse(location));

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
        const { id } = req.params;
        const { city, state, country, latitude, longitude, isActive, isPopular, level, district, name } = req.body;
        const nextCity = resolveStringField(city);
        const nextState = resolveStringField(state);
        const nextCountry = resolveStringField(country);
        const nextName = resolveStringField(name);

        const location = await Location.findById(id);
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
        } else if (
            nextCity &&
            (location.level === 'country' || location.level === 'state' || location.level === 'city')
        ) {
            location.name = nextCity;
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
                const parentExists = await Location.exists({ _id: parentId, isActive: true });
                if (!parentExists) {
                    return sendBaseAdminError(req, res, 'Parent location not found.', 404);
                }
                location.parentId = parentId as any;
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
        if (isPopular !== undefined) {
            location.isPopular = isPopular;
            location.priority = isPopular ? 100 : 0;
        }

        // Regenerate slug if Name/City/State changes
        if (city || state || name || level || hasParentMutation) {
            let parentLocation = null;
            if (location.parentId) {
                parentLocation = await Location.findById(location.parentId)
                    .select('_id path')
                    .lean();
            }
            if (!parentLocation) {
                parentLocation = await resolveParentLocation({
                    level: location.level,
                    country: location.country,
                    state: nextState,
                    district: resolveStringField(req.body?.district) || undefined,
                    city: nextCity,
                    excludeId: location._id
                });
                location.parentId = parentLocation?._id || null;
            }
            location.path = buildHierarchyPath(location._id as any, parentLocation as any) as any;

            const slugParts = [
                location.name,
                nextCity && nextCity !== location.name ? nextCity : undefined,
                nextState || location.country || 'unknown'
            ].filter((part): part is string => Boolean(part));
            location.slug = safeSlugify(slugParts.join('-'));
        }

        await location.save();
        await invalidateLocationStateCache();

        return sendSuccessResponse(res, normalizeLocationResponse(location));

    } catch (error: unknown) {
        return sendBaseAdminError(req, res, error);
    }
};

/**
 * Toggle location status
 */
export const toggleLocationStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const location = await Location.findById(id);

        if (!location) {
            return sendBaseAdminError(req, res, 'Location not found', 404);
        }

        location.isActive = !location.isActive;
        await location.save();
        await invalidateLocationStateCache();

        return sendSuccessResponse(res, normalizeLocationResponse(location));

    } catch (error: unknown) {
        return sendBaseAdminError(req, res, error);
    }
};

/**
 * Toggle Popular status for a location
 */
export const togglePopularStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const location = await Location.findById(id);

        if (!location) {
            return sendBaseAdminError(req, res, 'Location not found', 404);
        }

        location.isPopular = !location.isPopular;
        await location.save();
        await invalidateLocationStateCache(); // Popular status affects hierarchy & search caches

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
        const { id } = req.params;
        const location = await Location.findById(id);

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
            Ad.countDocuments(adUsageQuery),
            User.countDocuments(userUsageQuery)
        ]);

        if (adsCount > 0 || usersCount > 0) {
            return sendBaseAdminError(
                req,
                res,
                `Cannot delete location "${locationSummary?.name || location.name}". It is currently used by ${adsCount} ads and ${usersCount} users. Consider deactivating it instead.`,
                409
            );
        }

        await location.softDelete();
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
        const geofences = await Geofence.find().sort({ createdAt: -1 });
        return sendSuccessResponse(res, geofences);
    } catch (error) {
        return sendBaseAdminError(req, res, error);
    }
};

export const createGeofence = async (req: Request, res: Response) => {
    try {
        const geofence = await Geofence.create(req.body);
        await logAdminAction(req, 'CREATE_GEOFENCE', 'Geofence', geofence._id.toString(), { name: geofence.name });
        return sendSuccessResponse(res, geofence);
    } catch (error) {
        return sendBaseAdminError(req, res, error);
    }
};

export const updateGeofence = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const geofence = await Geofence.findByIdAndUpdate(id, req.body, { new: true });
        if (!geofence) return sendBaseAdminError(req, res, 'Geofence not found', 404);
        await logAdminAction(req, 'UPDATE_GEOFENCE', 'Geofence', id, { name: geofence.name });
        return sendSuccessResponse(res, geofence);
    } catch (error) {
        return sendBaseAdminError(req, res, error);
    }
};

export const deleteGeofence = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const geofence = await Geofence.findByIdAndDelete(id);
        if (!geofence) return sendBaseAdminError(req, res, 'Geofence not found', 404);
        await logAdminAction(req, 'DELETE_GEOFENCE', 'Geofence', id, { name: geofence.name });
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

        const query = { verificationStatus: LOCATION_STATUS.PENDING };
        const [total, locations] = await Promise.all([
            Location.countDocuments(query).hint({ verificationStatus: 1, createdAt: 1 }),
            Location.find(query)
                .select('_id name city district state country level coordinates isActive isPopular verificationStatus requestedBy createdAt')
                .lean()
                .populate('requestedBy', 'firstName lastName email')
                .sort({ createdAt: 1 })
                .skip((page - 1) * limit)
                .limit(limit)
        ]);

        return sendPaginatedResponse(res, locations, total, page, limit);
    } catch (error) {
        return sendBaseAdminError(req, res, error);
    }
};

export const approveRejectLocation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status, reason } = req.body;

        if (![LOCATION_STATUS.VERIFIED, LOCATION_STATUS.REJECTED].includes(status)) {
            return sendBaseAdminError(req, res, 'Invalid status', 400);
        }

        const location = await Location.findById(id);
        if (!location) return sendBaseAdminError(req, res, 'Location not found', 404);
        const locationSummary = await resolveLocationSummary(location.toObject());

        location.verificationStatus = status;
        if (status === LOCATION_STATUS.VERIFIED) location.isActive = true;

        await location.save();
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

/**
 * POST /admin/system/locations/migrate-paths
 * Trigger the path-population migration for Location documents.
 * Pass { apply: true } in body to persist; omit for dry-run.
 * Prerequisites: all locations must have correct parentId chains.
 * Remove after Sprint 3 deprecation of city/state fields is complete.
 */
export const runLocationPathMigration = async (req: Request, res: Response) => {
    const applyMode = req.body?.apply === true;
    try {
        logger.info('[AdminLocationController] Location path migration requested', { applyMode });
        const { runLocationPathMigrationJob } = await import('../../scripts/migrations/migrate_location_path_population_job');
        const result = await runLocationPathMigrationJob({ apply: applyMode });
        await logAdminAction(req, 'LOCATION_PATH_MIGRATION', 'System', 'Location', { applyMode, ...result });
        return sendSuccessResponse(res, result, applyMode ? 'Path migration applied' : 'Dry run complete — pass { apply: true } to persist');
    } catch (error: unknown) {
        return sendBaseAdminError(req, res, error);
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
