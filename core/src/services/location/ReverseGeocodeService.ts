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
import { haversineDistance } from '../../utils/mongoGeoUtils';
import type {
    LocationInputObject,
    NormalizedLocationResponse,
    HierarchyLevel
} from './_shared/locationServiceBase';
export { toGeoPoint, normalizeCoordinates } from './_shared/locationServiceBase';

const SNAP_THRESHOLD_KM = 7.5; // Confidence radius for snapping to city center
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

    // After identifying the state, find the nearest settlement within it.
    // Increased distance to 100km and removed strict boundary path requirement 
    // if a point match is found nearby, as some settlements might have inconsistent parent paths.
    const nearestCity = await Location.findOne(withPublicCanonicalLocationFilter({
        level: { $in: REVERSE_GEOCODE_SETTLEMENT_LEVELS },
        coordinates: {
            $near: {
                $geometry: { type: 'Point', coordinates: [lng, lat] },
                $maxDistance: REVERSE_GEOCODE_SETTLEMENT_MAX_DISTANCE_METERS * 2, // 100km
            }
        }
    }))
        .select('name country level coordinates isPopular isActive verificationStatus parentId path pincode')
        .lean<LocationInputObject | null>();

    if (nearestCity) {
        const cityCoords = (nearestCity.coordinates as any)?.coordinates;
        if (cityCoords) {
            const distance = haversineDistance(lat, lng, cityCoords[1], cityCoords[0]);
            if (distance <= SNAP_THRESHOLD_KM) {
                logger.info('Snapping coordinates to nearest city center.', { 
                    city: nearestCity.name, 
                    distance: distance.toFixed(2),
                    from: { lat, lng },
                    to: { lat: cityCoords[1], lng: cityCoords[0] }
                });
                // Update local coordinates to match canonical city center
                lat = cityCoords[1];
                lng = cityCoords[0];
            }
        }

        const [mappedCity] = await mapLocationDocsToResponses([nearestCity]);
        if (mappedCity) {
            const isSnapped = lat === cityCoords?.[1] && lng === cityCoords?.[0];
            return {
                ...mappedCity,
                coordinates: { type: 'Point', coordinates: [lng, lat] },
                isSnapped: isSnapped
            } as any;
        }
    }

    // Fallback to state-level response if no city found within range
    const [mappedState] = await mapLocationDocsToResponses([stateLocation as LocationInputObject]);
    if (mappedState) {
        return {
            ...mappedState,
            coordinates: { type: 'Point', coordinates: [lng, lat] }
        };
    }
    return null;
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

    const [response] = await mapLocationDocsToResponses([nearest]);
    if (!response) return null;

    const finalResponse = {
        ...response,
        coordinates: { type: 'Point', coordinates: [lng, lat] as [number, number] }
    };

    const candidateCoords = (nearest.coordinates as any)?.coordinates;
    if (candidateCoords) {
        const distance = haversineDistance(lat, lng, candidateCoords[1], candidateCoords[0]);
        if (distance <= SNAP_THRESHOLD_KM) {
            finalResponse.coordinates.coordinates = [candidateCoords[0], candidateCoords[1]];
            (finalResponse as any).isSnapped = true;
        }
    }

    await setCache(cacheKey, finalResponse, CACHE_TTLS.REVERSE_GEOCODE);
    return finalResponse as NormalizedLocationResponse;
};
