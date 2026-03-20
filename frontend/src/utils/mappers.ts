import { toSafeImageSrc } from '@/lib/image/imageUrl';

export interface BackendAd {
    title: string;
    price: number;
    currency?: string;
    images?: string[];
    location?: { city?: string; state?: string };
    isSpotlight?: boolean;
    brand?: string;
    model?: string;
    category?: string;
    [key: string]: unknown;
}

export interface UiAd {
    id: string;
    title: string;
    slug?: string;
    price: number;
    currency: string;
    image: string;
    location: string;
    isSpotlight?: boolean;
    brand?: string;
    model?: string;
    category?: string;
    planType?: string;
}

export const mapBackendAdToUiAd = (ad: BackendAd): UiAd => {
    return {
        id: String(ad.id || ""),
        title: ad.title || "Untitled Ad",
        slug: ad.title ? ad.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") : "",
        price: ad.price || 0,
        currency: ad.currency || "INR",
        image: toSafeImageSrc(ad.images?.[0], ""),
        location: ad.location?.city || "Unknown",
        isSpotlight: ad.isSpotlight,
        brand: ad.brand,
        model: ad.model,
        category: ad.category,
        planType: ad.isSpotlight ? 'Spotlight' : undefined
    };
};
