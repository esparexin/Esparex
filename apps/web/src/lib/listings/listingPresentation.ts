import { sanitizeLocationLabel } from "@/lib/location/locationLabels";
import { LocationFacade } from "@esparex/shared";
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

const INVALID_TITLE_PATTERNS = [
    /websocket\.js:/i,
    /websocket\s+connection/i,
    /webpack/i,
    /http:\/\//i,
    /https:\/\//i,
    /^error:/i,
    /^uncaught/i,
    /^failed to/i,
    /^syntaxerror/i,
    /^undefined$/i,
    /^null$/i,
    /\[object\s+object\]/i,
];

/** Generic presentation title sanitizer preventing runtime error string leakage */
export function sanitizeListingTitle(
    rawTitle: unknown,
    listing?: ListingCategoryLike | null
): string {
    if (!rawTitle || typeof rawTitle !== "string") {
        return resolveListingCategoryLabel(listing, "Listing");
    }

    const trimmed = String(rawTitle)
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\*\*/g, "")
        .trim();
    if (!trimmed) {
        return resolveListingCategoryLabel(listing, "Listing");
    }

    if (INVALID_TITLE_PATTERNS.some((pattern) => pattern.test(trimmed))) {
        return resolveListingCategoryLabel(listing, "Listing");
    }

    return trimmed;
}

export function resolveListingLocationLabel(
    location: unknown,
    mode: "brief" | "full" = "brief"
): string {
    if (!location) {
        return "Location unavailable";
    }

    if (typeof location === "string") {
        const sanitized = sanitizeLocationLabel(location);
        return sanitized || "Location unavailable";
    }

    const record = location as Record<string, unknown>;

    const city = sanitizeLocationLabel(typeof record.city === "string" ? record.city : undefined);
    const district = sanitizeLocationLabel(typeof record.district === "string" ? record.district : undefined);
    const state = sanitizeLocationLabel(typeof record.state === "string" ? record.state : undefined);
    const country = sanitizeLocationLabel(typeof record.country === "string" ? record.country : undefined);
    const name = sanitizeLocationLabel(typeof record.name === "string" ? record.name : undefined);
    const display = sanitizeLocationLabel(typeof record.display === "string" ? record.display : undefined);
    const formattedAddress = sanitizeLocationLabel(typeof record.formattedAddress === "string" ? record.formattedAddress : undefined);

    if (mode === "full") {
        const fullLabel = sanitizeLocationLabel(LocationFacade.format(location));
        if (fullLabel) {
            return fullLabel;
        }
        if (city && state) {
            return `${city}, ${state}`;
        }
        if (country) {
            return country;
        }
    }

    // Geographic fallback chain for brief mode (Ad Card metadata):
    // city -> district -> state -> name/display/address -> "Location unavailable"
    if (city && city.toLowerCase() !== "india") {
        return city;
    }
    if (district && district.toLowerCase() !== "india") {
        return district;
    }
    if (state && state.toLowerCase() !== "india") {
        return state;
    }
    if (name && name !== country && name.toLowerCase() !== "india" && name.toLowerCase() !== "all india") {
        return name;
    }
    if (display && display !== country && display.toLowerCase() !== "india" && display.toLowerCase() !== "all india") {
        return display;
    }
    if (formattedAddress && formattedAddress.toLowerCase() !== "india" && formattedAddress.toLowerCase() !== "all india") {
        return formattedAddress;
    }

    return "Location unavailable";
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
