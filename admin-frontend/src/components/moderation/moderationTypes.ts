export type ModerationStatus =
    | "pending"
    | "live"
    | "rejected"
    | "deactivated"
    | "sold"
    | "expired";

export type ModerationItem = {
    id: string;
    adId?: string;
    title: string;
    description?: string;
    price: number;
    priceMin?: number;
    priceMax?: number;
    diagnosticFee?: number;
    currency: string;
    images: string[];
    status: ModerationStatus;
    createdAt: string;
    updatedAt?: string;
    isDeleted?: boolean;
    approvedAt?: string;
    expiresAt?: string;
    daysRemaining?: number;
    categoryName?: string;
    brandName?: string;
    modelName?: string;
    sellerId?: string;
    sellerName?: string;
    sellerPhone?: string;
    locationLabel?: string;
    locationCoordinates?: {
        type: "Point";
        coordinates: [number, number];
    };
    devicePowerOn?: boolean;
    deviceCondition?: "power_on" | "power_off";
    onsiteService?: boolean;
    turnaroundTime?: string;
    warranty?: string;
    included?: string;
    excluded?: string;
    serviceTypeIds?: string[];
    sparePartId?: string;
    condition?: "new" | "used" | "refurbished";
    stock?: number;
    deviceType?: string;
    listingType?: ListingTypeValue;
    reportCount: number;
    fraudScore: number;
    riskScore?: number;
};

import type { ListingTypeValue } from "@shared/enums/listingType";

export type ModerationFilters = {
    search: string;
    status: "all" | ModerationStatus;
    sellerId: string;
    categoryId: string;
    location: string;
    dateFrom: string;
    dateTo: string;
    sort: "newest" | "oldest" | "price_high" | "price_low";
    listingType?: ListingTypeValue;
};

export type ModerationSummary = {
    total: number;
    pending: number;
    live: number;
    rejected: number;
    expired: number;
    sold: number;
    deactivated: number;
};

export const DEFAULT_SUMMARY: ModerationSummary = {
    total: 0,
    pending: 0,
    live: 0,
    rejected: 0,
    expired: 0,
    sold: 0,
    deactivated: 0
};

export type ModerationPagination = {
    page: number;
    limit: number;
    total: number;
    pages: number;
};

export const DEFAULT_FILTERS: ModerationFilters = {
    search: "",
    status: "all",
    sellerId: "",
    categoryId: "",
    location: "",
    dateFrom: "",
    dateTo: "",
    sort: "newest",
    listingType: undefined
};
