export type LocationLevel =
    | "country"
    | "state"
    | "district"
    | "city"
    | "area"
    | "village";

export type GeoJSONPoint = {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
};

/**
 * SSOT: Canonical Listing Location Contract
 * Used for all listing-related operations.
 */
export interface ListingLocation {
    display: string;
    city: string;
    state: string;
    country: string;
    coordinates?: GeoJSONPoint;
}

export interface Location {
    id: string;
    locationId?: string;
    parentId?: string | null;
    path?: string[];
    slug?: string;
    name: string;
    display: string;
    displayName?: string;
    city: string;
    state: string;
    country: string;
    pincode?: string;
    level: LocationLevel;
    coordinates: GeoJSONPoint;
    isActive: boolean;
    isPopular: boolean;
    verificationStatus?: "pending" | "verified" | "rejected";
}
