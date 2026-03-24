import type { ListingTypeValue } from "@shared/enums/listingType";

export interface UiAd {
    id: string;
    title: string;
    slug?: string;
    price: number;
    currency: string;
    /** Primary display image (single, pre-resolved URL). */
    image?: string;
    /** Full gallery. Components prefer this over image when available. */
    images?: string[];
    location: string;
    isSpotlight?: boolean;
    isBoosted?: boolean;
    isBusiness?: boolean;
    verified?: boolean;
    sellerId?: string;
    brand?: string;
    model?: string;
    category?: string;
    description?: string;
    spareParts?: string[];
    deviceCondition?: "power_on" | "power_off";
    /** ISO date string — used by AdCardMeta dashboard variant. */
    createdAt?: string;
    /** Pre-formatted display string (e.g. "2 days ago"). */
    time?: string;
    views?: number | { total: number; unique: number; lastViewedAt?: string };
    listingType?: ListingTypeValue;
    planType?: string;
}
