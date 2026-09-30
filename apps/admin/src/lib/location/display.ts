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

/**
 * Preferred business location label (audit F35/B3).
 *
 * Single owner for the priority chain previously inline in
 * BusinessDetailsModal: explicit label → display → business fallback
 * (shop/street/landmark/pincode) → city,state → resolved display.
 * Order and fallbacks are identical to the inline version.
 */
export const resolveBusinessLocationDisplay = (business: {
    locationLabel?: string;
    location?: {
        display?: string;
        city?: string;
        state?: string;
        coordinates?: unknown;
    } | null;
}): string => {
    const location = business?.location ?? undefined;
    const fallbackDisplay = buildBusinessFallbackLocationDisplay(location);
    const cityState = [location?.city, location?.state].filter(Boolean).join(", ");
    const resolved = resolveLocationDisplay({
        locationLabel: business?.locationLabel,
        coordinates: location?.coordinates,
        fallbackDisplay,
        emptyText: "Location not available",
    });

    return (
        business?.locationLabel ||
        location?.display ||
        fallbackDisplay ||
        cityState ||
        resolved
    );
};
