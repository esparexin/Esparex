import {
    mongoose,
    locationRepository,
    adminBoundaryRepository,
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
    HierarchyLevel,
} from './_shared/locationServiceBase';
import { resolveSettlementWithNominatim } from './NominatimGeocode';
export { normalizeGeoPoint, normalizeCoordinates } from './_shared/locationServiceBase';

/* -------------------------------------------------------------------------- */
/* CONSTANTS                                                                  */
/* -------------------------------------------------------------------------- */

const SETTLEMENT_SELECT_FIELDS =
    'name country level coordinates isPopular isActive verificationStatus parentId path pincode';

/* -------------------------------------------------------------------------- */
/* BOUNDARY MATCH (PRIMARY PATH)                                              */
/* -------------------------------------------------------------------------- */

const resolveBoundaryMatch = async (
    lat: number,
    lng: number,
): Promise<NormalizedLocationResponse | null> => {
    const point = { type: 'Point', coordinates: [lng, lat] as [number, number] };
    const boundaries = await adminBoundaryRepository.findBoundaries({
        geometry: { $geoIntersects: { $geometry: point } },
    })
        .select('locationId level')
        .lean<Array<{ locationId: mongoose.Types.ObjectId; level: HierarchyLevel }>>();

    if (boundaries.length === 0) {
        logger.warn('No AdminBoundary found for coordinates; falling back.', { lat, lng });
        return null;
    }

    const boundary = [...boundaries].sort(
        (a, b) =>
            (REVERSE_GEOCODE_LEVEL_PRIORITY[b.level] || 0) -
            (REVERSE_GEOCODE_LEVEL_PRIORITY[a.level] || 0),
    )[0];

    const stateLocation = await getPublicCanonicalLocationById(boundary?.locationId);
    if (!boundary || !stateLocation) {
        logger.warn('AdminBoundary matched but parent location missing.', {
            boundaryId: boundary?.locationId, coordinates: { lat, lng },
        });
        return null;
    }

    // Use Nominatim to resolve the correct city/mandal, then match in DB.
    const settlement = await resolveSettlementWithNominatim(
        lat, lng, REVERSE_GEOCODE_SETTLEMENT_MAX_DISTANCE_METERS * 2,
    );
    if (settlement) {
        const [mapped] = await mapLocationDocsToResponses([settlement]);
        if (mapped) {
            return {
                ...mapped,
                coordinates: { type: 'Point', coordinates: [lng, lat] },
                isSnapped: false,
            } as NormalizedLocationResponse;
        }
    }

    // Fallback: raw $near if Nominatim unavailable
    const nearestCity = await locationRepository
        .findOne(withPublicCanonicalLocationFilter({
            level: { $in: REVERSE_GEOCODE_SETTLEMENT_LEVELS },
            coordinates: {
                $near: {
                    $geometry: { type: 'Point', coordinates: [lng, lat] },
                    $maxDistance: REVERSE_GEOCODE_SETTLEMENT_MAX_DISTANCE_METERS * 2,
                },
            },
        }))
        .select(SETTLEMENT_SELECT_FIELDS)
        .lean<LocationInputObject | null>();

    if (nearestCity) {
        const [mappedCity] = await mapLocationDocsToResponses([nearestCity]);
        if (mappedCity) {
            return {
                ...mappedCity,
                coordinates: { type: 'Point', coordinates: [lng, lat] },
                isSnapped: false,
            } as NormalizedLocationResponse;
        }
    }

    // Fallback to state-level response
    const [mappedState] = await mapLocationDocsToResponses([stateLocation]);
    if (mappedState) {
        return {
            ...mappedState,
            coordinates: { type: 'Point', coordinates: [lng, lat] },
            isSnapped: false,
        };
    }
    return null;
};

/* -------------------------------------------------------------------------- */
/* NEAREST CANDIDATE FALLBACK (NO BOUNDARY DATA)                              */
/* -------------------------------------------------------------------------- */

const findNearestReverseGeocodeCandidate = async (
    lat: number,
    lng: number,
): Promise<LocationInputObject | null> => {
    // Primary: use Nominatim to identify the correct city/mandal
    const nominatimMatch = await resolveSettlementWithNominatim(
        lat, lng, REVERSE_GEOCODE_SETTLEMENT_MAX_DISTANCE_METERS,
    );
    if (nominatimMatch) return nominatimMatch;

    // Fallback: raw $near (if Nominatim is down or returns no result)
    const nearestSettlement = await locationRepository
        .findOne(withPublicCanonicalLocationFilter({
            level: { $in: REVERSE_GEOCODE_SETTLEMENT_LEVELS },
            coordinates: {
                $near: {
                    $geometry: { type: 'Point', coordinates: [lng, lat] },
                    $maxDistance: REVERSE_GEOCODE_SETTLEMENT_MAX_DISTANCE_METERS,
                },
            },
        }))
        .select(SETTLEMENT_SELECT_FIELDS)
        .lean<LocationInputObject | null>();

    if (nearestSettlement) return nearestSettlement;

    // Regional fallback (state/country level)
    return locationRepository
        .findOne(withPublicCanonicalLocationFilter({
            level: { $in: REVERSE_GEOCODE_REGIONAL_LEVELS },
            coordinates: {
                $near: {
                    $geometry: { type: 'Point', coordinates: [lng, lat] },
                    $maxDistance: REVERSE_GEOCODE_REGIONAL_MAX_DISTANCE_METERS,
                },
            },
        }))
        .select(SETTLEMENT_SELECT_FIELDS)
        .lean<LocationInputObject | null>();
};

/* -------------------------------------------------------------------------- */
/* PUBLIC API                                                                 */
/* -------------------------------------------------------------------------- */

export const reverseGeocode = async (
    lat: number,
    lng: number,
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

    const [response] = await mapLocationDocsToResponses([nearest]);
    if (!response) return null;

    const finalResponse = {
        ...response,
        coordinates: { type: 'Point', coordinates: [lng, lat] as [number, number] },
        isSnapped: false,
    } as NormalizedLocationResponse;

    await setCache(cacheKey, finalResponse, CACHE_TTLS.REVERSE_GEOCODE);
    return finalResponse;
};
