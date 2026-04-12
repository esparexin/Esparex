import { useState, useCallback } from "react";
import { adminFetch } from "@/lib/api/adminClient";
import { parseAdminResponse } from "@/lib/api/parseAdminResponse";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import { useToast } from "@/context/ToastContext";
import type { ApiKeyItem } from "@/types/adminSession";

const normalizeApiKey = (raw: Record<string, unknown>): ApiKeyItem => ({
    id: String(raw.id || raw._id || ""),
    name: String(raw.name || "Untitled key"),
    key: typeof raw.key === "string" ? raw.key : undefined,
    keyPrefix: String(raw.keyPrefix || ""),
    scopes: Array.isArray(raw.scopes) ? raw.scopes.filter((item): item is string => typeof item === "string") : [],
    status: raw.status === "revoked" ? "revoked" : "active",
    createdBy: raw.createdBy as ApiKeyItem["createdBy"],
    revokedAt: typeof raw.revokedAt === "string" ? raw.revokedAt : undefined,
    expiresAt: typeof raw.expiresAt === "string" ? raw.expiresAt : undefined,
    lastUsedAt: typeof raw.lastUsedAt === "string" ? raw.lastUsedAt : undefined,
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : new Date(0).toISOString(),
});

export function useApiKeys(initialStatus: string = "all") {
    const { showToast } = useToast();
    const [items, setItems] = useState<ApiKeyItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [isMutating, setIsMutating] = useState(false);
    const [error, setError] = useState("");
    const [statusFilter, setStatusFilter] = useState(initialStatus);

    const fetchApiKeys = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const query = new URLSearchParams({
                status: statusFilter,
                page: "1",
                limit: "100",
            }).toString();

            const response = await adminFetch<Record<string, unknown>>(`${ADMIN_ROUTES.API_KEYS}?${query}`);
            const data = (response as any).data || response;
            const rawItems = Array.isArray(data.items) ? data.items : Array.isArray(data) ? data : [];
            setItems(rawItems.map(normalizeApiKey));
        } catch (err: any) {
            const msg = err.message || "Failed to load API keys";
            setError(msg);
            showToast(msg, "error");
        } finally {
            setLoading(false);
        }
    }, [statusFilter, showToast]);

    const handleCreateKey = async (name: string, scopes: string[]) => {
        setIsMutating(true);
        try {
            const response = await adminFetch<Record<string, unknown>>(ADMIN_ROUTES.API_KEYS, {
                method: "POST",
                body: { name, scopes },
            });
            const parsed = parseAdminResponse<never, Record<string, unknown>>(response);
            const created = parsed.data || {};
            showToast("API key created successfully", "success");
            await fetchApiKeys();
            return { success: true, key: typeof created.key === "string" ? created.key : null };
        } catch (err: any) {
            const msg = err.message || "Failed to create API key";
            showToast(msg, "error");
            return { success: false, error: msg };
        } finally {
            setIsMutating(false);
        }
    };

    const handleRevokeKey = async (id: string) => {
        setIsMutating(true);
        try {
            await adminFetch(ADMIN_ROUTES.API_KEY_REVOKE(id), { method: "PATCH", body: {} });
            showToast("API key revoked", "success");
            await fetchApiKeys();
            return { success: true };
        } catch (err: any) {
            const msg = err.message || "Failed to revoke API key";
            showToast(msg, "error");
            return { success: false, error: msg };
        } finally {
            setIsMutating(false);
        }
    };

    return {
        items,
        loading,
        isMutating,
        error,
        statusFilter,
        setStatusFilter,
        fetchApiKeys,
        handleCreateKey,
        handleRevokeKey
    };
}
