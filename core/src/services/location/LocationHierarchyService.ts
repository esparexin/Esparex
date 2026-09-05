import {
    mongoose,
    Location,
    escapeRegExp,
    toTitleCase,
    formatLocationResponse,
    AppError,
    asString,
    normalizeLocationLevel,
    withPublicCanonicalLocationFilter,
    mapLocationDocsToResponses
} from './_shared/locationServiceBase';
import type {
    GeoJSONPoint,
    NormalizedLocationResponse
} from './_shared/locationServiceBase';
export { normalizeGeoPoint, normalizeCoordinates } from './_shared/locationServiceBase';

/** Fetch city+state for a 6-digit Indian pincode via Nominatim (used as fallback) */
export const getStateLocations = async (): Promise<NormalizedLocationResponse[]> => {
    // Sprint 3: query by level='state' directly — no longer uses deprecated state field
    const stateAnchors = await Location.find(withPublicCanonicalLocationFilter({
        level: 'state' as const,
    }))
        .select('name country level coordinates isPopular isActive verificationStatus parentId path')
        .sort({ isPopular: -1, priority: -1, name: 1 })
        .lean();

    return mapLocationDocsToResponses(stateAnchors);
};

export const getCitiesByStateId = async (
    stateId: string
): Promise<NormalizedLocationResponse[]> => {
    if (!mongoose.Types.ObjectId.isValid(stateId)) {
        throw new AppError('Invalid stateId', 400, 'INVALID_LOCATION_ID');
    }

    const stateAnchorDoc = await Location.findOne(
        withPublicCanonicalLocationFilter({ _id: new mongoose.Types.ObjectId(stateId) })
    )
        .select('_id name level country')
        .lean<{ _id: mongoose.Types.ObjectId; name?: string; level?: string; country?: string } | null>();

    if (!stateAnchorDoc) return [];

    // Sprint 3: query entirely via parentId/path hierarchy — no deprecated city/state fields
    const cities = await Location.find(withPublicCanonicalLocationFilter({
        level: 'city' as const,
        $or: [
            { parentId: stateAnchorDoc._id },
            { path: stateAnchorDoc._id }
        ]
    }))
        .select('name country level coordinates isPopular isActive verificationStatus parentId path')
        .sort({ isPopular: -1, priority: -1, name: 1 })
        .lean();

    return mapLocationDocsToResponses(cities);
};

export const getAreasByCityId = async (
    cityId: string
): Promise<NormalizedLocationResponse[]> => {
    if (!mongoose.Types.ObjectId.isValid(cityId)) {
        throw new AppError('Invalid cityId', 400, 'INVALID_LOCATION_ID');
    }

    const cityAnchorDoc = await Location.findOne(
        withPublicCanonicalLocationFilter({ _id: new mongoose.Types.ObjectId(cityId) })
    )
        .select('_id name level country')
        .lean<{ _id: mongoose.Types.ObjectId; name?: string; level?: string; country?: string } | null>();

    if (!cityAnchorDoc) return [];

    // Sprint 3: query entirely via parentId/path hierarchy — no deprecated city/state fields
    const areas = await Location.find(withPublicCanonicalLocationFilter({
        level: 'area' as const,
        $or: [
            { parentId: cityAnchorDoc._id },
            { path: cityAnchorDoc._id }
        ]
    }))
        .select('name country level coordinates isPopular isActive verificationStatus parentId path')
        .sort({ isPopular: -1, priority: -1, name: 1 })
        .lean();

    return mapLocationDocsToResponses(areas);
};

export const getNearbyLocations = async (
    lat: number,
    lng: number,
    radiusKm: number
): Promise<NormalizedLocationResponse[]> => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        throw new AppError('Invalid coordinates', 400, 'INVALID_COORDINATES');
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        throw new AppError('Coordinates out of range', 400, 'INVALID_COORDINATES');
    }
    if (lat === 0 && lng === 0) {
        throw new AppError('Null-island coordinates are not allowed', 400, 'INVALID_COORDINATES');
    }

    const safeRadiusKm = Math.min(Math.max(Number(radiusKm) || 10, 1), 500);
    const nearby = await Location.find({
        isActive: true,
        coordinates: {
            $near: {
                $geometry: { type: 'Point', coordinates: [lng, lat] },
                $maxDistance: safeRadiusKm * 1000
            }
        }
    })
        .select('name country level coordinates isPopular isActive verificationStatus parentId path')
        .limit(50)
        .lean();

    return mapLocationDocsToResponses(nearby);
};

export const getHierarchy = async (
    parentId?: string,
    level?: string,
    state?: string
): Promise<NormalizedLocationResponse[]> => {
    const query: Record<string, unknown> = { isActive: true };
    const normalizedLevel = normalizeLocationLevel(level);
    if (normalizedLevel) {
        query.level = normalizedLevel;
    }

    if (parentId && mongoose.Types.ObjectId.isValid(parentId)) {
        query.path = new mongoose.Types.ObjectId(parentId);
    } else {
        const normalizedState = toTitleCase(asString(state) || '');
        if (normalizedState) {
            if (normalizedLevel === 'state') {
                query.name = new RegExp(`^${escapeRegExp(normalizedState)}$`, 'i');
            } else {
                const stateAnchor = await Location.findOne({
                    isActive: true,
                    level: 'state',
                    name: new RegExp(`^${escapeRegExp(normalizedState)}$`, 'i')
                })
                    .select('_id')
                    .lean<{ _id: mongoose.Types.ObjectId } | null>();

                if (!stateAnchor) {
                    return [];
                }

                query.path = stateAnchor._id;
            }
        }
    }

    const hierarchyItems = await Location.find(query)
        .select('name country level coordinates isPopular isActive verificationStatus parentId path')
        .sort({ isPopular: -1, priority: -1, name: 1 })
        .limit(200)
        .lean();

    return mapLocationDocsToResponses(hierarchyItems);
};

export const getDefaultCenterLocation = async (
    configuredCenter?: { lat?: number; lng?: number }
): Promise<(NormalizedLocationResponse & { source: 'default' }) | null> => {
    const configuredLat = Number(configuredCenter?.lat);
    const configuredLng = Number(configuredCenter?.lng);
    const hasConfiguredCenter =
        Number.isFinite(configuredLat) &&
        Number.isFinite(configuredLng) &&
        (configuredLat !== 0 || configuredLng !== 0);

    if (hasConfiguredCenter) {
        const nearest = await Location.findOne(withPublicCanonicalLocationFilter({
            coordinates: {
                $near: {
                    $geometry: { type: 'Point', coordinates: [configuredLng, configuredLat] },
                    $maxDistance: 250000,
                },
            },
        }))
            .select('name country level coordinates isPopular isActive verificationStatus parentId path')
            .lean();

        if (nearest) {
            const [mappedNearest] = await mapLocationDocsToResponses([nearest]);
            if (!mappedNearest) {
                return null;
            }
            return {
                ...mappedNearest,
                source: 'default',
            };
        }

        return {
            ...formatLocationResponse({
                name: 'Default Center',
                display: 'Default Center',
                city: 'Default Center',
                state: '',
                country: 'Unknown',
                level: 'city',
                coordinates: {
                    type: 'Point',
                    coordinates: [configuredLng, configuredLat],
                },
            }),
            source: 'default',
        };
    }

    const fallbackLocation = await Location.findOne(
        withPublicCanonicalLocationFilter({ level: 'city' as const, isPopular: true })
    )
        .select('name country level coordinates isPopular isActive verificationStatus parentId path')
        .sort({ priority: -1, name: 1 })
        .lean();

    if (fallbackLocation) {
        const [mappedFallbackLocation] = await mapLocationDocsToResponses([fallbackLocation]);
        if (!mappedFallbackLocation) {
            return null;
        }
        return {
            ...mappedFallbackLocation,
            source: 'default',
        };
    }

    const anyActiveLocation = await Location.findOne({ isActive: true, level: 'city' })
        .select('name country level coordinates isPopular isActive verificationStatus parentId path')
        .sort({ priority: -1, name: 1 })
        .lean();

    if (anyActiveLocation) {
        const [mappedActiveLocation] = await mapLocationDocsToResponses([anyActiveLocation]);
        if (!mappedActiveLocation) {
            return null;
        }
        return {
            ...mappedActiveLocation,
            source: 'default',
        };
    }

    return null;
};

export const deriveLocationMetadata = async (
    locationId?: string | mongoose.Types.ObjectId,
    rawCoordinates?: unknown
): Promise<{ city?: string; state?: string; coordinates?: GeoJSONPoint }> => {
    let city: string | undefined;
    let state: string | undefined;
    let coordinates: GeoJSONPoint | undefined;

    if (rawCoordinates) {
        try {
            const { normalizeGeoPoint } = await import('./_shared/locationServiceBase').then(m => m as { normalizeGeoPoint?: (input: unknown) => GeoJSONPoint })
            if (normalizeGeoPoint) {
                coordinates = normalizeGeoPoint(rawCoordinates);
            }
        } catch {
            coordinates = undefined;
        }
    }

    if (!locationId) {
        return { city, state, coordinates };
    }

    try {
        const id = typeof locationId === 'string' ? new mongoose.Types.ObjectId(locationId) : locationId;
        const loc = await Location.findById(id).select('name level parentId coordinates').lean<{ 
            _id: mongoose.Types.ObjectId; 
            name: string; 
            level: string; 
            parentId?: mongoose.Types.ObjectId; 
            coordinates?: GeoJSONPoint;
        } | null>();

        if (!loc) {
            return { city, state, coordinates };
        }

        if (!coordinates && loc.coordinates) {
            coordinates = loc.coordinates;
        }

        if (loc.level === 'city') {
            city = loc.name;
            if (loc.parentId) {
                const parent = await Location.findById(loc.parentId).select('name level').lean<{ name: string; level: string } | null>();
                if (parent && parent.level === 'state') state = parent.name;
            }
        } else if (loc.level === 'state') {
            state = loc.name;
        } else if (loc.level === 'area' && loc.parentId) {
            const cityDoc = await Location.findById(loc.parentId).select('name parentId level').lean<{ name: string; parentId?: mongoose.Types.ObjectId; level: string } | null>();
            if (cityDoc && cityDoc.level === 'city') {
                city = cityDoc.name;
                if (cityDoc.parentId) {
                    const stateDoc = await Location.findById(cityDoc.parentId).select('name level').lean<{ name: string; level: string } | null>();
                    if (stateDoc && stateDoc.level === 'state') state = stateDoc.name;
                }
            }
        }
    } catch {
        // Suppress
    }

    return { city, state, coordinates };
};
