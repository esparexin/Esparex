import { Request, Response } from 'express';
import Location from '../../models/Location';
import Ad from '../../models/Ad';
import User from '../../models/User';
import Geofence from '../../models/Geofence';
import { updateLocationStats as runStatsUpdate } from '../../workers/locationAnalyticsWorker';
import { logAdminAction } from '../../utils/adminLogger';
import slugify from 'slugify';
import { escapeRegExp } from '../../utils/stringUtils';
import logger from '../../utils/logger';
import { sendErrorResponse } from '../../utils/errorResponse';
import { delCache, getCache, setCache, invalidateLocationCaches } from '../../utils/redisCache';
import { LOCATION_STATUS } from '../../../../shared/enums/locationStatus';
// If generic slugify not found, I will create a simple local one.

// Helper for safe JSON responses
const sendJson = (res: Response, status: number, data: unknown) => {
    return res.status(status).json(data);
};

import { respond } from '../../utils/respond';
import {
    normalizeLocationResponse,
    toGeoPoint,
    normalizeCoordinates
} from '../../services/LocationService';
import { buildHierarchyPath, resolveParentLocation } from '../../utils/locationHierarchy';

const safeSlugify = (text: string): string => {
    return slugify(text, { lower: true, strict: true, trim: true });
};

const getErrorCode = (error: unknown): number | undefined => {
    if (typeof error !== 'object' || error === null) return undefined;
    const code = (error as { code?: unknown }).code;
    return typeof code === 'number' ? code : undefined;
};

const sendAdminError = (
    req: Request,
    res: Response,
    status: number,
    message: string,
    details?: Record<string, unknown>
) => sendErrorResponse(req, res, status, message, details ? { details } : undefined);

const ADMIN_STATES_CACHE_KEY = 'admin:locations:states';
const ADMIN_STATES_CACHE_TTL_SECONDS = 300;
const LOCATION_LIST_HINT = { isActive: 1, state: 1, level: 1, isPopular: -1, createdAt: -1 } as const;

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

const resolveStringField = (value: unknown): string | undefined => {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
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
        return sendAdminError(req, res, 400, 'State name is required.');
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

    if (!stateId) return sendAdminError(req, res, 400, 'stateId is required.');
    if (!cityName) return sendAdminError(req, res, 400, 'City name is required.');
    if (!/^[a-f\d]{24}$/i.test(stateId)) {
        return sendAdminError(req, res, 400, 'Invalid stateId.');
    }

    const stateAnchor = await Location.findById(stateId)
        .select('state country')
        .lean<{ state?: string; country?: string } | null>();
    if (!stateAnchor?.state) {
        return sendAdminError(req, res, 404, 'State not found.');
    }

    req.body = {
        ...req.body,
        name: cityName,
        city: cityName,
        state: stateAnchor.state,
        country: resolveStringField(req.body?.country) || stateAnchor.country || 'Unknown',
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

    if (!cityId) return sendAdminError(req, res, 400, 'cityId is required.');
    if (!areaName) return sendAdminError(req, res, 400, 'Area name is required.');
    if (!/^[a-f\d]{24}$/i.test(cityId)) {
        return sendAdminError(req, res, 400, 'Invalid cityId.');
    }

    const cityAnchor = await Location.findById(cityId)
        .select('city state country')
        .lean<{ city?: string; state?: string; country?: string } | null>();
    if (!cityAnchor?.city || !cityAnchor?.state) {
        return sendAdminError(req, res, 404, 'City not found.');
    }

    req.body = {
        ...req.body,
        name: areaName,
        city: cityAnchor.city,
        state: cityAnchor.state,
        country: resolveStringField(req.body?.country) || cityAnchor.country || 'Unknown',
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
            return sendJson(res, 200, respond({ success: true, data: cachedStates }));
        }

        const states = await Location.distinct('state', { isActive: true });
        const sorted = (states as string[])
            .filter((value): value is string => typeof value === 'string' && value.length > 0)
            .sort((a, b) => a.localeCompare(b));

        await setCache(ADMIN_STATES_CACHE_KEY, sorted, ADMIN_STATES_CACHE_TTL_SECONDS);
        return sendJson(res, 200, respond({ success: true, data: sorted }));
    } catch (error: unknown) {
        logger.error('Error fetching distinct states', {
            error: error instanceof Error ? error.message : String(error)
        });
        return sendAdminError(req, res, 500, 'Internal Server Error');
    }
};

/**
 * Get all locations with pagination and filtering
 */
export const getAllLocations = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 100); // Cap at 100
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

        const totalPromise = (async () => {
            if (!hasAnyFilter) {
                return Location.estimatedDocumentCount();
            }
            if (!hasSearchFilter) {
                try {
                    return await Location.countDocuments(query).hint(LOCATION_LIST_HINT);
                } catch {
                    // Fallback when planner cannot satisfy forced hint
                }
            }
            return Location.countDocuments(query);
        })();

        let locationsQuery = Location.find(query)
            .select('_id name slug city district state country level coordinates isActive isPopular verificationStatus createdAt updatedAt')
            .lean()
            .sort({ isPopular: -1, createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        if (!hasSearchFilter && hasAnyFilter) {
            locationsQuery = locationsQuery.hint(LOCATION_LIST_HINT);
        }

        const [total, locations] = await Promise.all([totalPromise, locationsQuery]);
        const items = (locations as unknown[])
            .map((location) => normalizeLocationResponse(location))
            .filter((location): location is NonNullable<ReturnType<typeof normalizeLocationResponse>> => Boolean(location));

        return sendJson(res, 200, respond({
            success: true,
            data: {
                items,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        }));

    } catch (error: unknown) {
        logger.error('Error fetching locations', {
            error: error instanceof Error ? error.message : String(error)
        });
        return sendAdminError(req, res, 500, 'Internal Server Error');
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
            return sendAdminError(req, res, 400, 'Valid map coordinates are required.');
        }

        if (!city || !state) {
            return sendAdminError(req, res, 400, 'City and State are required.');
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
                return sendAdminError(req, res, 400, 'Invalid parentId.');
            }
            parentLocation = await Location.findOne({ _id: explicitParentId, isActive: true })
                .select('_id level path')
                .lean();
            if (!parentLocation) {
                return sendAdminError(req, res, 404, 'Parent location not found.');
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
            city: { $regex: new RegExp(`^${escapeRegExp(city)}$`, 'i') },
            state: { $regex: new RegExp(`^${escapeRegExp(state)}$`, 'i') },
            level: finalLevel
        });

        if (existing) {
            return sendAdminError(req, res, 400, 'Location already exists in this state.');
        }

        const locationId = new Location()._id;
        const location = await Location.create({
            _id: locationId,
            name: displayName,
            city,
            state,
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

        return sendJson(res, 201, respond({ success: true, data: normalizeLocationResponse(location) }));

    } catch (error: unknown) {
        logger.error('Error creating location', {
            error: error instanceof Error ? error.message : String(error)
        });
        // Handle Mongoose duplicate key error specifically if needed, likely covered by check above
        if (getErrorCode(error) === 11000) {
            return sendAdminError(req, res, 400, 'Duplicate location detected.');
        }
        return sendAdminError(req, res, 500, 'Internal Server Error');
    }
};

/**
 * Update a location
 */
export const updateLocation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { city, state, country, latitude, longitude, isActive, isPopular, level, district, name } = req.body;

        const location = await Location.findById(id);
        if (!location) {
            return sendAdminError(req, res, 404, 'Location not found');
        }

        if (city) location.city = city;
        if (state) location.state = state;
        if (country) location.country = country;
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
        if (name) location.name = name;

        const parentIdFromBody = req.body?.parentId;
        const hasParentMutation = parentIdFromBody !== undefined;
        if (hasParentMutation) {
            if (parentIdFromBody === null || parentIdFromBody === '') {
                location.parentId = null;
            } else {
                const parentId = resolveStringField(parentIdFromBody);
                if (!parentId || !/^[a-f\d]{24}$/i.test(parentId)) {
                    return sendAdminError(req, res, 400, 'Invalid parentId.');
                }
                const parentExists = await Location.exists({ _id: parentId, isActive: true });
                if (!parentExists) {
                    return sendAdminError(req, res, 404, 'Parent location not found.');
                }
                location.parentId = parentId as any;
            }
        }

        if (latitude !== undefined && longitude !== undefined) {
            const coords = normalizeCoordinates({ lat: latitude, lng: longitude });
            if (!coords || (coords.coordinates[0] === 0 && coords.coordinates[1] === 0)) {
                return sendAdminError(req, res, 400, 'Valid map coordinates are required.');
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
            const cityName = location.city || location.name || '';
            const stateName = location.state || location.country || 'unknown';
            const hierarchyName = location.name || cityName;
            if (location.level === 'country' || location.level === 'state' || location.level === 'city') {
                location.name = cityName;
                location.slug = safeSlugify(`${cityName}-${stateName}`);
            } else {
                location.name = hierarchyName;
                location.slug = safeSlugify(`${hierarchyName}-${cityName}-${stateName}`);
            }

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
                    state: location.state,
                    district: resolveStringField(req.body?.district) || undefined,
                    city: location.city,
                    excludeId: location._id
                });
                location.parentId = parentLocation?._id || null;
            }
            location.path = buildHierarchyPath(location._id as any, parentLocation as any) as any;
        }

        await location.save();
        await invalidateLocationStateCache();

        return sendJson(res, 200, respond({ success: true, data: normalizeLocationResponse(location) }));

    } catch (error: unknown) {
        logger.error('Error updating location', {
            error: error instanceof Error ? error.message : String(error)
        });
        return sendAdminError(req, res, 500, 'Internal Server Error');
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
            return sendAdminError(req, res, 404, 'Location not found');
        }

        location.isActive = !location.isActive;
        await location.save();
        await invalidateLocationStateCache();

        return sendJson(res, 200, respond({ success: true, data: normalizeLocationResponse(location) }));

    } catch (error: unknown) {
        logger.error('Error toggling location status', {
            error: error instanceof Error ? error.message : String(error)
        });
        return sendAdminError(req, res, 500, 'Internal Server Error');
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
            return sendAdminError(req, res, 404, 'Location not found');
        }

        // 🛡️ DEPENDENCY CHECK: Check if any Ads or Users are using this location
        const adUsageQuery = {
            $or: [
                { 'location.locationId': id },
                { 'location.city': location.city, 'location.state': location.state }
            ]
        };
        const userUsageQuery = {
            $or: [
                { locationId: id },
                { 'location.city': location.city, 'location.state': location.state }
            ]
        };
        const [adsCount, usersCount] = await Promise.all([
            Ad.countDocuments(adUsageQuery),
            User.countDocuments(userUsageQuery)
        ]);

        if (adsCount > 0 || usersCount > 0) {
            return sendAdminError(
                req,
                res,
                409,
                `Cannot delete location "${location.city}". It is currently used by ${adsCount} ads and ${usersCount} users. Consider deactivating it instead.`,
                { dependencies: { ads: adsCount, users: usersCount } }
            );
        }

        await location.softDelete();
        await invalidateLocationStateCache();
        await logAdminAction(req, 'DELETE_LOCATION', 'Location', id, { city: location.city, state: location.state });

        return sendJson(res, 200, respond({ success: true, message: 'Location deleted successfully' }));

    } catch (error: unknown) {
        logger.error('Error deleting location', {
            error: error instanceof Error ? error.message : String(error)
        });
        return sendAdminError(req, res, 500, 'Internal Server Error');
    }
};

/**
 * --- Geofencing ---
 */

export const getGeofences = async (req: Request, res: Response) => {
    try {
        const geofences = await Geofence.find().sort({ createdAt: -1 });
        return sendJson(res, 200, respond({ success: true, data: geofences }));
    } catch {
        return sendAdminError(req, res, 500, 'Internal Server Error');
    }
};

export const createGeofence = async (req: Request, res: Response) => {
    try {
        const geofence = await Geofence.create(req.body);
        await logAdminAction(req, 'CREATE_GEOFENCE', 'Geofence', geofence._id.toString(), { name: geofence.name });
        return sendJson(res, 201, respond({ success: true, data: geofence }));
    } catch {
        return sendAdminError(req, res, 500, 'Internal Server Error');
    }
};

export const updateGeofence = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const geofence = await Geofence.findByIdAndUpdate(id, req.body, { new: true });
        if (!geofence) return sendAdminError(req, res, 404, 'Geofence not found');
        await logAdminAction(req, 'UPDATE_GEOFENCE', 'Geofence', id, { name: geofence.name });
        return sendJson(res, 200, respond({ success: true, data: geofence }));
    } catch {
        return sendAdminError(req, res, 500, 'Internal Server Error');
    }
};

export const deleteGeofence = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const geofence = await Geofence.findByIdAndDelete(id);
        if (!geofence) return sendAdminError(req, res, 404, 'Geofence not found');
        await logAdminAction(req, 'DELETE_GEOFENCE', 'Geofence', id, { name: geofence.name });
        return sendJson(res, 200, respond({ success: true, message: 'Geofence deleted' }));
    } catch {
        return sendAdminError(req, res, 500, 'Internal Server Error');
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

        return sendJson(res, 200, respond({
            success: true,
            data: {
                items: locations,
                pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
            }
        }));
    } catch {
        return sendAdminError(req, res, 500, 'Internal Server Error');
    }
};

export const approveRejectLocation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status, reason } = req.body;

        if (![LOCATION_STATUS.VERIFIED, LOCATION_STATUS.REJECTED].includes(status)) {
            return sendAdminError(req, res, 400, 'Invalid status');
        }

        const location = await Location.findById(id);
        if (!location) return sendAdminError(req, res, 404, 'Location not found');

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
                    ? `Your location request for "${location.city}" has been approved.`
                    : `Your location request for "${location.city}" has been rejected. Reason: ${reason}`;

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

        return sendJson(res, 200, respond({ success: true, data: location }));
    } catch {
        return sendAdminError(req, res, 500, 'Internal Server Error');
    }
};

export const refreshLocationStats = async (req: Request, res: Response) => {
    try {
        // Fire-and-forget async update to prevent timeout
        runStatsUpdate('manual').catch(err =>
            logger.error('Location stats update failed', { error: err instanceof Error ? err.message : String(err) })
        );
        await logAdminAction(req, 'REFRESH_STATS', 'System', 'LocationStats', {});
        return sendJson(res, 200, respond({
            success: true,
            message: 'Location statistics update queued successfully'
        }));
    } catch (error: unknown) {
        logger.error('Error queueing location stats refresh', {
            error: error instanceof Error ? error.message : String(error)
        });
        return sendAdminError(req, res, 500, 'Failed to queue location statistics update');
    }
};
