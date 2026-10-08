// ─── Listing geo normalization (P4 extract-before-split from normalizer.ts) ─
// Single owner for coordinate triple-branch parsing + range validation.
// Verbatim move: takes the location record value, returns the normalized copy.

export function normalizeListingGeo(
    location: unknown
): Record<string, unknown> | undefined {
    if (!location || typeof location !== 'object' || Array.isArray(location)) {
        return location as Record<string, unknown> | undefined;
    }
    const loc = { ...(location as Record<string, unknown>) };
    if (loc.coordinates) {
        let coords: [number, number] | null = null;
        if (Array.isArray(loc.coordinates) && loc.coordinates.length === 2) {
            const lng = Number(loc.coordinates[0]);
            const lat = Number(loc.coordinates[1]);
            if (Number.isFinite(lng) && Number.isFinite(lat)) {
                coords = [lng, lat];
            }
        } else if (typeof loc.coordinates === 'object' && loc.coordinates !== null) {
            const pointObj = loc.coordinates as Record<string, unknown>;
            if (Array.isArray(pointObj.coordinates) && pointObj.coordinates.length === 2) {
                const lng = Number(pointObj.coordinates[0]);
                const lat = Number(pointObj.coordinates[1]);
                if (Number.isFinite(lng) && Number.isFinite(lat)) {
                    coords = [lng, lat];
                }
            }
        }

        if (
            coords &&
            !(coords[0] === 0 && coords[1] === 0) &&
            coords[0] >= -180 && coords[0] <= 180 &&
            coords[1] >= -90 && coords[1] <= 90
        ) {
            loc.coordinates = {
                type: 'Point',
                coordinates: coords,
            };
        } else {
            delete loc.coordinates;
        }
    }
    return loc;
}
