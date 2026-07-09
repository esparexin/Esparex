import mongoose from 'mongoose';
import { escapeRegExp } from '../../utils/stringUtils';
import { getCache, setCache } from '../../utils/redisCache';
import { AppError } from '../../utils/AppError';
import { findLocationById, findLocationByIdLean, findActiveParentById, locationExists, findLocationParent, findDuplicateLocation, getDistinctStateLocations, getLocationsPaginated, countAdsForLocation, countUsersForLocation } from '../location/LocationQueryService';
import { generateLocationId, createLocationRecord, saveLocation, softDeleteLocation } from '../location/LocationMutationService';
import { normalizeCoordinates, normalizeLocationResponse } from '../location/LocationNormalizer';
import { reverseGeocode as getReverseGeocodeMatch } from '../location/ReverseGeocodeService';
import { buildHierarchyPath, resolveParentLocation, resolveLocationScope, resolveLocationSummary, asString as resolveStringField } from '../../utils/locationHierarchy';
import type { CanonicalLocationDoc } from '../../utils/locationHierarchy';
import type { AdminLogFn } from '../AdminListingsService';
import type { AdminLocationPaginationQuery, AdminCreateLocationBody, AdminUpdateLocationBody } from './types';
import { safeSlugify, toScopeQuery, hydrateLocationResponses, invalidateLocationStateCache, parsePaginationParams, ADMIN_STATES_CACHE_KEY } from './helpers';

const ADMIN_STATES_CACHE_TTL_SECONDS = 300;

export const adminGetDistinctStates = async () => {
    const cachedStates = await getCache<string[]>(ADMIN_STATES_CACHE_KEY);
    if (Array.isArray(cachedStates)) return cachedStates;
    const states = await getDistinctStateLocations();
    const sorted = states.map((e) => resolveStringField(e.name)).filter((v): v is string => Boolean(v)).sort((a, b) => a.localeCompare(b));
    await setCache(ADMIN_STATES_CACHE_KEY, sorted, ADMIN_STATES_CACHE_TTL_SECONDS);
    return sorted;
};

export const adminReverseGeocode = async (latRaw: string, lngRaw: string) => {
    const lat = parseFloat(latRaw), lng = parseFloat(lngRaw);
    if (isNaN(lat) || isNaN(lng)) throw new AppError('Coordinates (lat, lng) are required.', 400);
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
        dbQuery.$or = [{ name: { $regex: escaped, $options: 'i' } }, { normalizedName: { $regex: escaped, $options: 'i' } }, { slug: { $regex: escaped, $options: 'i' } }, { aliases: { $regex: escaped, $options: 'i' } }];
    }
    const scope = state && state !== 'all' ? await resolveLocationScope({ state }) : { locationIds: null as mongoose.Types.ObjectId[] | null };
    Object.assign(dbQuery, toScopeQuery(scope.locationIds));
    const { locations, total } = await getLocationsPaginated(dbQuery, skip, limit);
    const items = await hydrateLocationResponses(locations as CanonicalLocationDoc[]);
    return { items, total, page, limit };
};

export const adminCreateStateLocation = async (body: AdminCreateLocationBody) => {
    const stateName = resolveStringField(body.name) || resolveStringField(body.state);
    if (!stateName) throw new AppError('State name is required.', 400);
    return adminCreateLocation({ ...body, name: stateName, level: 'state', parentId: null });
};

export const adminCreateCityLocation = async (body: AdminCreateLocationBody) => {
    const stateId = resolveStringField(body.stateId);
    const cityName = resolveStringField(body.name) || resolveStringField(body.city);
    if (!stateId) throw new AppError('stateId is required.', 400);
    if (!cityName) throw new AppError('City name is required.', 400);
    if (!mongoose.Types.ObjectId.isValid(stateId)) throw new AppError('Invalid stateId.', 400);
    const stateAnchor = await findLocationByIdLean<CanonicalLocationDoc>(stateId, '_id name country level parentId path');
    const stateSummary = await resolveLocationSummary(stateAnchor);
    if (!stateSummary?.state) throw new AppError('State not found.', 404);
    return adminCreateLocation({ ...body, name: cityName, country: resolveStringField(body.country) || stateSummary.country || 'Unknown', level: 'city', parentId: stateId });
};

export const adminCreateAreaLocation = async (body: AdminCreateLocationBody) => {
    const cityId = resolveStringField(body.cityId);
    const areaName = resolveStringField(body.name) || resolveStringField(body.area);
    if (!cityId) throw new AppError('cityId is required.', 400);
    if (!areaName) throw new AppError('Area name is required.', 400);
    if (!mongoose.Types.ObjectId.isValid(cityId)) throw new AppError('Invalid cityId.', 400);
    const cityAnchor = await findLocationByIdLean<CanonicalLocationDoc>(cityId, '_id name country level parentId path');
    const citySummary = await resolveLocationSummary(cityAnchor);
    if (!citySummary?.city || !citySummary?.state) throw new AppError('City not found.', 404);
    return adminCreateLocation({ ...body, name: areaName, country: resolveStringField(body.country) || citySummary.country || 'Unknown', level: 'area', parentId: cityId });
};

export const adminCreateLocation = async (createBody: AdminCreateLocationBody) => {
    const { country, latitude, longitude, isActive, level, name } = createBody;
    const coords = normalizeCoordinates({ lat: latitude, lng: longitude });
    if (!coords || (coords.coordinates[0] === 0 && coords.coordinates[1] === 0)) throw new AppError('Valid map coordinates are required.', 400);
    const displayName = resolveStringField(name);
    if (!displayName) throw new AppError('Location name is required.', 400);
    const requestedLevel = resolveStringField(level)?.toLowerCase();
    const finalLevel: 'country' | 'state' | 'district' | 'city' | 'area' | 'village' = requestedLevel === 'country' || requestedLevel === 'state' || requestedLevel === 'district' || requestedLevel === 'city' || requestedLevel === 'area' || requestedLevel === 'village' ? requestedLevel : 'city';
    const explicitParentId = resolveStringField(createBody.parentId);
    let parentLocation: { _id: unknown; level?: string; path?: unknown } | null = null;
    if (explicitParentId) {
        if (!/^[a-f\d]{24}$/i.test(explicitParentId)) throw new AppError('Invalid parentId.', 400);
        parentLocation = await findActiveParentById(explicitParentId);
        if (!parentLocation) throw new AppError('Parent location not found.', 404);
    } else {
        parentLocation = await resolveParentLocation({ level: finalLevel, country: resolveStringField(country) || 'Unknown', state: resolveStringField(createBody.state), district: resolveStringField(createBody.district), city: resolveStringField(createBody.city) || displayName });
    }
    const parentSummary = parentLocation ? await resolveLocationSummary(parentLocation as CanonicalLocationDoc) : null;
    const normalizedCountry = resolveStringField(country) || parentSummary?.country || 'Unknown';
    const slug = safeSlugify([displayName, parentSummary?.state, normalizedCountry].filter((p): p is string => Boolean(p)).join('-'));
    const existing = await findDuplicateLocation(displayName, normalizedCountry, finalLevel, parentLocation?._id);
    if (existing) throw new AppError('Location already exists in this state.', 400);
    const locationId = generateLocationId();
    const location = await createLocationRecord({ _id: locationId, name: displayName, country: normalizedCountry, coordinates: coords, level: finalLevel, parentId: parentLocation?._id || null, path: buildHierarchyPath(locationId, parentLocation as any), slug, isActive: isActive !== undefined ? isActive : true, priority: 0 });
    await invalidateLocationStateCache();
    const [response] = await hydrateLocationResponses([location.toObject()]);
    return response;
};

export const adminUpdateLocation = async (id: string, updateBody: AdminUpdateLocationBody) => {
    const { country, latitude, longitude, isActive, level, name } = updateBody;
    const nextCountry = resolveStringField(country);
    const nextName = resolveStringField(name);
    const location = await findLocationById(id);
    if (!location) throw new AppError('Location not found', 404);
    if (level) { const nl = resolveStringField(level)?.toLowerCase(); if (nl === 'country' || nl === 'state' || nl === 'district' || nl === 'city' || nl === 'area' || nl === 'village') location.level = nl; }
    if (nextCountry) location.country = nextCountry;
    if (nextName) location.name = nextName;
    const parentIdFromBody = updateBody.parentId;
    const hasParentMutation = parentIdFromBody !== undefined;
    if (hasParentMutation) {
        if (parentIdFromBody === undefined || parentIdFromBody === '') { location.parentId = undefined as any; }
        else { const pid = resolveStringField(parentIdFromBody); if (!pid || !/^[a-f\d]{24}$/i.test(pid)) throw new AppError('Invalid parentId.', 400); const pe = await locationExists(pid); if (!pe) throw new AppError('Parent location not found.', 404); location.parentId = new mongoose.Types.ObjectId(pid); }
    }
    if (latitude !== undefined && longitude !== undefined) {
        const coords = normalizeCoordinates({ lat: latitude, lng: longitude });
        if (!coords || (coords.coordinates[0] === 0 && coords.coordinates[1] === 0)) throw new AppError('Valid map coordinates are required.', 400);
        location.coordinates = coords;
    }
    if (isActive !== undefined) location.isActive = Boolean(isActive);
    if (name || country || level || hasParentMutation) {
        let parentLocation: any = null;
        if (location.parentId) parentLocation = await findLocationParent(location.parentId);
        location.path = buildHierarchyPath(location._id, parentLocation);
        const ps = parentLocation ? await resolveLocationSummary(parentLocation) : null;
        location.slug = safeSlugify([location.name, ps?.state, location.country || 'unknown'].filter((p): p is string => Boolean(p)).join('-'));
    }
    await saveLocation(location);
    await invalidateLocationStateCache();
    const [response] = await hydrateLocationResponses([location.toObject()]);
    return response;
};

export const adminToggleLocationStatus = async (id: string) => {
    const location = await findLocationById(id);
    if (!location) throw new AppError('Location not found', 404);
    location.isActive = !location.isActive;
    await saveLocation(location);
    await invalidateLocationStateCache();
    return normalizeLocationResponse(location);
};

export const adminDeleteLocation = async (id: string, logFn: AdminLogFn) => {
    const location = await findLocationById(id);
    if (!location) throw new AppError('Location not found', 404);
    const locationSummary = await resolveLocationSummary(location.toObject());
    const adUsageQuery: any = { $or: [{ 'location.locationId': id }] };
    const userUsageQuery: any = { $or: [{ locationId: id }] };
    if (locationSummary?.city && locationSummary?.state) { adUsageQuery.$or.push({ 'location.city': locationSummary.city, 'location.state': locationSummary.state }); userUsageQuery.$or.push({ 'location.city': locationSummary.city, 'location.state': locationSummary.state }); }
    const [adsCount, usersCount] = await Promise.all([countAdsForLocation(adUsageQuery), countUsersForLocation(userUsageQuery)]);
    if (adsCount > 0 || usersCount > 0) throw new AppError(`Cannot delete location "${locationSummary?.name || location.name}". It is currently used by ${adsCount} ads and ${usersCount} users. Consider deactivating it instead.`, 409);
    await softDeleteLocation(location);
    await invalidateLocationStateCache();
    await logFn('DELETE_LOCATION', 'Location', id, { name: locationSummary?.name || location.name, city: locationSummary?.city, state: locationSummary?.state });
    return true;
};
