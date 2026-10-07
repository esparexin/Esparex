import type { ListingImage } from "@/types/listing";

export type MaybeBusinessLocation = {
    city?: string | null;
    state?: string | null;
    display?: string | null;
} | null | undefined;




export const createRemoteListingImages = (value: unknown): ListingImage[] => {
    if (!Array.isArray(value)) return [];
    return value
        .filter((item): item is string => typeof item === "string" && item.length > 0)
        .map((url, index) => ({
            id: `remote-${index}-${url.slice(-16)}`,
            preview: url,
            file: undefined,
            isRemote: true,
        }));
};

export const getBusinessLocationDisplay = (location: MaybeBusinessLocation): string =>
    (typeof location?.display === "string" && location.display) ||
    [location?.city, location?.state].filter(Boolean).join(", ");
