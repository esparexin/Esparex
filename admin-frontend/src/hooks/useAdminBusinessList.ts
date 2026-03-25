import { useEffect, useState } from "react";
import { useToast } from "@/context/ToastContext";
import { adminFetch } from "@/lib/api/adminClient";
import { parseAdminResponse } from "@/lib/api/parseAdminResponse";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import type { Business } from "@/types/business";

type BusinessListPagination = {
    total: number;
    pages: number;
    limit: number;
};

interface UseAdminBusinessListOptions<TOverview extends Record<string, number>> {
    activeTab: string;
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
    initialOverview,
    mapOverview,
    extraQueryParams,
    rejectValidationMessage,
}: UseAdminBusinessListOptions<TOverview>) {
    const { showToast } = useToast();

    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState<BusinessListPagination>(DEFAULT_PAGINATION);
    const [overview, setOverview] = useState<TOverview>(initialOverview);

    const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
    const [rejectTarget, setRejectTarget] = useState<Business | null>(null);
    const [modifyTarget, setModifyTarget] = useState<Business | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Business | null>(null);

    const extraQueryKey = JSON.stringify(extraQueryParams ?? {});

    const fetchBusinesses = async () => {
        setLoading(true);
        setError("");

        try {
            const queryParams = new URLSearchParams({
                search,
                status: activeTab,
                page: String(page),
                limit: String(DEFAULT_PAGINATION.limit),
            });

            Object.entries(extraQueryParams ?? {}).forEach(([key, value]) => {
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
    };

    useEffect(() => {
        const timer = window.setTimeout(() => {
            void fetchBusinesses();
        }, 300);

        return () => window.clearTimeout(timer);
    }, [search, activeTab, page, extraQueryKey]);

    const handleReject = async (id: string, reason: string) => {
        const validationMessage = rejectValidationMessage?.(reason);
        if (validationMessage) {
            showToast(validationMessage, "error");
            throw new Error(validationMessage);
        }

        try {
            await adminFetch(ADMIN_ROUTES.BUSINESS_REJECT(id), {
                method: "PATCH",
                body: { reason },
            });
            showToast("Business rejected", "success");
            setRejectTarget(null);
            setSelectedBusiness(null);
            await fetchBusinesses();
        } catch (err) {
            const message = getErrorMessage(err, "Failed to reject business");
            showToast(message, "error");
            throw err instanceof Error ? err : new Error(message);
        }
    };

    const handleModify = async (id: string, patch: Partial<Business>) => {
        try {
            await adminFetch(ADMIN_ROUTES.BUSINESS_UPDATE(id), {
                method: "PUT",
                body: patch,
            });
            showToast("Business updated", "success");
            setModifyTarget(null);
            setSelectedBusiness(null);
            await fetchBusinesses();
        } catch (err) {
            const message = getErrorMessage(err, "Failed to update business");
            showToast(message, "error");
            throw err instanceof Error ? err : new Error(message);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await adminFetch(ADMIN_ROUTES.DELETE_BUSINESS(id), {
                method: "DELETE",
            });
            showToast("Business deleted", "success");
            setDeleteTarget(null);
            setSelectedBusiness(null);
            await fetchBusinesses();
        } catch (err) {
            showToast(getErrorMessage(err, "Failed to delete business"), "error");
        }
    };

    return {
        businesses,
        loading,
        error,
        setError,
        search,
        setSearch,
        page,
        setPage,
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
    };
}
