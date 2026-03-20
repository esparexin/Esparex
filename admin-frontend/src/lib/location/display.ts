type GeoJSONPoint = {
    type?: unknown;
    coordinates?: unknown;
};

const asString = (value: unknown): string | undefined => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
};

const toGeoPoint = (value: unknown): { type: "Point"; coordinates: [number, number] } | undefined => {
    if (!value || typeof value !== "object") return undefined;
    const point = value as GeoJSONPoint;
    if (point.type !== "Point") return undefined;
    if (!Array.isArray(point.coordinates) || point.coordinates.length !== 2) return undefined;

    const lng = Number(point.coordinates[0]);
    const lat = Number(point.coordinates[1]);
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) return undefined;
    if (lng < -180 || lng > 180 || lat < -90 || lat > 90) return undefined;
    if (lng === 0 && lat === 0) return undefined;

    return {
        type: "Point",
        coordinates: [lng, lat],
    };
};

const formatCoordinateLabel = (point: { type: "Point"; coordinates: [number, number] }): string => {
    const [lng, lat] = point.coordinates;
    return `Lng ${lng.toFixed(4)}, Lat ${lat.toFixed(4)}`;
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

    const geoPoint = toGeoPoint(params.coordinates);
    if (geoPoint) {
        return formatCoordinateLabel(geoPoint);
    }

    const fallback = asString(params.fallbackDisplay);
    if (fallback) return fallback;

    return params.emptyText || "Location not available";
};
