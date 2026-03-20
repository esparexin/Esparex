// src/queries/queryKeys.ts
import type { AdFilters, HomeAdsRequestParams } from '@/api/user/ads';

export const queryKeys = {
    // Ads
    ads: {
        all: ['ads'] as const,
        lists: () => [...queryKeys.ads.all, 'list'] as const,
        list: (filters: AdFilters) => [...queryKeys.ads.lists(), filters] as const,
        details: () => [...queryKeys.ads.all, 'detail'] as const,
        detail: (id: string | number) => [...queryKeys.ads.details(), id] as const,
        home: (params?: HomeAdsRequestParams) => [...queryKeys.ads.all, 'home', params ?? {}] as const,
        myAds: (status?: string) => [...queryKeys.ads.all, 'mine', { status }] as const,
        stats: () => [...queryKeys.ads.all, 'stats'] as const,
        saved: () => [...queryKeys.ads.all, 'saved'] as const,
    },

    // Categories
    categories: {
        all: ['categories'] as const,
        lists: () => [...queryKeys.categories.all, 'list'] as const,
        details: () => [...queryKeys.categories.all, 'detail'] as const,
        detail: (id: string) => [...queryKeys.categories.details(), id] as const,
        schemas: () => [...queryKeys.categories.all, 'schema'] as const,
        schema: (id: string) => [...queryKeys.categories.schemas(), id] as const,
    },

    // User
    user: {
        all: ['user'] as const,
        me: () => [...queryKeys.user.all, 'me'] as const,
    },


    // Notifications
    notifications: {
        all: ['notifications'] as const,
        list: (page: number, limit: number) => [...queryKeys.notifications.all, page, limit] as const,
    },

    // Services
    services: {
        all: ['services'] as const,
        details: () => [...queryKeys.services.all, 'detail'] as const,
        detail: (id: string | number) => [...queryKeys.services.details(), id] as const,
        myServices: (status?: string) => [...queryKeys.services.all, 'mine', { status }] as const,
    },
};
