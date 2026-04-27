"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeLocation = exports.normalizeLocationResponse = exports.mapToLocationResponse = exports.normalizeCoordinates = exports.toGeoPoint = void 0;
const locationServiceBase_1 = require("./_shared/locationServiceBase");
var locationServiceBase_2 = require("./_shared/locationServiceBase");
Object.defineProperty(exports, "toGeoPoint", { enumerable: true, get: function () { return locationServiceBase_2.toGeoPoint; } });
Object.defineProperty(exports, "normalizeCoordinates", { enumerable: true, get: function () { return locationServiceBase_2.normalizeCoordinates; } });
var locationServiceBase_3 = require("./_shared/locationServiceBase");
Object.defineProperty(exports, "mapToLocationResponse", { enumerable: true, get: function () { return locationServiceBase_3.mapToLocationResponse; } });
Object.defineProperty(exports, "normalizeLocationResponse", { enumerable: true, get: function () { return locationServiceBase_3.normalizeLocationResponse; } });
const normalizeLocation = async (input, options = {}) => {
    const normalizedInput = (0, locationServiceBase_1.coerceLocationInput)(input);
    if (!normalizedInput || Object.keys(normalizedInput).length === 0)
        return null;
    const rawLocationId = (0, locationServiceBase_1.extractObjectIdString)(normalizedInput);
    const hasLocationHints = Boolean(rawLocationId ||
        (0, locationServiceBase_1.asString)(normalizedInput.city) ||
        (0, locationServiceBase_1.asString)(normalizedInput.state) ||
        (0, locationServiceBase_1.asString)(normalizedInput.name) ||
        (0, locationServiceBase_1.asString)(normalizedInput.display) ||
        (0, locationServiceBase_1.asString)(normalizedInput.formattedAddress) ||
        (0, locationServiceBase_1.normalizeCoordinates)(normalizedInput));
    if (!hasLocationHints) {
        return null;
    }
    if (options.requireLocationId && !rawLocationId) {
        throw new locationServiceBase_1.AppError('Valid location selection is required', 400, 'LOCATION_REQUIRED');
    }
    const fromDb = await (0, locationServiceBase_1.resolveLocationFromDb)(normalizedInput);
    const parsedCoords = (0, locationServiceBase_1.normalizeCoordinates)(normalizedInput) || fromDb?.coordinates;
    if (options.requireLocationId && !fromDb?.locationId) {
        throw new locationServiceBase_1.AppError('Valid location selection is required', 400, 'LOCATION_REQUIRED');
    }
    if (options.requireLocationId && fromDb?.verificationStatus !== locationServiceBase_1.VERIFIED_LOCATION_STATUS) {
        throw new locationServiceBase_1.AppError('Valid verified location selection is required', 400, 'LOCATION_REQUIRED');
    }
    const hasCanonicalLocationId = Boolean(rawLocationId && fromDb?.locationId);
    if (hasCanonicalLocationId && fromDb) {
        const inputCity = (0, locationServiceBase_1.toTitleCase)((0, locationServiceBase_1.asString)(normalizedInput.city) || (0, locationServiceBase_1.asString)(normalizedInput.name) || '');
        const inputState = (0, locationServiceBase_1.toTitleCase)((0, locationServiceBase_1.asString)(normalizedInput.state) || '');
        const inputCountry = (0, locationServiceBase_1.toTitleCase)((0, locationServiceBase_1.asString)(normalizedInput.country) || '');
        const hasHierarchyMismatch = (!(0, locationServiceBase_1.equalsIgnoreCase)(inputCity, fromDb.city) && inputCity.length > 0) ||
            (!(0, locationServiceBase_1.equalsIgnoreCase)(inputState, fromDb.state) && inputState.length > 0) ||
            (!(0, locationServiceBase_1.equalsIgnoreCase)(inputCountry, fromDb.country) && inputCountry.length > 0);
        if (hasHierarchyMismatch) {
            locationServiceBase_1.logger.warn('Location hierarchy mismatch detected; canonical locationId values enforced', {
                locationId: rawLocationId,
                input: {
                    city: inputCity || undefined,
                    state: inputState || undefined,
                    country: inputCountry || undefined
                },
                canonical: {
                    city: fromDb.city,
                    state: fromDb.state,
                    country: fromDb.country
                }
            });
        }
    }
    const city = hasCanonicalLocationId
        ? (fromDb?.city || '')
        : (0, locationServiceBase_1.toTitleCase)((0, locationServiceBase_1.asString)(normalizedInput.city) ||
            fromDb?.city ||
            (0, locationServiceBase_1.asString)(normalizedInput.name) ||
            (0, locationServiceBase_1.asString)(normalizedInput.display) ||
            '');
    const state = hasCanonicalLocationId
        ? (fromDb?.state || '')
        : (0, locationServiceBase_1.toTitleCase)((0, locationServiceBase_1.asString)(normalizedInput.state) || fromDb?.state || '');
    const country = hasCanonicalLocationId
        ? (fromDb?.country || options.defaultCountry || '')
        : (0, locationServiceBase_1.toTitleCase)((0, locationServiceBase_1.asString)(normalizedInput.country) || fromDb?.country || options.defaultCountry || '');
    const level = hasCanonicalLocationId
        ? (0, locationServiceBase_1.normalizeLocationLevel)(fromDb?.level)
        : (0, locationServiceBase_1.normalizeLocationLevel)(normalizedInput.level) || (0, locationServiceBase_1.normalizeLocationLevel)(fromDb?.level);
    if (!city && options.requireLocationId) {
        throw new locationServiceBase_1.AppError('Location city is required', 400, 'LOCATION_REQUIRED');
    }
    const display = (0, locationServiceBase_1.asString)(normalizedInput.display) ||
        (0, locationServiceBase_1.asString)(normalizedInput.formattedAddress) ||
        fromDb?.display ||
        (0, locationServiceBase_1.buildDisplay)(city, state, fromDb?.name);
    return {
        id: fromDb?.id,
        locationId: fromDb?.locationId,
        name: (0, locationServiceBase_1.asString)(normalizedInput.name) || fromDb?.name || city || undefined,
        city: city || fromDb?.city || '',
        state: state || fromDb?.state || '',
        country,
        level,
        display,
        address: (0, locationServiceBase_1.asString)(normalizedInput.address) || (0, locationServiceBase_1.asString)(normalizedInput.formattedAddress),
        pincode: (0, locationServiceBase_1.asString)(normalizedInput.pincode),
        coordinates: parsedCoords,
        isActive: normalizedInput.isActive !== undefined ? Boolean(normalizedInput.isActive) : fromDb?.isActive,
        verificationStatus: (0, locationServiceBase_1.asString)(normalizedInput.verificationStatus) || fromDb?.verificationStatus,
    };
};
exports.normalizeLocation = normalizeLocation;
//# sourceMappingURL=LocationNormalizer.js.map