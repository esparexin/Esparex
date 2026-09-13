import { toCanonicalGeoPoint } from './geoUtils';

/**
 * Formats a GeoJSON Point or coordinate input into a human-readable label.
 * Example: "Lng 77.5946, Lat 12.9716"
 *
 * This is a DISPLAY formatter, not a geo-math utility. Canonical owner: @esparex/shared.
 */
export function formatCoordinateLabel(point: unknown): string {
    const canonical = toCanonicalGeoPoint(point);
    if (!canonical) return '';
    const [lng, lat] = canonical.coordinates;
    return `Lng ${lng.toFixed(4)}, Lat ${lat.toFixed(4)}`;
}
