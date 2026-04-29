import { sanitizeLocationLabel } from "@/lib/location/locationLabels";
import { formatLocationDisplay } from "@/lib/listings/locationUtils";
import { normalizeOptionalObjectId } from "@/lib/normalizeOptionalObjectId";

const OBJECT_ID_PATTERN = /^[a-f\d]{24}$/i;

type ListingCategoryLike = {
    listingType?: unknown;
    category?: unknown;
    categoryId?: unknown;
    categoryName?: unknown;
};

type ListingLocationLike = {
    location?: unknown;
    businessCity?: unknown;
    businessState?: unknown;
};

const toReadableLabel = (value: unknown): string | null => {
    if (typeof value !== "string" && typeof value !== "number") {
        return null;
    }

    const normalized = String(value).trim();
    if (!normalized || OBJECT_ID_PATTERN.test(normalized) || normalized === "Category") {
        return null;
    }

    return normalized;
};

export function resolveReadableListingReferenceLabel(value: unknown): string | null {
    if (value && typeof value === "object") {
        const record = value as Record<string, unknown>;
        return (
            toReadableLabel(record.name) ??
            toReadableLabel(record.title) ??
            toReadableLabel(record.label) ??
            null
        );
    }

    return toReadableLabel(value);
}

export type ResolvedListingType = "ad" | "service" | "spare_part";

export function resolveListingTypeValue(
    listing: { listingType?: unknown } | null | undefined
): ResolvedListingType {
    if (listing?.listingType === "service" || listing?.listingType === "spare_part") {
        return listing.listingType;
    }

    return "ad";
}

export function resolveListingTypeBadge(
    listing: { listingType?: unknown } | null | undefined
) {
    const listingType = resolveListingTypeValue(listing);

    if (listingType === "service") {
        return {
            type: listingType,
            label: "Service",
            className: "bg-emerald-50 text-emerald-700 border-emerald-100",
        };
    }

    if (listingType === "spare_part") {
        return {
            type: listingType,
            label: "Spare Part",
            className: "bg-violet-50 text-violet-700 border-violet-100",
        };
    }

    return {
        type: listingType,
        label: "Device",
        className: "bg-blue-50 text-link-dark border-blue-100",
    };
}

export function resolveListingCategoryLabel(
    listing: ListingCategoryLike | null | undefined,
    fallback = "Category"
): string {
    const explicitLabel =
        resolveReadableListingReferenceLabel(listing?.categoryName) ??
        resolveReadableListingReferenceLabel(listing?.category);

    if (explicitLabel) {
        return explicitLabel;
    }

    if (listing?.listingType === "service") {
        return "Service";
    }

    if (listing?.listingType === "spare_part") {
        return "Spare Part";
    }

    return fallback;
}

export function resolveListingCategoryBrowseValue(
    listing: ListingCategoryLike | null | undefined
): string | undefined {
    return (
        normalizeOptionalObjectId(listing?.categoryId) ??
        resolveReadableListingReferenceLabel(listing?.categoryName) ??
        resolveReadableListingReferenceLabel(listing?.category) ??
        undefined
    );
}

export function resolveListingLocationLabel(
    location: unknown,
    mode: "brief" | "full" = "brief"
): string {
    if (mode === "full") {
        const fullLabel = sanitizeLocationLabel(formatLocationDisplay(location));
        if (fullLabel) {
            return fullLabel;
        }
    }

    if (!location) {
        return "";
    }

    if (typeof location === "string") {
        return sanitizeLocationLabel(location) || "";
    }

    const record = location as Record<string, unknown>;
    return (
        sanitizeLocationLabel(typeof record.city === "string" ? record.city : undefined) ||
        sanitizeLocationLabel(typeof record.name === "string" ? record.name : undefined) ||
        sanitizeLocationLabel(typeof record.display === "string" ? record.display : undefined) ||
        sanitizeLocationLabel(typeof record.formattedAddress === "string" ? record.formattedAddress : undefined) ||
        sanitizeLocationLabel(typeof record.state === "string" ? record.state : undefined) ||
        sanitizeLocationLabel(typeof record.country === "string" ? record.country : undefined) ||
        ""
    );
}

export function resolveBusinessLocationLabel(
    listing: ListingLocationLike | null | undefined
): string {
    const businessCity = sanitizeLocationLabel(
        typeof listing?.businessCity === "string" ? listing.businessCity : undefined
    );
    const businessState = sanitizeLocationLabel(
        typeof listing?.businessState === "string" ? listing.businessState : undefined
    );
    const businessLocation = [businessCity, businessState].filter(Boolean).join(", ");

    return businessLocation || resolveListingLocationLabel(listing?.location, "full");
}
