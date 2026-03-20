import { isValidLatitude, isValidLongitude } from '../../../../shared/utils/geoUtils';
import { normalizeToGeoJSON } from '../../utils/GeoUtils';

export interface LocationInputObject {
    id?: unknown;
    _id?: unknown;
    name?: unknown;
    city?: unknown;
    state?: unknown;
    country?: unknown;
    level?: unknown;
    display?: unknown;
    formattedAddress?: unknown;
    address?: unknown;
    pincode?: unknown;
    locationId?: unknown;
    parentId?: unknown;
    path?: unknown;
    latitude?: unknown;
    longitude?: unknown;
    lat?: unknown;
    lng?: unknown;
    type?: unknown;
    coordinates?: unknown;
    location?: LocationInputObject;
    criteria?: LocationInputObject;
    isActive?: unknown;
    verificationStatus?: unknown;
}

export const asString = (value: unknown): string | undefined => {
    if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
    }
    if (
        value &&
        typeof value === 'object' &&
        typeof (value as { toString?: () => string }).toString === 'function'
    ) {
        const converted = (value as { toString: () => string }).toString();
        return typeof converted === 'string' && converted.length > 0 ? converted : undefined;
    }
    return undefined;
};

export const toTitleCase = (value?: string): string => {
    if (!value) return '';
    return value
        .split(' ')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
};

export const equalsIgnoreCase = (a?: string, b?: string): boolean => {
    if (!a && !b) return true;
    if (!a || !b) return false;
    return a.trim().toLowerCase() === b.trim().toLowerCase();
};

export const coerceLocationInput = (input: unknown): LocationInputObject => {
    if (typeof input === 'string') {
        const value = input.trim();
        return {
            name: value,
            display: value,
            city: value,
        };
    }

    if (!input || typeof input !== 'object') {
        return {};
    }

    return input as LocationInputObject;
};

export const extractObjectIdString = (input: unknown): string | undefined => {
    const normalized = coerceLocationInput(input);
    const rawId =
        normalized.locationId ||
        normalized.id ||
        normalized._id ||
        normalized?.location?.locationId ||
        normalized?.location?.id ||
        normalized?.criteria?.locationId;

    return asString(rawId);
};

export const buildDisplay = (city?: string, state?: string, fallback?: string): string => {
    if (fallback && fallback.trim().length > 0) return fallback.trim();
    if (city && state) return `${city}, ${state}`;
    return city || state || 'Unknown Location';
};

export const normalizeCoordinates = (input: unknown): { type: "Point", coordinates: [number, number] } | undefined => {
    return normalizeToGeoJSON(input);
};
