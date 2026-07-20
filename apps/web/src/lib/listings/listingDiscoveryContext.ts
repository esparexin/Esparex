import { LocationFacade } from "@esparex/shared";
import { normalizeOptionalObjectId } from "@/lib/normalizeOptionalObjectId";

export interface RelatedBusinessesDiscoveryContext {
    city?: string;
    locationId?: string;
    listingCategoryId?: string;
    brandId?: string;
    excludeBusinessId?: string;
    listingType?: string;
    latitude?: number;
    longitude?: number;
}

type ListingDiscoverySource = {
    location?: unknown;
    categoryId?: unknown;
    category?: unknown;
    brandId?: unknown;
    brand?: unknown;
    businessId?: unknown;
    listingType?: unknown;
} | null | undefined;

const asOptionalString = (value: unknown): string | undefined => {
    if (typeof value !== "string" && typeof value !== "number") {
        return undefined;
    }

    const normalized = String(value).trim();
    return normalized.length > 0 ? normalized : undefined;
};

const normalizeCanonicalObjectId = (value: unknown): string | undefined => {
    const normalized = normalizeOptionalObjectId(value);
    return normalized && /^[a-f\d]{24}$/i.test(normalized) ? normalized : undefined;
};

const asFiniteNumber = (value: unknown): number | undefined => (
    typeof value === "number" && Number.isFinite(value) ? value : undefined
);

export function buildRelatedBusinessesDiscoveryContext(
    listing: ListingDiscoverySource
): RelatedBusinessesDiscoveryContext {
    const location = LocationFacade.normalize(listing?.location);
    const coordinates =
        location?.coordinates &&
        Array.isArray(location.coordinates.coordinates) &&
        location.coordinates.coordinates.length >= 2
            ? location.coordinates.coordinates
            : null;

    return {
        city: asOptionalString(location?.city),
        locationId: normalizeCanonicalObjectId(location?.locationId),
        listingCategoryId: normalizeCanonicalObjectId(listing?.categoryId ?? listing?.category),
        brandId: normalizeCanonicalObjectId(listing?.brandId ?? listing?.brand),
        excludeBusinessId: normalizeCanonicalObjectId(listing?.businessId),
        listingType: asOptionalString(listing?.listingType),
        longitude: coordinates ? asFiniteNumber(coordinates[0]) : undefined,
        latitude: coordinates ? asFiniteNumber(coordinates[1]) : undefined,
    };
}

export function normalizeRelatedBusinessesDiscoveryContext(
    context: RelatedBusinessesDiscoveryContext | null | undefined
) {
    const city = asOptionalString(context?.city);
    const locationId = normalizeCanonicalObjectId(context?.locationId);
    const listingCategoryId = normalizeCanonicalObjectId(context?.listingCategoryId);
    const brandId = normalizeCanonicalObjectId(context?.brandId);
    const excludeBusinessId = normalizeCanonicalObjectId(context?.excludeBusinessId);
    const latitude = asFiniteNumber(context?.latitude);
    const longitude = asFiniteNumber(context?.longitude);
    const hasGeoPoint = typeof latitude === "number" && typeof longitude === "number";

    return {
        city,
        locationId,
        listingCategoryId,
        brandId,
        excludeBusinessId,
        listingType: asOptionalString(context?.listingType),
        latitude,
        longitude,
        hasGeoPoint,
        canSearch: Boolean(locationId || hasGeoPoint),
        queryParams: {
            locationId,
            listingCategoryId,
            brandId,
            excludeBusinessId,
            latitude,
            longitude,
            radiusKm: hasGeoPoint ? 35 : undefined,
            limit: 12,
            serviceOnly: true as const,
        },
    };
}
