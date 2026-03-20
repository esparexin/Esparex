export interface AdFilters {
    status?: string | string[] | null;
    categoryId?: string;
    brandId?: string;
    modelId?: string;
    locationId?: string;
    level?: 'country' | 'state' | 'district' | 'city' | 'area' | 'village';
    district?: string;
    state?: string;
    country?: string;
    sellerId?: string;
    location?: string;
    isSpotlight?: boolean;
    search?: string;
    excludeIds?: string[];
    minPrice?: number;
    maxPrice?: number;
    brands?: string[];
    radiusKm?: number;
    coordinates?: {
        type: 'Point';
        coordinates: [number, number];
    };
    lat?: number | string;
    lng?: number | string;
    createdAfter?: string;
    createdBefore?: string;
    flagged?: boolean;
    reportThreshold?: number;
    riskThreshold?: number;
    sortBy?: 'date' | 'price' | 'views';
    sortOrder?: 'asc' | 'desc';
}

export interface PaginationOptions {
    page: number;
    limit: number;
    cursor?: string | null;
}

export interface AdContext {
    actor: 'USER' | 'ADMIN';
    authUserId: string; // The authenticated account ID (JWT subject)
    sellerId: string;   // The canonical ownership ID (inventory master)
    idempotencyKey?: string;
    requestId?: string;
    userRole?: string;
    allowQuotaBypass?: boolean;
    allowSuspendedUser?: boolean;
    allowDuplicateBypass?: boolean;
    duplicateBypassReason?: string;
    fraudRisk?: 'allow' | 'flag' | 'captcha' | 'moderation' | 'block';
    fraudScore?: number;
}
