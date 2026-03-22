import { adminFetch } from "@/lib/api/adminClient";
import { parseAdminResponse } from "@/lib/api/parseAdminResponse";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import type { ModerationFilters, ModerationPagination, ModerationSummary } from "@/components/moderation/moderationTypes";

type UnknownRecord = Record<string, unknown>;

type ModerationListResult = {
    items: UnknownRecord[];
    pagination: ModerationPagination;
};

const toRecord = (value: unknown): UnknownRecord =>
    value && typeof value === "object" ? (value as UnknownRecord) : {};

const ensureNumber = (value: unknown, label: string): number => {
    if (typeof value !== "number") {
        throw new Error(`Invalid moderation contract: ${label} must be a number`);
    }
    return value;
};

const normalizePagination = (raw: unknown, page: number, limit: number): ModerationPagination => {
    const record = toRecord(raw);
    const total = typeof record.total === "number" ? record.total : 0;
    const pages =
        typeof record.pages === "number"
            ? record.pages
            : typeof record.totalPages === "number"
                ? record.totalPages
                : Math.max(1, Math.ceil(total / Math.max(1, limit)));

    return {
        page: typeof record.page === "number" ? record.page : page,
        limit: typeof record.limit === "number" ? record.limit : limit,
        total,
        pages: Math.max(1, pages)
    };
};

const applySort = (params: URLSearchParams, sort: ModerationFilters["sort"]) => {
    if (sort) {
        params.set("sortBy", sort);
    }
};

export async function fetchAdminModerationAds(input: {
    filters: ModerationFilters;
    page: number;
    limit: number;
}): Promise<ModerationListResult> {
    const { filters, page, limit } = input;
    const params = new URLSearchParams({
        page: String(page),
        limit: String(limit)
    });

    if (filters.search.trim()) params.set("search", filters.search.trim());
    if (filters.status !== "all") params.set("status", filters.status);
    if (filters.sellerId.trim()) params.set("sellerId", filters.sellerId.trim());
    if (filters.categoryId.trim()) params.set("categoryId", filters.categoryId.trim());
    if (filters.location.trim()) params.set("location", filters.location.trim());
    if (filters.dateFrom) params.set("createdAfter", new Date(filters.dateFrom).toISOString());
    if (filters.dateTo) params.set("createdBefore", new Date(filters.dateTo).toISOString());
    if (filters.listingType) params.set("listingType", filters.listingType);

    applySort(params, filters.sort);

    const payload = await adminFetch<unknown>(`${ADMIN_ROUTES.LISTINGS}?${params.toString()}`);
    const parsed = parseAdminResponse<UnknownRecord>(payload);

    return {
        items: parsed.items,
        pagination: normalizePagination(parsed.pagination, page, limit)
    };
}

export async function fetchAdminModerationSummary(listingType?: string): Promise<ModerationSummary> {
    const params = new URLSearchParams();
    if (listingType) params.set("listingType", listingType);

    const payload = await adminFetch<unknown>(`${ADMIN_ROUTES.LISTING_COUNTS}?${params.toString()}`);
    const root = toRecord(payload);
    const data = toRecord(root.data);

    return {
        total: ensureNumber(data.total, 'total'),
        pending: ensureNumber(data.pending, 'pending'),
        live: ensureNumber(data.live, 'live'),
        rejected: ensureNumber(data.rejected, 'rejected'),
        expired: ensureNumber(data.expired, 'expired'),
        sold: ensureNumber(data.sold, 'sold'),
        deactivated: ensureNumber(data.deactivated, 'deactivated'),
    };
}

export async function fetchAdminAdSummary(): Promise<ModerationSummary> {
    return fetchAdminModerationSummary('ad');
}

export async function fetchAdminServiceSummary(): Promise<ModerationSummary> {
    return fetchAdminModerationSummary('service');
}


export async function fetchAdminAdDetail(adId: string): Promise<UnknownRecord> {
    const payload = await adminFetch<unknown>(ADMIN_ROUTES.LISTING_BY_ID(adId));
    const root = toRecord(payload);
    const data = toRecord(root.data);
    const listing = toRecord(data.listing);

    if (listing && (listing.id ?? listing._id ?? listing.title)) {
        return listing;
    }

    throw new Error("Listing not found or the server returned an unexpected response.");
}

export async function approveAdminAd(adId: string): Promise<void> {
    await adminFetch(ADMIN_ROUTES.LISTING_APPROVE(adId), { method: "POST" });
}

export async function rejectAdminAd(adId: string, rejectionReason: string): Promise<void> {
    await adminFetch(ADMIN_ROUTES.LISTING_REJECT(adId), {
        method: "POST",
        body: { rejectionReason }
    });
}

export async function deactivateAdminAd(adId: string): Promise<void> {
    await adminFetch(ADMIN_ROUTES.LISTING_DEACTIVATE(adId), {
        method: "POST",
    });
}

export async function activateAdminAd(adId: string): Promise<void> {
    await adminFetch(ADMIN_ROUTES.LISTING_APPROVE(adId), {
        method: "POST",
    });
}

export async function deleteAdminAd(adId: string): Promise<void> {
    await adminFetch(ADMIN_ROUTES.LISTING_DELETE(adId), { method: "DELETE" });
}

export async function blockAdminSeller(sellerId: string, reason: string): Promise<void> {
    await adminFetch(ADMIN_ROUTES.USER_STATUS(sellerId), {
        method: "PATCH",
        body: { status: "banned", reason }
    });
}

/**
 * Bulk Approve Ads/Services
 */
export async function bulkApproveAds(ids: string[], _domain: 'ad' | 'service'): Promise<void> {
    await Promise.all(ids.map(id => adminFetch(ADMIN_ROUTES.LISTING_APPROVE(id), { method: "POST" })));
}

/**
 * Bulk Update Status (e.g. Reject)
 */
export async function bulkUpdateAdStatus(
    ids: string[],
    status: string,
    _domain: 'ad' | 'service',
    reason?: string
): Promise<void> {
    await Promise.all(ids.map(id => {
        if (status === 'rejected') {
            return adminFetch(ADMIN_ROUTES.LISTING_REJECT(id), {
                method: "POST",
                body: { rejectionReason: reason || 'Rejected in bulk operation' }
            });
        }
        if (status === 'deactivated') {
            return adminFetch(ADMIN_ROUTES.LISTING_DEACTIVATE(id), { method: 'POST' });
        }
        if (status === 'live') {
            return adminFetch(ADMIN_ROUTES.LISTING_APPROVE(id), { method: 'POST' });
        }

        throw new Error(`Unsupported bulk status transition: ${status}`);
    }));
}
