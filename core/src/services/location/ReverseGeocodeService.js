"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reverseGeocode = exports.normalizeCoordinates = exports.toGeoPoint = void 0;
const locationServiceBase_1 = require("./_shared/locationServiceBase");
const mongoGeoUtils_1 = require("../../utils/mongoGeoUtils");
var locationServiceBase_2 = require("./_shared/locationServiceBase");
Object.defineProperty(exports, "toGeoPoint", { enumerable: true, get: function () { return locationServiceBase_2.toGeoPoint; } });
Object.defineProperty(exports, "normalizeCoordinates", { enumerable: true, get: function () { return locationServiceBase_2.normalizeCoordinates; } });
const SNAP_THRESHOLD_KM = 7.5; // Confidence radius for snapping to city center
const resolveBoundaryMatch = async (lat, lng) => {
    const point = { type: 'Point', coordinates: [lng, lat] };
    const boundaries = await locationServiceBase_1.AdminBoundary.find({
        geometry: {
            $geoIntersects: {
                $geometry: point
            }
        }
    })
        .select('locationId level')
        .lean();
    if (boundaries.length === 0) {
        locationServiceBase_1.logger.warn('No AdminBoundary found for coordinates; falling back to nearest point search.', { lat, lng });
        return null;
    }
    const boundary = [...boundaries].sort((a, b) => (locationServiceBase_1.REVERSE_GEOCODE_LEVEL_PRIORITY[b.level] || 0) - (locationServiceBase_1.REVERSE_GEOCODE_LEVEL_PRIORITY[a.level] || 0))[0];
    const stateLocation = await (0, locationServiceBase_1.getPublicCanonicalLocationById)(boundary?.locationId);
    if (!boundary || !stateLocation) {
        locationServiceBase_1.logger.warn('AdminBoundary matched but parent location is missing or inactive.', {
            boundaryId: boundary?.locationId,
            coordinates: { lat, lng }
        });
        return null;
    }
    // After identifying the state, find the nearest settlement within it.
    // Increased distance to 100km and removed strict boundary path requirement 
    // if a point match is found nearby, as some settlements might have inconsistent parent paths.
    const nearestCity = await locationServiceBase_1.Location.findOne((0, locationServiceBase_1.withPublicCanonicalLocationFilter)({
        level: { $in: locationServiceBase_1.REVERSE_GEOCODE_SETTLEMENT_LEVELS },
        coordinates: {
            $near: {
                $geometry: { type: 'Point', coordinates: [lng, lat] },
                $maxDistance: locationServiceBase_1.REVERSE_GEOCODE_SETTLEMENT_MAX_DISTANCE_METERS * 2, // 100km
            }
        }
    }))
        .select('name country level coordinates isPopular isActive verificationStatus parentId path pincode')
        .lean();
    if (nearestCity) {
        const cityCoords = nearestCity.coordinates?.coordinates;
        if (cityCoords) {
            const distance = (0, mongoGeoUtils_1.haversineDistance)(lat, lng, cityCoords[1], cityCoords[0]);
            if (distance <= SNAP_THRESHOLD_KM) {
                locationServiceBase_1.logger.info('Snapping coordinates to nearest city center.', {
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
        const [mappedCity] = await (0, locationServiceBase_1.mapLocationDocsToResponses)([nearestCity]);
        if (mappedCity) {
            const isSnapped = lat === cityCoords?.[1] && lng === cityCoords?.[0];
            return {
                ...mappedCity,
                coordinates: { type: 'Point', coordinates: [lng, lat] },
                isSnapped: isSnapped
            };
        }
    }
    // Fallback to state-level response if no city found within range
    const [mappedState] = await (0, locationServiceBase_1.mapLocationDocsToResponses)([stateLocation]);
    if (mappedState) {
        return {
            ...mappedState,
            coordinates: { type: 'Point', coordinates: [lng, lat] }
        };
    }
    return null;
};
const findNearestReverseGeocodeCandidate = async (lat, lng) => {
    const nearestSettlement = await locationServiceBase_1.Location.findOne((0, locationServiceBase_1.withPublicCanonicalLocationFilter)({
        level: { $in: locationServiceBase_1.REVERSE_GEOCODE_SETTLEMENT_LEVELS },
        coordinates: {
            $near: {
                $geometry: { type: 'Point', coordinates: [lng, lat] },
                $maxDistance: locationServiceBase_1.REVERSE_GEOCODE_SETTLEMENT_MAX_DISTANCE_METERS,
            }
        }
    }))
        .select('name country level coordinates isPopular isActive verificationStatus parentId path pincode')
        .lean();
    if (nearestSettlement) {
        return nearestSettlement;
    }
    return locationServiceBase_1.Location.findOne((0, locationServiceBase_1.withPublicCanonicalLocationFilter)({
        level: { $in: locationServiceBase_1.REVERSE_GEOCODE_REGIONAL_LEVELS },
        coordinates: {
            $near: {
                $geometry: { type: 'Point', coordinates: [lng, lat] },
                $maxDistance: locationServiceBase_1.REVERSE_GEOCODE_REGIONAL_MAX_DISTANCE_METERS,
            }
        }
    }))
        .select('name country level coordinates isPopular isActive verificationStatus parentId path pincode')
        .lean();
};
const reverseGeocode = async (lat, lng) => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        throw new locationServiceBase_1.AppError('Invalid coordinates', 400, 'INVALID_COORDINATES');
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        throw new locationServiceBase_1.AppError('Coordinates out of range', 400, 'INVALID_COORDINATES');
    }
    if (lat === 0 && lng === 0) {
        throw new locationServiceBase_1.AppError('Null-island coordinates are not allowed', 400, 'INVALID_COORDINATES');
    }
    const cacheKey = (0, locationServiceBase_1.buildReverseGeocodeCacheKey)(lat, lng);
    const cached = await (0, locationServiceBase_1.getCache)(cacheKey);
    if (cached) {
        return cached;
    }
    const boundaryMatch = await resolveBoundaryMatch(lat, lng);
    if (boundaryMatch) {
        await (0, locationServiceBase_1.setCache)(cacheKey, boundaryMatch, locationServiceBase_1.CACHE_TTLS.REVERSE_GEOCODE);
        return boundaryMatch;
    }
    const nearest = await findNearestReverseGeocodeCandidate(lat, lng);
    if (!nearest)
        return null;
    const [response] = await (0, locationServiceBase_1.mapLocationDocsToResponses)([nearest]);
    if (!response)
        return null;
    const finalResponse = {
        ...response,
        coordinates: { type: 'Point', coordinates: [lng, lat] }
    };
    const candidateCoords = nearest.coordinates?.coordinates;
    if (candidateCoords) {
        const distance = (0, mongoGeoUtils_1.haversineDistance)(lat, lng, candidateCoords[1], candidateCoords[0]);
        if (distance <= SNAP_THRESHOLD_KM) {
            finalResponse.coordinates.coordinates = [candidateCoords[0], candidateCoords[1]];
            finalResponse.isSnapped = true;
        }
    }
    await (0, locationServiceBase_1.setCache)(cacheKey, finalResponse, locationServiceBase_1.CACHE_TTLS.REVERSE_GEOCODE);
    return finalResponse;
};
exports.reverseGeocode = reverseGeocode;
//# sourceMappingURL=ReverseGeocodeService.js.map