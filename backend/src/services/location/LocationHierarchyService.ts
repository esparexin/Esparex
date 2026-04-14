import {
    mongoose,
    Location,
    escapeRegExp,
    toTitleCase,
    formatLocationResponse,
    AppError,
    asString,
    normalizeLocationInput,
    normalizeLocationLevel,
    withPublicCanonicalLocationFilter,
    buildNormalizedFromLocationDoc,
    mapLocationDocsToResponses
} from './_shared/locationServiceBase';
import type {
    LocationInputObject,
    GeoJSONPoint,
    NormalizedLocationResponse
} from './_shared/locationServiceBase';
export { toGeoPoint, normalizeCoordinates } from './_shared/locationServiceBase';
import { mapToLocationResponse } from './LocationNormalizer';
export const ingestLocation = async (payload: {
    name: string;
    city?: string;
    district?: string;
    state?: string;
    country?: string;
    coordinates: GeoJSONPoint;
    level?: string;
    [key: string]: unknown;
}): Promise<NormalizedLocationResponse> => {
    if (payload.coordinates?.coordinates) {
        const [lng, lat] = payload.coordinates.coordinates;
        if (lng === 0 && lat === 0) {
            throw new AppError('Invalid null-island coordinate', 400, 'INVALID_COORDINATES');
        }
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const normalizedPayload = await normalizeLocationInput(payload, {
            documentId: new mongoose.Types.ObjectId(),
            resolveHierarchy: true,
            defaultCountry: 'Unknown'
        });

        // Dedup by normalizedName + level + parentId (state field removed Sprint 3)
        let existing = await Location.findOne({
            isActive: true,
            normalizedName: normalizedPayload.normalizedName,
            level: normalizedPayload.level,
            ...(normalizedPayload.parentId ? { parentId: normalizedPayload.parentId } : {})
        }).session(session).lean();

        if (existing) {
            await session.commitTransaction();
            session.endSession();
            return mapToLocationResponse(buildNormalizedFromLocationDoc(existing as LocationInputObject));
        }

        const radiusInRadians = 2 / 6378.1; // 2km radius
        existing = await Location.findOne({
            isActive: true,
            level: normalizedPayload.level,
            coordinates: {
                $geoWithin: {
                    $centerSphere: [normalizedPayload.coordinates.coordinates, radiusInRadians]
                }
            }
        }).session(session).lean();

        if (existing) {
            await session.commitTransaction();
            session.endSession();
            return mapToLocationResponse(buildNormalizedFromLocationDoc(existing as LocationInputObject));
        }

        // city/state flat fields omitted — use parentId/path hierarchy (Sprint 3)
        const [created] = await Location.create([{
            _id: normalizedPayload.documentId,
            name: normalizedPayload.name,
            normalizedName: normalizedPayload.normalizedName,
            slug: normalizedPayload.slug,
            country: normalizedPayload.country,
            level: normalizedPayload.level,
            parentId: normalizedPayload.parentId,
            path: normalizedPayload.path,
            coordinates: normalizedPayload.coordinates,
            aliases: normalizedPayload.aliases,
            isActive: true,
            isPopular: false
        }], { session });

        await session.commitTransaction();
        session.endSession();

        if (Array.isArray(created) && created.length > 0) {
            const createdObject = created[0].toObject();
            return mapToLocationResponse(buildNormalizedFromLocationDoc(createdObject as LocationInputObject));
        }
        throw new AppError('Failed to create location document', 500, 'LOCATION_CREATE_FAILED');
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};

/** Fetch city+state for a 6-digit Indian pincode via Nominatim (used as fallback) */
export const getStateLocations = async (): Promise<NormalizedLocationResponse[]> => {
    // Sprint 3: query by level='state' directly — no longer uses deprecated state field
    const stateAnchors = await Location.find(withPublicCanonicalLocationFilter({
        level: 'state',
    }))
        .select('name country level coordinates isPopular isActive verificationStatus parentId path')
        .sort({ isPopular: -1, priority: -1, name: 1 })
        .lean();

    return mapLocationDocsToResponses(stateAnchors as LocationInputObject[]);
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
        level: 'city',
        $or: [
            { parentId: stateAnchorDoc._id },
            { path: stateAnchorDoc._id }
        ]
    }))
        .select('name country level coordinates isPopular isActive verificationStatus parentId path')
        .sort({ isPopular: -1, priority: -1, name: 1 })
        .lean();

    return mapLocationDocsToResponses(cities as LocationInputObject[]);
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
        level: 'area',
        $or: [
            { parentId: cityAnchorDoc._id },
            { path: cityAnchorDoc._id }
        ]
    }))
        .select('name country level coordinates isPopular isActive verificationStatus parentId path')
        .sort({ isPopular: -1, priority: -1, name: 1 })
        .lean();

    return mapLocationDocsToResponses(areas as LocationInputObject[]);
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

    return mapLocationDocsToResponses(nearby as LocationInputObject[]);
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

    return mapLocationDocsToResponses(hierarchyItems as LocationInputObject[]);
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
            const [mappedNearest] = await mapLocationDocsToResponses([nearest as LocationInputObject]);
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
        withPublicCanonicalLocationFilter({ level: 'city', isPopular: true })
    )
        .select('name country level coordinates isPopular isActive verificationStatus parentId path')
        .sort({ priority: -1, name: 1 })
        .lean();

    if (fallbackLocation) {
        const [mappedFallbackLocation] = await mapLocationDocsToResponses([fallbackLocation as LocationInputObject]);
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
        const [mappedActiveLocation] = await mapLocationDocsToResponses([anyActiveLocation as LocationInputObject]);
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
