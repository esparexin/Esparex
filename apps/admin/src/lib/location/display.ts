import {
    toCanonicalGeoPoint,
    formatCoordinateLabel,
} from "@esparex/shared";

export { toCanonicalGeoPoint as normalizeGeoPoint };

const asString = (value: unknown): string | undefined => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
};

export const buildBusinessFallbackLocationDisplay = (location: unknown): string | undefined => {
    if (!location || typeof location !== "object") return undefined;
    const record = location as Record<string, unknown>;
    const display = asString(record.display);
    if (display) return display;

    const address = asString(record.address);
    if (address) return address;

    const parts = [
        asString(record.shopNo),
        asString(record.street),
        asString(record.landmark),
        asString(record.pincode),
    ].filter((value): value is string => Boolean(value));

    return parts.length > 0 ? parts.join(", ") : undefined;
};

export const resolveLocationDisplay = (params: {
    locationLabel?: unknown;
    coordinates?: unknown;
    fallbackDisplay?: unknown;
    emptyText?: string;
}): string => {
    const explicitLabel = asString(params.locationLabel);
    if (explicitLabel) return explicitLabel;

    if (params.coordinates) {
        const formatted = formatCoordinateLabel(params.coordinates);
        if (formatted) return formatted;
    }

    const fallback = asString(params.fallbackDisplay);
    if (fallback) return fallback;

    return params.emptyText || "Location not available";
};
