export interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore?: boolean;
    cursor?: string | null;
    nextCursor?: string;
}

import { Ad } from "../schemas/ad.schema";

export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total?: number;
        totalPages?: number;
        hasMore?: boolean;
        cursor?: string | null;
        nextCursor?: string;
    };
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

// For legacy/inconsistent controllers that use 'output' or 'status' in body
export interface LegacyApiResponse<T> {
    status: number;
    output?: T;
    message?: string;
    error?: string;
}

export interface HomeAdsResponse {
    spotlight: Ad[];
    latest: Ad[];
}

export interface HomeFeedResponse {
    ads: Ad[];
    nextCursor: {
        createdAt: string;
        id: string;
    } | null;
    hasMore: boolean;
    isFallback?: boolean;
}

export interface ContactResponse {
    mobile: string;
}
