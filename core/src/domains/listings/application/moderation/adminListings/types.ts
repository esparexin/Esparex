import type { AdminLogTargetType } from '../../../../../utils/adminLogger';

export type AdminLogFn = (
    action: string,
    targetType: AdminLogTargetType,
    targetId: string,
    metadata?: Record<string, unknown>
) => Promise<void>;

export interface AdminListingsQuery {
    page?: unknown;
    limit?: unknown;
    status?: unknown;
    sellerId?: unknown;
    categoryId?: unknown;
    brandId?: unknown;
    modelId?: unknown;
    locationId?: unknown;
    q?: unknown;
    minPrice?: unknown;
    maxPrice?: unknown;
    createdAfter?: unknown;
    createdBefore?: unknown;
    listingType?: unknown;
    sortBy?: unknown;
    expiryWarningStatus?: unknown;
    expiringWithinDays?: unknown;
    spotlightWarningStatus?: unknown;
    spotlightExpiringWithinDays?: unknown;
    search?: unknown;
}

type DuplicateBypassBody = {
    allowDuplicateBypass?: unknown;
    duplicateBypassReason?: unknown;
};

export interface AdminBulkResult {
    processedCount: number;
    successCount: number;
    errorCount: number;
    results?: Array<{ id: string; success: boolean; message?: string; statusCode?: number; listing?: unknown }>;
}
