import {
    mongoose,
    Location,
    AdminBoundary,
    logger,
    CACHE_TTLS,
    getCache,
    setCache,
    AppError,
    REVERSE_GEOCODE_LEVEL_PRIORITY,
    REVERSE_GEOCODE_SETTLEMENT_LEVELS,
    REVERSE_GEOCODE_SETTLEMENT_MAX_DISTANCE_METERS,
    REVERSE_GEOCODE_REGIONAL_LEVELS,
    REVERSE_GEOCODE_REGIONAL_MAX_DISTANCE_METERS,
    withPublicCanonicalLocationFilter,
    mapLocationDocsToResponses,
    buildReverseGeocodeCacheKey,
    getPublicCanonicalLocationById
} from './_shared/locationServiceBase';
import type {
    LocationInputObject,
    NormalizedLocationResponse,
    HierarchyLevel
} from './_shared/locationServiceBase';
export { toGeoPoint, normalizeCoordinates } from './_shared/locationServiceBase';
const resolveBoundaryMatch = async (lat: number, lng: number): Promise<NormalizedLocationResponse | null> => {
    const point = { type: 'Point', coordinates: [lng, lat] as [number, number] };
    const boundaries = await AdminBoundary.find({
        geometry: {
            $geoIntersects: {
                $geometry: point
            }
        }
    })
        .select('locationId level')
        .lean<Array<{ locationId: mongoose.Types.ObjectId; level: HierarchyLevel }>>();

    if (boundaries.length === 0) {
        logger.warn('No AdminBoundary found for coordinates; falling back to nearest point search.', { lat, lng });
        return null;
    }

    const boundary = [...boundaries].sort(
        (a, b) => (REVERSE_GEOCODE_LEVEL_PRIORITY[b.level] || 0) - (REVERSE_GEOCODE_LEVEL_PRIORITY[a.level] || 0)
    )[0];

    const stateLocation = await getPublicCanonicalLocationById(boundary?.locationId);
    if (!boundary || !stateLocation) {
        logger.warn('AdminBoundary matched but parent location is missing or inactive.', {
            boundaryId: boundary?.locationId,
            coordinates: { lat, lng }
        });
        return null;
    }

    // After identifying the state, find the nearest city/district within it.
    // This gives users "Hyderabad, Telangana" instead of just "Telangana".
    const nearestCity = await Location.findOne(withPublicCanonicalLocationFilter({
        level: { $in: REVERSE_GEOCODE_SETTLEMENT_LEVELS },
        parentId: boundary.locationId,
        coordinates: {
            $near: {
                $geometry: { type: 'Point', coordinates: [lng, lat] },
                $maxDistance: REVERSE_GEOCODE_SETTLEMENT_MAX_DISTANCE_METERS,
            }
        }
    }))
        .select('name country level coordinates isPopular isActive verificationStatus parentId path pincode')
        .lean<LocationInputObject | null>();

    if (nearestCity) {
        const [mappedCity] = await mapLocationDocsToResponses([nearestCity as LocationInputObject]);
        if (mappedCity) return mappedCity;
    }

    // Fallback to state-level response if no city found within range
    const [mappedState] = await mapLocationDocsToResponses([stateLocation as LocationInputObject]);
    return mappedState || null;
};



const findNearestReverseGeocodeCandidate = async (
    lat: number,
    lng: number
): Promise<LocationInputObject | null> => {
    const nearestSettlement = await Location.findOne(withPublicCanonicalLocationFilter({
        level: { $in: REVERSE_GEOCODE_SETTLEMENT_LEVELS },
        coordinates: {
            $near: {
                $geometry: { type: 'Point', coordinates: [lng, lat] },
                $maxDistance: REVERSE_GEOCODE_SETTLEMENT_MAX_DISTANCE_METERS,
            }
        }
    }))
        .select('name country level coordinates isPopular isActive verificationStatus parentId path pincode')
        .lean<LocationInputObject | null>();

    if (nearestSettlement) {
        return nearestSettlement;
    }

    return Location.findOne(withPublicCanonicalLocationFilter({
        level: { $in: REVERSE_GEOCODE_REGIONAL_LEVELS },
        coordinates: {
            $near: {
                $geometry: { type: 'Point', coordinates: [lng, lat] },
                $maxDistance: REVERSE_GEOCODE_REGIONAL_MAX_DISTANCE_METERS,
            }
        }
    }))
        .select('name country level coordinates isPopular isActive verificationStatus parentId path pincode')
        .lean<LocationInputObject | null>();
};

export const reverseGeocode = async (
    lat: number,
    lng: number
): Promise<NormalizedLocationResponse | null> => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        throw new AppError('Invalid coordinates', 400, 'INVALID_COORDINATES');
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        throw new AppError('Coordinates out of range', 400, 'INVALID_COORDINATES');
    }
    if (lat === 0 && lng === 0) {
        throw new AppError('Null-island coordinates are not allowed', 400, 'INVALID_COORDINATES');
    }

    const cacheKey = buildReverseGeocodeCacheKey(lat, lng);
    const cached = await getCache(cacheKey);
    if (cached) {
        return cached as NormalizedLocationResponse;
    }

    const boundaryMatch = await resolveBoundaryMatch(lat, lng);
    if (boundaryMatch) {
        await setCache(cacheKey, boundaryMatch, CACHE_TTLS.REVERSE_GEOCODE);
        return boundaryMatch;
    }

    const nearest = await findNearestReverseGeocodeCandidate(lat, lng);

    if (!nearest) return null;

    const [response] = await mapLocationDocsToResponses([nearest as LocationInputObject]);
    if (!response) return null;
    await setCache(cacheKey, response, CACHE_TTLS.REVERSE_GEOCODE);
    return response;
};
