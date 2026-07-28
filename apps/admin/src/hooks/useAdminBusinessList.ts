import { useCallback, useEffect, useState } from "react";
import { mapErrorToMessage } from "@/lib/mapErrorToMessage";
import { showAdminPopup } from "@/lib/popup/popupEvents";
import { adminFetch } from "@/lib/api/adminClient";
import { parseAdminResponse } from "@/lib/api/parseAdminResponse";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import { Business } from "@esparex/contracts";
type BusinessListPagination = {
    total: number;
    pages: number;
    limit: number;
};

interface UseAdminBusinessListOptions<TOverview extends Record<string, number>> {
    activeTab: string;
    search: string;
    page: number;
    initialOverview: TOverview;
    mapOverview: (data: Record<string, unknown>) => TOverview;
    extraQueryParams?: Record<string, string | undefined>;
    rejectValidationMessage?: (reason: string) => string | null;
}

const DEFAULT_PAGINATION: BusinessListPagination = {
    total: 0,
    pages: 1,
    limit: 20,
};

const asRecord = (value: unknown): Record<string, unknown> => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return {};
    }

    return value as Record<string, unknown>;
};

const getErrorMessage = (error: unknown, fallback: string) => {
    if (error instanceof Error && error.message) {
        return error.message;
    }

    return fallback;
};

export function useAdminBusinessList<TOverview extends Record<string, number>>({
    activeTab,
    search,
    page,
    initialOverview,
    mapOverview,
    extraQueryParams,
    rejectValidationMessage,
}: UseAdminBusinessListOptions<TOverview>) {
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [pagination, setPagination] = useState<BusinessListPagination>(DEFAULT_PAGINATION);
    const [overview, setOverview] = useState<TOverview>(initialOverview);

    const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
    const [rejectTarget, setRejectTarget] = useState<Business | null>(null);
    const [modifyTarget, setModifyTarget] = useState<Business | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Business | null>(null);

    const extraQueryKey = JSON.stringify(extraQueryParams ?? {});

    const fetchBusinesses = useCallback(async () => {
        const resolvedExtraQueryParams = JSON.parse(extraQueryKey) as Record<string, string>;
        setLoading(true);
        setError("");

        try {
            const queryParams = new URLSearchParams({
                q: search,
                status: activeTab,
                page: String(page),
                limit: String(DEFAULT_PAGINATION.limit),
            });

            Object.entries(resolvedExtraQueryParams).forEach(([key, value]) => {
                const nextValue = value?.trim();
                if (nextValue) {
                    queryParams.set(key, nextValue);
                }
            });

            const [response, overviewResponse] = await Promise.all([
                adminFetch<unknown>(`${ADMIN_ROUTES.BUSINESS_ACCOUNTS}?${queryParams.toString()}`),
                adminFetch<unknown>(ADMIN_ROUTES.BUSINESS_OVERVIEW),
            ]);

            const parsed = parseAdminResponse<Business>(response);
            setBusinesses(parsed.items);

            if (parsed.pagination) {
                setPagination({
                    total: parsed.pagination.total ?? 0,
                    pages: parsed.pagination.pages ?? parsed.pagination.totalPages ?? 1,
                    limit: parsed.pagination.limit ?? DEFAULT_PAGINATION.limit,
                });
            } else {
                setPagination({
                    total: parsed.items.length,
                    pages: 1,
                    limit: DEFAULT_PAGINATION.limit,
                });
            }

            const overviewSource = asRecord((overviewResponse as { data?: unknown } | null)?.data ?? overviewResponse);
            setOverview(mapOverview(overviewSource));
        } catch (err) {
            setError(getErrorMessage(err, "Failed to load businesses"));
        } finally {
            setLoading(false);
        }
    }, [activeTab, extraQueryKey, mapOverview, page, search]);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void fetchBusinesses();
        }, 300);

        return () => window.clearTimeout(timer);
    }, [fetchBusinesses]);

    const handleReject = async (id: string, reason: string) => {
        const validationMessage = rejectValidationMessage?.(reason);
        if (validationMessage) {
            showAdminPopup({ type: "error", title: "Error", message: validationMessage });
            throw new Error(validationMessage);
        }

        try {
            await adminFetch(ADMIN_ROUTES.BUSINESS_STATUS(id), {
                method: "PATCH",
                body: { status: "rejected", reason },
            });
            showAdminPopup({ type: "success", title: "Success", message: "Business rejected" });
            setRejectTarget(null);
            setSelectedBusiness(null);
            await fetchBusinesses();
        } catch (err) {
            const message = getErrorMessage(err, "Failed to reject business");
            showAdminPopup({ type: "error", title: "Error", message });
            throw err instanceof Error ? err : new Error(message);
        }
    };

    const handleModify = async (id: string, patch: Partial<Business>) => {
        try {
            await adminFetch(ADMIN_ROUTES.BUSINESS_UPDATE(id), {
                method: "PUT",
                body: patch,
            });
            showAdminPopup({ type: "success", title: "Success", message: "Business updated" });
            setModifyTarget(null);
            setSelectedBusiness(null);
            await fetchBusinesses();
        } catch (err) {
            const message = getErrorMessage(err, "Failed to update business");
            showAdminPopup({ type: "error", title: "Error", message });
            throw err instanceof Error ? err : new Error(message);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await adminFetch(ADMIN_ROUTES.DELETE_BUSINESS(id), {
                method: "DELETE",
            });
            showAdminPopup({ type: "success", title: "Success", message: "Business deleted" });
            setDeleteTarget(null);
            setSelectedBusiness(null);
            await fetchBusinesses();
        } catch (err) {
            showAdminPopup({ type: "error", title: "Error", message: getErrorMessage(err, "Failed to delete business") });
        }
    };

    const handleSuspend = async (id: string, reason: string) => {
        try {
            await adminFetch(ADMIN_ROUTES.BUSINESS_STATUS(id), {
                method: "PATCH",
                body: { status: "suspended", reason },
            });
            showAdminPopup({ type: "success", title: "Success", message: "Business suspended" });
            setSelectedBusiness(null);
            await fetchBusinesses();
        } catch (err) {
            showAdminPopup({ type: "error", title: "Error", message: mapErrorToMessage(err, "Failed to suspend business") });
            throw err;
        }
    };

    const handleActivate = async (id: string) => {
        try {
            await adminFetch(ADMIN_ROUTES.BUSINESS_STATUS(id), { 
                method: "PATCH",
                body: { status: "live" },
            });
            showAdminPopup({ type: "success", title: "Success", message: "Business reactivated successfully" });
            setSelectedBusiness(null);
            await fetchBusinesses();
        } catch (err) {
            showAdminPopup({ type: "error", title: "Error", message: mapErrorToMessage(err, "Failed to activate business") });
        }
    };

    const handleBulkApprove = async (ids: string[]) => {
        try {
            await adminFetch(ADMIN_ROUTES.BUSINESS_BULK_APPROVE, {
                method: "POST",
                body: { ids },
            });
            showAdminPopup({ type: "success", title: "Success", message: `${ids.length} businesses approved` });
            await fetchBusinesses();
        } catch (err) {
            showAdminPopup({ type: "error", title: "Error", message: getErrorMessage(err, "Failed to approve businesses") });
        }
    };

    const handleBulkReject = async (ids: string[], reason: string) => {
        try {
            await adminFetch(ADMIN_ROUTES.BUSINESS_BULK_REJECT, {
                method: "POST",
                body: { ids, reason },
            });
            showAdminPopup({ type: "success", title: "Success", message: `${ids.length} businesses rejected` });
            await fetchBusinesses();
        } catch (err) {
            showAdminPopup({ type: "error", title: "Error", message: getErrorMessage(err, "Failed to reject businesses") });
        }
    };

    const handleBulkDeactivate = async (ids: string[]) => {
        try {
            await adminFetch(ADMIN_ROUTES.BUSINESS_BULK_DEACTIVATE, {
                method: "POST",
                body: { ids },
            });
            showAdminPopup({ type: "success", title: "Success", message: `${ids.length} businesses deactivated` });
            await fetchBusinesses();
        } catch (err) {
            showAdminPopup({ type: "error", title: "Error", message: getErrorMessage(err, "Failed to deactivate businesses") });
        }
    };

    const handleBulkExpire = async (ids: string[]) => {
        try {
            await adminFetch(ADMIN_ROUTES.BUSINESS_BULK_EXPIRE, {
                method: "POST",
                body: { ids },
            });
            showAdminPopup({ type: "success", title: "Success", message: `${ids.length} businesses expired` });
            await fetchBusinesses();
        } catch (err) {
            showAdminPopup({ type: "error", title: "Error", message: getErrorMessage(err, "Failed to expire businesses") });
        }
    };

    const handleBulkRenew = async (ids: string[]) => {
        try {
            await adminFetch(ADMIN_ROUTES.BUSINESS_BULK_RENEW, {
                method: "POST",
                body: { ids },
            });
            showAdminPopup({ type: "success", title: "Success", message: `${ids.length} businesses renewed` });
            await fetchBusinesses();
        } catch (err) {
            showAdminPopup({ type: "error", title: "Error", message: getErrorMessage(err, "Failed to renew businesses") });
        }
    };

    return {
        businesses,
        loading,
        error,
        setError,
        search,
        page,
        pagination,
        overview,
        selectedBusiness,
        setSelectedBusiness,
        rejectTarget,
        setRejectTarget,
        modifyTarget,
        setModifyTarget,
        deleteTarget,
        setDeleteTarget,
        fetchBusinesses,
        handleReject,
        handleModify,
        handleDelete,
        handleSuspend,
        handleActivate,
        handleBulkApprove,
        handleBulkReject,
        handleBulkDeactivate,
        handleBulkExpire,
        handleBulkRenew,
        handleBulkResendWarnings: async (ids: string[]) => {
            try {
                await adminFetch(ADMIN_ROUTES.BUSINESS_BULK_RESEND_WARNINGS, {
                    method: "POST",
                    body: { ids },
                });
                showAdminPopup({ type: "success", title: "Success", message: `Expiry warnings resent for ${ids.length} businesses` });
                await fetchBusinesses();
            } catch (err) {
                showAdminPopup({ type: "error", title: "Error", message: getErrorMessage(err, "Failed to resend business warnings") });
            }
        },
    };
}

