import { useState, useCallback } from "react";
import { adminFetch } from "@/lib/api/adminClient";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import { parseAdminResponse } from "@/lib/api/parseAdminResponse";
import { useToast } from "@/context/ToastContext";
import type { AdminSessionItem } from "@/types/adminSession";

const normalizeAdminSession = (raw: Record<string, unknown>): AdminSessionItem => ({
    id: String(raw.id || raw._id || ""),
    adminId: raw.adminId as AdminSessionItem["adminId"],
    tokenId: typeof raw.tokenId === "string" ? raw.tokenId : undefined,
    ip: typeof raw.ip === "string" ? raw.ip : undefined,
    device: typeof raw.device === "string" ? raw.device : undefined,
    expiresAt: typeof raw.expiresAt === "string" ? raw.expiresAt : new Date(0).toISOString(),
    revokedAt: typeof raw.revokedAt === "string" ? raw.revokedAt : undefined,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : new Date(0).toISOString(),
});

export function useAdminSessions(initialStatus: string = "active") {
    const { showToast } = useToast();
    const [sessions, setSessions] = useState<AdminSessionItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [isMutating, setIsMutating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState(initialStatus);

    const fetchSessions = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const query = new URLSearchParams({
                status: statusFilter,
                page: "1",
                limit: "100",
            }).toString();

            const response = await adminFetch<Record<string, unknown>>(`${ADMIN_ROUTES.ADMIN_SESSIONS}?${query}`);
            const parsed = parseAdminResponse<Record<string, unknown>>(response);
            setSessions(parsed.items.map(normalizeAdminSession));
        } catch (err: any) {
            const msg = err.message || "Failed to load admin sessions";
            setError(msg);
            showToast(msg, "error");
        } finally {
            setLoading(false);
        }
    }, [statusFilter, showToast]);

    const handleRevokeSession = async (sessionId: string) => {
        setIsMutating(true);
        try {
            await adminFetch(ADMIN_ROUTES.ADMIN_SESSION_REVOKE(sessionId), { 
                method: "PATCH", 
                body: {} 
            });
            showToast("Admin session revoked successfully", "success");
            await fetchSessions();
            return { success: true };
        } catch (err: any) {
            const msg = err.message || "Failed to revoke session";
            showToast(msg, "error");
            return { success: false, error: msg };
        } finally {
            setIsMutating(false);
        }
    };

    return {
        sessions,
        loading,
        isMutating,
        error,
        statusFilter,
        setStatusFilter,
        fetchSessions,
        handleRevokeSession
    };
}
