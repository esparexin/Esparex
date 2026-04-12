import { useState, useCallback } from "react";
import { adminFetch } from "@/lib/api/adminClient";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import { parseAdminResponse } from "@/lib/api/parseAdminResponse";
import { useToast } from "@/context/ToastContext";
import { 
    normalizeManagedUser, 
    type ManagedUser, 
    type UserActionType 
} from "@/components/system/users/userManagement";

interface UserFilters {
    search?: string;
    status?: string;
    isVerified?: string;
    page?: number;
    limit?: number;
}

export function useClientUsers() {
    const { showToast } = useToast();
    const [users, setUsers] = useState<ManagedUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [isMutating, setIsMutating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pagination, setPagination] = useState({
        total: 0,
        pages: 1,
        limit: 20,
    });
    const [overview, setOverview] = useState({
        totalUsers: 0,
        activeUsers: 0,
        suspendedUsers: 0,
        bannedUsers: 0,
        verifiedUsers: 0,
    });

    const fetchUsers = useCallback(async (filters: UserFilters = {}) => {
        setLoading(true);
        setError(null);
        try {
            const queryParams = new URLSearchParams({
                page: String(filters.page || 1),
                limit: String(filters.limit || 20),
            });
            if (filters.search) queryParams.set("search", filters.search);
            if (filters.status && filters.status !== "all") queryParams.set("status", filters.status);
            if (filters.isVerified && filters.isVerified !== "all") queryParams.set("isVerified", filters.isVerified);

            const [response, overviewResponse] = await Promise.all([
                adminFetch<any>(`${ADMIN_ROUTES.USERS}?${queryParams.toString()}`),
                adminFetch<any>(ADMIN_ROUTES.USER_OVERVIEW)
            ]);

            const parsed = parseAdminResponse<ManagedUser>(response);
            setUsers(parsed.items.map(normalizeManagedUser));
            
            if (parsed.pagination) {
                setPagination({
                    total: parsed.pagination.total ?? 0,
                    pages: parsed.pagination.pages ?? parsed.pagination.totalPages ?? 1,
                    limit: parsed.pagination.limit ?? 20
                });
            }

            const ov = parseAdminResponse<never, any>(overviewResponse).data || {};
            setOverview({
                totalUsers: Number(ov.totalUsers || 0),
                activeUsers: Number(ov.activeUsers || 0),
                suspendedUsers: Number(ov.suspendedUsers || 0),
                bannedUsers: Number(ov.bannedUsers || 0),
                verifiedUsers: Number(ov.verifiedUsers || 0),
            });

            return { success: true };
        } catch (err: any) {
            const msg = err.message || "Failed to load users";
            setError(msg);
            showToast(msg, "error");
            return { success: false, error: msg };
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    const handleUserAction = async (type: UserActionType, user: ManagedUser, reason?: string) => {
        setIsMutating(true);
        try {
            if (["suspend", "ban", "activate"].includes(type)) {
                const newStatus = type === "activate" ? "active" : type === "suspend" ? "suspended" : "banned";
                await adminFetch(ADMIN_ROUTES.USER_STATUS(user.id), {
                    method: "PATCH",
                    body: { status: newStatus, reason },
                });
            } else if (type === "verify" || type === "unverify") {
                await adminFetch(ADMIN_ROUTES.USER_VERIFY(user.id), {
                    method: "PATCH",
                    body: { isVerified: type === "verify" },
                });
            } else {
                throw new Error(`Unsupported action type: ${type}`);
            }

            showToast(`User ${type} action completed`, "success");
            return { success: true };
        } catch (err: any) {
            const msg = err.message || `Failed to ${type} user`;
            showToast(msg, "error");
            return { success: false, error: msg };
        } finally {
            setIsMutating(false);
        }
    };

    return {
        users,
        loading,
        isMutating,
        error,
        pagination,
        overview,
        fetchUsers,
        handleUserAction
    };
}
