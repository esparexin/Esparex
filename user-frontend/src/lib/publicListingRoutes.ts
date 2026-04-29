import { LISTING_TYPE } from "@shared/enums/listingType";
import { generateAdSlug } from "@/lib/slug";

export type PublicListingType = "ad" | "service" | "spare_part";

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
    if (value === LISTING_TYPE.SERVICE || value === "service") {
        return "service";
    }
    if (value === LISTING_TYPE.SPARE_PART || value === "spare_part") {
        return "spare_part";
    }
    return "ad";
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
    const normalizedId = id == null ? "" : String(id).trim();
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
