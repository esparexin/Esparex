"use client";

import { useCallback, useState } from "react";
import { adminFetch } from "@/lib/api/adminClient";
import { parseAdminResponse } from "@/lib/api/parseAdminResponse";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import { showAdminPopup } from "@/lib/popup/popupEvents";
import { bulkResendAlertWarnings } from "@/lib/api/smartAlerts";

type AlertItem = {
    _id?: string;
    id?: string;
    name?: string;
    userId: string;
    criteria?: Record<string, unknown>;
    isActive: boolean;
    expiresAt?: string;
    expiryWarningCount?: number;
    expiryWarningSentAt?: string;
};

export function useAdminSmartAlerts() {
    const [alerts, setAlerts] = useState<AlertItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 50,
        total: 0,
        pages: 1
    });

    const getAlerts = useCallback(async (params: { page: number; limit: number }) => {
        setLoading(true);
        setError("");
        try {
            const query = new URLSearchParams({
                page: String(params.page),
                limit: String(params.limit),
            });
            const response = await adminFetch(`${ADMIN_ROUTES.SMART_ALERTS}?${query.toString()}`);
            const parsed = parseAdminResponse<AlertItem>(response);
            
            setAlerts(parsed.items);
            setPagination({
                page: parsed.pagination?.page || params.page,
                limit: parsed.pagination?.limit || params.limit,
                total: parsed.pagination?.total || parsed.items.length,
                pages: parsed.pagination?.pages || parsed.pagination?.totalPages || 1
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load alerts");
        } finally {
            setLoading(false);
        }
    }, []);

    const handleDeleteAlert = async (id: string) => {
        try {
            await adminFetch(ADMIN_ROUTES.SMART_ALERTS + `/${id}`, { method: "DELETE" });
            showAdminPopup({ type: "success", title: "Success", message: "Alert deleted" });
            await getAlerts({ page: pagination.page, limit: pagination.limit });
        } catch {
            showAdminPopup({ type: "error", title: "Error", message: "Failed to delete alert" });
        }
    };

    const handleBulkResend = async (ids: string[]) => {
        try {
            await bulkResendAlertWarnings(ids);
            showAdminPopup({ type: "success", title: "Success", message: `Resent warnings for ${ids.length} alerts` });
            await getAlerts({ page: pagination.page, limit: pagination.limit });
        } catch {
            showAdminPopup({ type: "error", title: "Error", message: "Failed to resend warnings" });
        }
    };

    return {
        alerts,
        loading,
        error,
        pagination,
        getAlerts,
        handleDeleteAlert,
        handleBulkResend
    };
}
