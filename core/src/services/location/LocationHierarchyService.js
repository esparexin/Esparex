"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDefaultCenterLocation = exports.getHierarchy = exports.getNearbyLocations = exports.getAreasByCityId = exports.getCitiesByStateId = exports.getStateLocations = exports.ingestLocation = exports.normalizeCoordinates = exports.toGeoPoint = void 0;
const locationServiceBase_1 = require("./_shared/locationServiceBase");
var locationServiceBase_2 = require("./_shared/locationServiceBase");
Object.defineProperty(exports, "toGeoPoint", { enumerable: true, get: function () { return locationServiceBase_2.toGeoPoint; } });
Object.defineProperty(exports, "normalizeCoordinates", { enumerable: true, get: function () { return locationServiceBase_2.normalizeCoordinates; } });
const LocationNormalizer_1 = require("./LocationNormalizer");
const ingestLocation = async (payload) => {
    if (payload.coordinates?.coordinates) {
        const [lng, lat] = payload.coordinates.coordinates;
        if (lng === 0 && lat === 0) {
            throw new locationServiceBase_1.AppError('Invalid null-island coordinate', 400, 'INVALID_COORDINATES');
        }
    }
    const session = await locationServiceBase_1.mongoose.startSession();
    session.startTransaction();
    try {
        const normalizedPayload = await (0, locationServiceBase_1.normalizeLocationInput)(payload, {
            documentId: new locationServiceBase_1.mongoose.Types.ObjectId(),
            resolveHierarchy: true,
            defaultCountry: 'Unknown'
        });
        // Dedup by normalizedName + level + parentId (state field removed Sprint 3)
        let existing = await locationServiceBase_1.Location.findOne({
            isActive: true,
            normalizedName: normalizedPayload.normalizedName,
            level: normalizedPayload.level,
            ...(normalizedPayload.parentId ? { parentId: normalizedPayload.parentId } : {})
        }).session(session).lean();
        if (existing) {
            await session.commitTransaction();
            void session.endSession();
            return (0, LocationNormalizer_1.mapToLocationResponse)((0, locationServiceBase_1.buildNormalizedFromLocationDoc)(existing));
        }
        const radiusInRadians = 2 / 6378.1; // 2km radius
        existing = await locationServiceBase_1.Location.findOne({
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
            void session.endSession();
            return (0, LocationNormalizer_1.mapToLocationResponse)((0, locationServiceBase_1.buildNormalizedFromLocationDoc)(existing));
        }
        // city/state flat fields omitted — use parentId/path hierarchy (Sprint 3)
        const [created] = await locationServiceBase_1.Location.create([{
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
        void session.endSession();
        if (created) {
            const createdDoc = created;
            return (0, LocationNormalizer_1.mapToLocationResponse)((0, locationServiceBase_1.buildNormalizedFromLocationDoc)(createdDoc.toObject()));
        }
        throw new locationServiceBase_1.AppError('Failed to create location document', 500, 'LOCATION_CREATE_FAILED');
    }
    catch (error) {
        await session.abortTransaction();
        void session.endSession();
        throw error;
    }
};
exports.ingestLocation = ingestLocation;
/** Fetch city+state for a 6-digit Indian pincode via Nominatim (used as fallback) */
const getStateLocations = async () => {
    // Sprint 3: query by level='state' directly — no longer uses deprecated state field
    const stateAnchors = await locationServiceBase_1.Location.find((0, locationServiceBase_1.withPublicCanonicalLocationFilter)({
        level: 'state',
    }))
        .select('name country level coordinates isPopular isActive verificationStatus parentId path')
        .sort({ isPopular: -1, priority: -1, name: 1 })
        .lean();
    return (0, locationServiceBase_1.mapLocationDocsToResponses)(stateAnchors);
};
exports.getStateLocations = getStateLocations;
const getCitiesByStateId = async (stateId) => {
    if (!locationServiceBase_1.mongoose.Types.ObjectId.isValid(stateId)) {
        throw new locationServiceBase_1.AppError('Invalid stateId', 400, 'INVALID_LOCATION_ID');
    }
    const stateAnchorDoc = await locationServiceBase_1.Location.findOne((0, locationServiceBase_1.withPublicCanonicalLocationFilter)({ _id: new locationServiceBase_1.mongoose.Types.ObjectId(stateId) }))
        .select('_id name level country')
        .lean();
    if (!stateAnchorDoc)
        return [];
    // Sprint 3: query entirely via parentId/path hierarchy — no deprecated city/state fields
    const cities = await locationServiceBase_1.Location.find((0, locationServiceBase_1.withPublicCanonicalLocationFilter)({
        level: 'city',
        $or: [
            { parentId: stateAnchorDoc._id },
            { path: stateAnchorDoc._id }
        ]
    }))
        .select('name country level coordinates isPopular isActive verificationStatus parentId path')
        .sort({ isPopular: -1, priority: -1, name: 1 })
        .lean();
    return (0, locationServiceBase_1.mapLocationDocsToResponses)(cities);
};
exports.getCitiesByStateId = getCitiesByStateId;
const getAreasByCityId = async (cityId) => {
    if (!locationServiceBase_1.mongoose.Types.ObjectId.isValid(cityId)) {
        throw new locationServiceBase_1.AppError('Invalid cityId', 400, 'INVALID_LOCATION_ID');
    }
    const cityAnchorDoc = await locationServiceBase_1.Location.findOne((0, locationServiceBase_1.withPublicCanonicalLocationFilter)({ _id: new locationServiceBase_1.mongoose.Types.ObjectId(cityId) }))
        .select('_id name level country')
        .lean();
    if (!cityAnchorDoc)
        return [];
    // Sprint 3: query entirely via parentId/path hierarchy — no deprecated city/state fields
    const areas = await locationServiceBase_1.Location.find((0, locationServiceBase_1.withPublicCanonicalLocationFilter)({
        level: 'area',
        $or: [
            { parentId: cityAnchorDoc._id },
            { path: cityAnchorDoc._id }
        ]
    }))
        .select('name country level coordinates isPopular isActive verificationStatus parentId path')
        .sort({ isPopular: -1, priority: -1, name: 1 })
        .lean();
    return (0, locationServiceBase_1.mapLocationDocsToResponses)(areas);
};
exports.getAreasByCityId = getAreasByCityId;
const getNearbyLocations = async (lat, lng, radiusKm) => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        throw new locationServiceBase_1.AppError('Invalid coordinates', 400, 'INVALID_COORDINATES');
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        throw new locationServiceBase_1.AppError('Coordinates out of range', 400, 'INVALID_COORDINATES');
    }
    if (lat === 0 && lng === 0) {
        throw new locationServiceBase_1.AppError('Null-island coordinates are not allowed', 400, 'INVALID_COORDINATES');
    }
    const safeRadiusKm = Math.min(Math.max(Number(radiusKm) || 10, 1), 500);
    const nearby = await locationServiceBase_1.Location.find({
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
    return (0, locationServiceBase_1.mapLocationDocsToResponses)(nearby);
};
exports.getNearbyLocations = getNearbyLocations;
const getHierarchy = async (parentId, level, state) => {
    const query = { isActive: true };
    const normalizedLevel = (0, locationServiceBase_1.normalizeLocationLevel)(level);
    if (normalizedLevel) {
        query.level = normalizedLevel;
    }
    if (parentId && locationServiceBase_1.mongoose.Types.ObjectId.isValid(parentId)) {
        query.path = new locationServiceBase_1.mongoose.Types.ObjectId(parentId);
    }
    else {
        const normalizedState = (0, locationServiceBase_1.toTitleCase)((0, locationServiceBase_1.asString)(state) || '');
        if (normalizedState) {
            if (normalizedLevel === 'state') {
                query.name = new RegExp(`^${(0, locationServiceBase_1.escapeRegExp)(normalizedState)}$`, 'i');
            }
            else {
                const stateAnchor = await locationServiceBase_1.Location.findOne({
                    isActive: true,
                    level: 'state',
                    name: new RegExp(`^${(0, locationServiceBase_1.escapeRegExp)(normalizedState)}$`, 'i')
                })
                    .select('_id')
                    .lean();
                if (!stateAnchor) {
                    return [];
                }
                query.path = stateAnchor._id;
            }
        }
    }
    const hierarchyItems = await locationServiceBase_1.Location.find(query)
        .select('name country level coordinates isPopular isActive verificationStatus parentId path')
        .sort({ isPopular: -1, priority: -1, name: 1 })
        .limit(200)
        .lean();
    return (0, locationServiceBase_1.mapLocationDocsToResponses)(hierarchyItems);
};
exports.getHierarchy = getHierarchy;
const getDefaultCenterLocation = async (configuredCenter) => {
    const configuredLat = Number(configuredCenter?.lat);
    const configuredLng = Number(configuredCenter?.lng);
    const hasConfiguredCenter = Number.isFinite(configuredLat) &&
        Number.isFinite(configuredLng) &&
        (configuredLat !== 0 || configuredLng !== 0);
    if (hasConfiguredCenter) {
        const nearest = await locationServiceBase_1.Location.findOne((0, locationServiceBase_1.withPublicCanonicalLocationFilter)({
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
            const [mappedNearest] = await (0, locationServiceBase_1.mapLocationDocsToResponses)([nearest]);
            if (!mappedNearest) {
                return null;
            }
            return {
                ...mappedNearest,
                source: 'default',
            };
        }
        return {
            ...(0, locationServiceBase_1.formatLocationResponse)({
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
    const fallbackLocation = await locationServiceBase_1.Location.findOne((0, locationServiceBase_1.withPublicCanonicalLocationFilter)({ level: 'city', isPopular: true }))
        .select('name country level coordinates isPopular isActive verificationStatus parentId path')
        .sort({ priority: -1, name: 1 })
        .lean();
    if (fallbackLocation) {
        const [mappedFallbackLocation] = await (0, locationServiceBase_1.mapLocationDocsToResponses)([fallbackLocation]);
        if (!mappedFallbackLocation) {
            return null;
        }
        return {
            ...mappedFallbackLocation,
            source: 'default',
        };
    }
    const anyActiveLocation = await locationServiceBase_1.Location.findOne({ isActive: true, level: 'city' })
        .select('name country level coordinates isPopular isActive verificationStatus parentId path')
        .sort({ priority: -1, name: 1 })
        .lean();
    if (anyActiveLocation) {
        const [mappedActiveLocation] = await (0, locationServiceBase_1.mapLocationDocsToResponses)([anyActiveLocation]);
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
exports.getDefaultCenterLocation = getDefaultCenterLocation;
//# sourceMappingURL=LocationHierarchyService.js.map