import {
    logger,
    toTitleCase,
    AppError,
    asString,
    buildDisplay,
    coerceLocationInput,
    equalsIgnoreCase,
    extractObjectIdString,
    normalizeCoordinates,
    normalizeLocationLevel,
    VERIFIED_LOCATION_STATUS,
    resolveLocationFromDb
} from './_shared/locationServiceBase';
import type {
    NormalizedLocation,
    NormalizeLocationOptions
} from './_shared/locationServiceBase';
export { toGeoPoint, normalizeCoordinates } from './_shared/locationServiceBase';
export { mapToLocationResponse, normalizeLocationResponse } from './_shared/locationServiceBase';

export const normalizeLocation = async (
    input: unknown,
    options: NormalizeLocationOptions = {}
): Promise<NormalizedLocation | null> => {
    const normalizedInput = coerceLocationInput(input);
    if (!normalizedInput || Object.keys(normalizedInput).length === 0) return null;
    const rawLocationId = extractObjectIdString(normalizedInput);

    const hasLocationHints = Boolean(
        rawLocationId ||
        asString(normalizedInput.city) ||
        asString(normalizedInput.state) ||
        asString(normalizedInput.name) ||
        asString(normalizedInput.display) ||
        asString(normalizedInput.formattedAddress) ||
        normalizeCoordinates(normalizedInput)
    );

    if (!hasLocationHints) {
        return null;
    }

    if (options.requireLocationId && !rawLocationId) {
        throw new AppError('Valid location selection is required', 400, 'LOCATION_REQUIRED');
    }

    const fromDb = await resolveLocationFromDb(normalizedInput);
    const parsedCoords = normalizeCoordinates(normalizedInput) || fromDb?.coordinates;

    if (options.requireLocationId && !fromDb?.locationId) {
        throw new AppError('Valid location selection is required', 400, 'LOCATION_REQUIRED');
    }
    if (options.requireLocationId && fromDb?.verificationStatus !== VERIFIED_LOCATION_STATUS) {
        throw new AppError('Valid verified location selection is required', 400, 'LOCATION_REQUIRED');
    }

    const hasCanonicalLocationId = Boolean(rawLocationId && fromDb?.locationId);

    if (hasCanonicalLocationId && fromDb) {
        const inputCity = toTitleCase(asString(normalizedInput.city) || asString(normalizedInput.name) || '');
        const inputState = toTitleCase(asString(normalizedInput.state) || '');
        const inputCountry = toTitleCase(asString(normalizedInput.country) || '');

        const hasHierarchyMismatch =
            (!equalsIgnoreCase(inputCity, fromDb.city) && inputCity.length > 0) ||
            (!equalsIgnoreCase(inputState, fromDb.state) && inputState.length > 0) ||
            (!equalsIgnoreCase(inputCountry, fromDb.country) && inputCountry.length > 0);

        if (hasHierarchyMismatch) {
            logger.warn('Location hierarchy mismatch detected; canonical locationId values enforced', {
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
        : toTitleCase(
            asString(normalizedInput.city) ||
            fromDb?.city ||
            asString(normalizedInput.name) ||
            asString(normalizedInput.display) ||
            ''
        );
    const state = hasCanonicalLocationId
        ? (fromDb?.state || '')
        : toTitleCase(asString(normalizedInput.state) || fromDb?.state || '');
    const country = hasCanonicalLocationId
        ? (fromDb?.country || options.defaultCountry || '')
        : toTitleCase(
            asString(normalizedInput.country) || fromDb?.country || options.defaultCountry || ''
        );
    const level = hasCanonicalLocationId
        ? normalizeLocationLevel(fromDb?.level)
        : normalizeLocationLevel(normalizedInput.level) || normalizeLocationLevel(fromDb?.level);

    if (!city && options.requireLocationId) {
        throw new AppError('Location city is required', 400, 'LOCATION_REQUIRED');
    }

    const display =
        asString(normalizedInput.display) ||
        asString(normalizedInput.formattedAddress) ||
        fromDb?.display ||
        buildDisplay(city, state, fromDb?.name);

    return {
        id: fromDb?.id,
        locationId: fromDb?.locationId,
        name: asString(normalizedInput.name) || fromDb?.name || city || undefined,
        city: city || fromDb?.city || '',
        state: state || fromDb?.state || '',
        country,
        level,
        display,
        address: asString(normalizedInput.address) || asString(normalizedInput.formattedAddress),
        pincode: asString(normalizedInput.pincode),
        coordinates: parsedCoords,
        isActive: normalizedInput.isActive !== undefined ? Boolean(normalizedInput.isActive) : fromDb?.isActive,
        verificationStatus: asString(normalizedInput.verificationStatus) || fromDb?.verificationStatus,
    };
};


