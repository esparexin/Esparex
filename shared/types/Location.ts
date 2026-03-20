export type LocationLevel =
    | "country"
    | "state"
    | "district"
    | "city"
    | "area"
    | "village";

export type CanonicalGeoPoint = {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
};

export type LocationCoordinates = CanonicalGeoPoint;

export interface Location {
    id: string;
    locationId?: string;
    parentId?: string | null;
    path?: string[];
    slug: string;
    name: string;        // Specific area/city name
    display: string;     // Formatted joint name (e.g., "Andheri East, Mumbai")
    displayName?: string;
    city: string;
    state: string;
    country: string;
    level: LocationLevel;
    coordinates: LocationCoordinates; // [lng, lat]
    isActive: boolean;
    isPopular: boolean;
    verificationStatus?: "pending" | "verified" | "rejected";
    priority?: number;
    tier?: number;
    aliases?: string[];
    distance?: number;    // Calculated distance for nearby searches
    createdAt?: string | Date;
    updatedAt?: string | Date;
}

export interface IngestLocationParams {
    name: string;
    city: string;
    state: string;
    country: string;
    coordinates: CanonicalGeoPoint;
    level?: LocationLevel;
}
