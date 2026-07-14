import { adminFetch } from '@/lib/api/adminClient';
import { ADMIN_ROUTES } from '@/lib/api/routes';
import { buildQueryString } from '@/lib/api/queryParams';

export type CatalogRequestType = 'brand' | 'model';
export type CatalogRequestStatus = 'pending' | 'approved' | 'rejected' | 'duplicate' | 'resolved';

export interface CatalogRequestUserRef {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    mobile?: string;
}

export interface CatalogRequestItem {
    id: string;
    requestType: CatalogRequestType;
    categoryId: string;
    parentBrandId?: string | null;
    requestedName: string;
    canonicalName: string;
    normalizedName?: string;
    slug: string;
    requestedBy: string | CatalogRequestUserRef;
    requestCount?: number;
    /** Optional soft reference to the listing that triggered this suggestion (edit-ad flow). */
    listingId?: string | null;
    status: CatalogRequestStatus;
    approvedEntityId?: string | null;
    duplicateOfEntityId?: string | null;
    rejectionReason?: string | null;
    adminNotes?: string | null;
    approvedBy?: string | null;
    approvedAt?: string | null;
    rejectedBy?: string | null;
    rejectedAt?: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CatalogRequestListFilters {
    status?: 'all' | CatalogRequestStatus;
    requestType?: CatalogRequestType;
    q?: string;
    page?: number;
    limit?: number;
}

export interface CatalogRequestStatsBucket {
    pending: number;
    approved: number;
    rejected: number;
    duplicate: number;
    resolved: number;
    total: number;
}

export interface CatalogRequestStats {
    total: number;
    byStatus: CatalogRequestStatsBucket;
    byRequestType: {
        brand: CatalogRequestStatsBucket;
        model: CatalogRequestStatsBucket;
    };
}

export async function listAdminCatalogRequests(filters: CatalogRequestListFilters) {
    const query = buildQueryString({
        status: filters.status,
        requestType: filters.requestType,
        q: filters.q,
        page: filters.page,
        limit: filters.limit,
    });
    const suffix = query ? `?${query}` : '';
    return adminFetch<{ items: CatalogRequestItem[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
        `${ADMIN_ROUTES.CATALOG_REQUESTS}${suffix}`
    );
}

export async function getAdminCatalogRequestById(id: string) {
    return adminFetch<CatalogRequestItem>(ADMIN_ROUTES.CATALOG_REQUEST_BY_ID(id));
}

export async function approveAdminCatalogRequest(id: string, payload?: { adminNotes?: string }) {
    return adminFetch<{
        request: CatalogRequestItem;
        approvedEntityId: string;
        createdCanonicalEntity: boolean;
        updatedAdsCount: number;
    }>(ADMIN_ROUTES.CATALOG_REQUEST_APPROVE(id), {
        method: 'POST',
        body: payload ?? {},
    });
}

export async function rejectAdminCatalogRequest(id: string, payload: { rejectionReason: string; adminNotes?: string }) {
    return adminFetch<{ request: CatalogRequestItem }>(ADMIN_ROUTES.CATALOG_REQUEST_REJECT(id), {
        method: 'POST',
        body: payload,
    });
}

export async function markAdminCatalogRequestDuplicate(id: string, payload: { duplicateOfEntityId: string; adminNotes?: string }) {
    return adminFetch<{
        request: CatalogRequestItem;
        duplicateOfEntityId: string;
        updatedAdsCount: number;
    }>(ADMIN_ROUTES.CATALOG_REQUEST_MARK_DUPLICATE(id), {
        method: 'POST',
        body: payload,
    });
}

export async function getAdminCatalogRequestStats(requestType?: CatalogRequestType) {
    const query = buildQueryString(requestType ? { requestType } : {});
    const suffix = query ? `?${query}` : '';
    return adminFetch<CatalogRequestStats>(`${ADMIN_ROUTES.CATALOG_REQUEST_STATS}${suffix}`);
}

export async function bulkApproveAdminCatalogRequests(payload: { requestIds: string[] }) {
    return adminFetch<{ results: Array<{ id: string; status: 'success' | 'error'; message?: string; updatedAdsCount?: number }> }>(
        ADMIN_ROUTES.CATALOG_REQUEST_BULK_APPROVE,
        {
            method: 'POST',
            body: payload,
        }
    );
}

export async function bulkRejectAdminCatalogRequests(payload: { requestIds: string[]; reason: string }) {
    return adminFetch<{ results: Array<{ id: string; status: 'success' | 'error'; message?: string }> }>(
        ADMIN_ROUTES.CATALOG_REQUEST_BULK_REJECT,
        {
            method: 'POST',
            body: payload,
        }
    );
}

export async function bulkMarkAdminCatalogRequestsDuplicate(payload: { requestIds: string[]; duplicateOfId: string }) {
    return adminFetch<{ results: Array<{ id: string; status: 'success' | 'error'; message?: string; updatedAdsCount?: number }> }>(
        ADMIN_ROUTES.CATALOG_REQUEST_BULK_MARK_DUPLICATE,
        {
            method: 'POST',
            body: payload,
        }
    );
}
