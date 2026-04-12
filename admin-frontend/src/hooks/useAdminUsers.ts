"use client";

import { useState, useCallback, useEffect } from "react";
import { adminFetch } from "@/lib/api/adminClient";
import { parseAdminResponse } from "@/lib/api/parseAdminResponse";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import { useAdminMutation } from "@/hooks/useAdminMutation";
import { normalizeAdmin, type ManagedAdmin, parsePermissionsText } from "@/components/system/adminUsers/adminUsers";
import type { AdminCreateUserFormValues, AdminEditUserFormValues } from "@/schemas/admin.schemas";

export function useAdminUsers() {
    const { isPending: isMutating, runAction } = useAdminMutation();
    const [admins, setAdmins] = useState<ManagedAdmin[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAdmins = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await adminFetch<Record<string, unknown>>(ADMIN_ROUTES.ADMIN_USERS);
            const parsed = parseAdminResponse<Record<string, unknown>>(response);
            setAdmins(parsed.items.map(normalizeAdmin));
        } catch (err) {
            setError("Failed to load admin users");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchAdmins();
    }, [fetchAdmins]);

    const handleCreate = useCallback(async (values: AdminCreateUserFormValues) => {
        const name = `${values.firstName} ${values.lastName}`.trim();
        return runAction(
            () => adminFetch(ADMIN_ROUTES.ADMIN_USERS, {
                method: "POST",
                body: {
                    firstName: values.firstName.trim(),
                    lastName: values.lastName.trim(),
                    name,
                    email: values.email.trim(),
                    password: values.password,
                    role: values.role,
                    permissions: parsePermissionsText(values.permissionsText),
                },
            }),
            {
                successMessage: "Admin created successfully",
                onSuccess: fetchAdmins
            }
        );
    }, [runAction, fetchAdmins]);

    const handleUpdate = useCallback(async (id: string, values: AdminEditUserFormValues) => {
        const name = `${values.firstName} ${values.lastName}`.trim();
        return runAction(
            () => adminFetch(`${ADMIN_ROUTES.ADMIN_USERS}/${id}`, {
                method: "PATCH",
                body: {
                    firstName: values.firstName.trim(),
                    lastName: values.lastName.trim(),
                    name,
                    email: values.email.trim(),
                    role: values.role,
                    status: values.status,
                    permissions: parsePermissionsText(values.permissionsText),
                },
            }),
            {
                successMessage: "Admin updated successfully",
                onSuccess: fetchAdmins
            }
        );
    }, [runAction, fetchAdmins]);

    const handleToggleStatus = useCallback(async (id: string) => {
        return runAction(
            () => adminFetch(`${ADMIN_ROUTES.ADMIN_USERS}/${id}/toggle`, {
                method: "PATCH"
            }),
            {
                successMessage: "Admin status toggled",
                onSuccess: fetchAdmins
            }
        );
    }, [runAction, fetchAdmins]);

    const handleDelete = useCallback(async (id: string) => {
        return runAction(
            () => adminFetch(`${ADMIN_ROUTES.ADMIN_USERS}/${id}`, {
                method: "DELETE"
            }),
            {
                successMessage: "Admin deleted successfully",
                onSuccess: fetchAdmins
            }
        );
    }, [runAction, fetchAdmins]);

    return {
        admins,
        loading,
        error,
        isMutating,
        refresh: fetchAdmins,
        handleCreate,
        handleUpdate,
        handleToggleStatus,
        handleDelete
    };
}
