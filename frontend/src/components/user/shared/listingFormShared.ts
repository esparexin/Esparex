import type { ListingImage } from "@/types/listing";

type MaybeCoordinates = {
    coordinates?: unknown;
};

type MaybeBusinessLocation = {
    city?: string | null;
    state?: string | null;
    display?: string | null;
    locationId?: string | null;
    coordinates?: MaybeCoordinates | null;
} | null | undefined;

const DEFAULT_COORDINATES: [number, number] = [0, 0];

const toCoordinateTuple = (value: unknown): [number, number] => {
    if (!Array.isArray(value) || value.length !== 2) {
        return DEFAULT_COORDINATES;
    }
    const [lng, lat] = value;
    if (typeof lng !== "number" || typeof lat !== "number") {
        return DEFAULT_COORDINATES;
    }
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
        return DEFAULT_COORDINATES;
    }
    return [lng, lat];
};

export const extractEntityId = (value: unknown): string => {
    if (typeof value === "string") return value;
    if (value && typeof value === "object") {
        const record = value as Record<string, unknown>;
        const candidate = record.id ?? record._id;
        if (typeof candidate === "string") return candidate;
    }
    return "";
};

export const appendListingImages = (
    existingImages: ListingImage[],
    files: File[],
    maxImages = 10,
): ListingImage[] => {
    const seed = Date.now();
    const createdImages: ListingImage[] = files.map((file, index) => ({
        id: `${file.name}-${seed}-${index}`,
        file,
        preview: URL.createObjectURL(file),
        isRemote: false,
    }));
    return [...existingImages, ...createdImages].slice(0, maxImages);
};

export const removeListingImageById = (images: ListingImage[], id: string): ListingImage[] =>
    images.filter((image) => image.id !== id);

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

export const toListingLocationFromBusiness = (location: MaybeBusinessLocation) => {
    if (!location) return undefined;
    const city = typeof location.city === "string" ? location.city : "";
    const state = typeof location.state === "string" ? location.state : "";
    const display =
        (typeof location.display === "string" && location.display) ||
        [city, state].filter(Boolean).join(", ");
    const coordinates = toCoordinateTuple(location.coordinates?.coordinates);
    const locationId = typeof location.locationId === "string" ? location.locationId : undefined;

    return {
        city,
        state,
        display,
        coordinates: {
            type: "Point" as const,
            coordinates,
        },
        locationId,
    };
};

export const getBusinessLocationDisplay = (location: MaybeBusinessLocation): string =>
    (typeof location?.display === "string" && location.display) ||
    [location?.city, location?.state].filter(Boolean).join(", ");
