type LocationCoordinateShape =
    | {
        type?: string;
        coordinates?: [number, number];
    }
    | null
    | undefined;

export type LocationResponseLike = {
    _id?: { toString: () => string } | string;
    id?: string;
    parentId?: { toString: () => string } | string | null;
    path?: Array<{ toString: () => string } | string> | null;
    locationId?: string;
    slug?: string;
    name?: string;
    displayName?: string;
    display?: string;
    formattedAddress?: string;
    address?: string;
    city?: string;
    district?: string;
    state?: string;
    country?: string;
    level?: string;
    pincode?: string;
    coordinates?: LocationCoordinateShape;
    isPopular?: boolean;
    isActive?: boolean;
    verificationStatus?: string;
};

const toIdString = (value: LocationResponseLike["_id"]): string | undefined => {
    if (typeof value === "string" && value.length > 0) return value;
    if (value && typeof value === "object" && typeof value.toString === "function") {
        const converted = value.toString();
        return converted.length > 0 ? converted : undefined;
    }
    return undefined;
};

const toGeoPoint = (value: LocationCoordinateShape): { type: "Point"; coordinates: [number, number] } | undefined => {
    if (!value) return undefined;

    if (typeof value === "object") {
        if (value.type === "Point" && Array.isArray(value.coordinates)) {
            const [lng, lat] = value.coordinates;
            if (Number.isFinite(lat) && Number.isFinite(lng)) {
                return {
                    type: "Point",
                    coordinates: [Number(lng), Number(lat)],
                };
            }
        }
    }

    return undefined;
};

export const formatLocationResponse = (loc: LocationResponseLike) => {
    const resolvedId = toIdString(loc._id) || loc.id;
    const resolvedCoordinates = toGeoPoint(loc.coordinates);
    const resolvedParentId = toIdString(loc.parentId || undefined);
    const resolvedPath = Array.isArray(loc.path)
        ? loc.path
            .map((entry) => (typeof entry === "string" ? entry : entry?.toString?.()))
            .filter((entry): entry is string => typeof entry === "string" && entry.length > 0)
        : undefined;

    const display =
        loc.display ||
        (loc.level === "area" && loc.city
            ? `${loc.name}, ${loc.city}`
            : (loc.level === "city" || loc.level === "area") && loc.state
                ? `${loc.name}, ${loc.state}`
                : loc.name) ||
        loc.city ||
        "Unknown Location";

    return {
        id: resolvedId,
        locationId: loc.locationId || resolvedId,
        parentId: resolvedParentId,
        path: resolvedPath,
        slug: loc.slug,
        name: loc.name || loc.displayName || loc.city,
        displayName: loc.displayName || loc.name || loc.city,
        display,
        formattedAddress: loc.formattedAddress || loc.address || display,
        address: loc.address,
        city: loc.city || loc.name || "",
        district: loc.district,
        state: loc.state || "",
        country: loc.country || "Unknown",
        level: loc.level,
        pincode: loc.pincode,
        coordinates: resolvedCoordinates,
        isPopular: Boolean(loc.isPopular),
        isActive: loc.isActive !== undefined ? Boolean(loc.isActive) : true,
        verificationStatus: loc.verificationStatus || "verified",
    };
};
