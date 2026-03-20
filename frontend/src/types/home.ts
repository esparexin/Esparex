import type { GeoJSONPoint } from "@/types/location";

export interface NormalizedLocation {
    display: string; // The ready-to-render string (e.g., "Mumbai, Maharashtra")
    shopNo?: string;
    street?: string;
    city?: string;
    state?: string;
    address?: string; // Street address (Legacy/Fallback)
    pincode?: string;
    landmark?: string;
    /** Always a canonical GeoJSON Point after PR-3. */
    coordinates?: GeoJSONPoint;
}

export type { Ad as ApiAd, Category as ApiCategory } from '@shared/types';


// The shape used by UI components (AdCard, etc.)
export interface AdData {
    id: string; // Normalized to string
    title: string;
    price: number;

    // Images
    image: string; // Primary display image (backward compat)
    images?: string[]; // Full gallery support

    // Location
    location: NormalizedLocation; // No longer string | LocationData union

    // Time
    time: string; // Display string (e.g. "2 days ago" or "12 Oct")
    timestamp?: string; // ISO date for sorting

    category: string;
    spareParts?: string[];

    // Flags (Computed/Optional)
    isFeatured?: boolean;
    isPremium?: boolean;
    isSpotlight?: boolean;
    isBusiness?: boolean;
    verified?: boolean;
    description?: string;
    businessName?: string;
    businessId?: string;
    views?: number;
    seller?: string;
    sellerId?: string;
    phone?: string;
    condition?: string;
    distance?: number; // Distance from search location (km)
}

export interface CategoryData {
    id: string;
    name: string;
    slug: string;
    icon?: string;
}
