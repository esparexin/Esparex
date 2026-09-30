import { LISTING_TYPE, type ListingTypeValue } from "@esparex/contracts";
import { generateAdSlug } from "@/lib/slug";

export type PublicListingType = ListingTypeValue;

export interface PublicListingRouteInput {
    id?: string | number | null;
    listingType?: unknown;
    slug?: string | null;
    seoSlug?: string | null;
    title?: string | null;
}

const LISTING_BASE_PATH: Record<PublicListingType, string> = {
    ad: "/ads",
    service: "/services",
    spare_part: "/spare-part-listings",
};

const normalizePublicListingType = (value: unknown): PublicListingType => {
    if (!value) return LISTING_TYPE.AD;
    if (value === LISTING_TYPE.SERVICE) {
        return LISTING_TYPE.SERVICE;
    }
    if (value === LISTING_TYPE.SPARE_PART) {
        return LISTING_TYPE.SPARE_PART;
    }
    if (typeof value === "string") {
        const normalized = value.toLowerCase().trim().replace(/-/g, "_");
        if (normalized === LISTING_TYPE.SERVICE || normalized === "services") {
            return LISTING_TYPE.SERVICE;
        }
        if (
            normalized === LISTING_TYPE.SPARE_PART ||
            normalized === "spare_parts" ||
            normalized === "spareparts" ||
            normalized === "sparepart"
        ) {
            return LISTING_TYPE.SPARE_PART;
        }
    }
    return LISTING_TYPE.AD;
};

export const buildPublicListingDetailRoute = ({
    id,
    listingType,
    slug,
    seoSlug,
    title,
}: PublicListingRouteInput): string => {
    const type = normalizePublicListingType(listingType);
    const basePath = LISTING_BASE_PATH[type];
    const normalizedId = id == undefined ? "" : String(id).trim();
    const normalizedSlug =
        (slug && String(slug).trim()) ||
        (seoSlug && String(seoSlug).trim()) ||
        generateAdSlug(String(title || ""));

    if (normalizedSlug && normalizedId) {
        return `${basePath}/${encodeURIComponent(normalizedSlug)}-${encodeURIComponent(normalizedId)}`;
    }

    if (normalizedId) {
        return `${basePath}/${encodeURIComponent(normalizedId)}`;
    }

    if (normalizedSlug) {
        return `${basePath}/${encodeURIComponent(normalizedSlug)}`;
    }

    return "/search?type=ad";
};
