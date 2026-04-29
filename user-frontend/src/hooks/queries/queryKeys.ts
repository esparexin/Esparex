// src/queries/queryKeys.ts
import type { ListingFilters as AdFilters, HomeAdsRequestParams } from "@/lib/api/user/listings";

const listingKeys = {
    all: ['ads'] as const,
    lists: () => [...listingKeys.all, 'list'] as const,
    list: (filters: AdFilters) => [...listingKeys.lists(), filters] as const,
    details: () => [...listingKeys.all, 'detail'] as const,
    detail: (id: string | number) => [...listingKeys.details(), id] as const,
    home: (params?: HomeAdsRequestParams) => [...listingKeys.all, 'home', params ?? {}] as const,
    myListings: (status?: string, type?: string) => [...listingKeys.all, 'mine', { status, type }] as const,
    myAds: (status?: string, type?: string) => listingKeys.myListings(status, type),
    stats: () => [...listingKeys.all, 'stats'] as const,
    saved: () => [...listingKeys.all, 'saved'] as const,
};

const businessKeys = {
    all: ['businesses'] as const,
    nearby: (params: Record<string, unknown>) => [...businessKeys.all, 'nearby', params] as const,
};

export const queryKeys = {
    // Listings (Unified name for Ads, Services, Spare Parts in the future)
    listings: listingKeys,
    // Legacy alias for Ads
    ads: listingKeys,

    // Categories
    categories: {
        all: ['categories'] as const,
        lists: () => [...queryKeys.categories.all, 'list'] as const,
        details: () => [...queryKeys.categories.all, 'detail'] as const,
        detail: (id: string) => [...queryKeys.categories.details(), id] as const,
        schemas: () => [...queryKeys.categories.all, 'schema'] as const,
        schema: (id: string) => [...queryKeys.categories.schemas(), id] as const,
    },

    businesses: businessKeys,

    // User
    user: {
        all: ['user'] as const,
        me: () => [...queryKeys.user.all, 'me'] as const,
    },


    // Notifications
    notifications: {
        all: ['notifications'] as const,
        list: (params: { page?: number; limit?: number; filter?: string; type?: string; q?: string }) =>
            [...queryKeys.notifications.all, params] as const,
    },

    // Services
    services: {
        all: ['services'] as const,
        details: () => [...queryKeys.services.all, 'detail'] as const,
        detail: (id: string | number) => [...queryKeys.services.details(), id] as const,
        myServices: (status?: string) => [...queryKeys.services.all, 'mine', { status }] as const,
    },

    // Spare Parts
    spare: {
        all: ['spare-parts'] as const,
        details: () => [...queryKeys.spare.all, 'detail'] as const,
        detail: (id: string) => [...queryKeys.spare.details(), id] as const,
        myListings: (status?: string) => [...queryKeys.spare.all, 'mine', { status }] as const,
    },
};
