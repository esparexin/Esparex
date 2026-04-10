"use client";
import { mapErrorToMessage } from '@/lib/mapErrorToMessage';

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { UserPlus, Power, Trash2, Save, XCircle } from "lucide-react";
import { DataTable, type ColumnDef } from "@/components/ui/DataTable";
import { useToast } from "@/context/ToastContext";
import { adminFetch } from "@/lib/api/adminClient";
import { parseAdminResponse } from "@/lib/api/parseAdminResponse";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { administrationTabs } from "@/components/layout/adminModuleTabSets";
import { StatusChip } from "@/components/ui/StatusChip";
import { useAdminMutation } from "@/hooks/useAdminMutation";
import { AdminUserFormCard } from "@/components/system/adminUsers/AdminUserFormCard";
import { AdminUserIdentityCell } from "@/components/system/adminUsers/AdminUserIdentityCell";
import { AdminUserRoleBadge } from "@/components/system/adminUsers/AdminUserRoleBadge";
import {
    DEFAULT_CREATE_FORM,
    getAdminStatusPresentation,
    normalizeAdmin,
    parsePermissionsText,
    toEditableAdminFormState,
    type ManagedAdmin,
} from "@/components/system/adminUsers/adminUsers";
import type { AdminCreateUserFormValues, AdminEditUserFormValues } from "@/schemas/admin.schemas";

const ADMIN_IDENTITY_COLUMNS: ColumnDef<ManagedAdmin>[] = [
    {
        header: "Admin",
        cell: (admin) => <AdminUserIdentityCell admin={admin} />,
    },
    {
        header: "Role",
        cell: (admin) => <AdminUserRoleBadge role={admin.role} />,
    },
];

export default function AdminUsersPage() {
    const searchParams = useSearchParams();
    const { showToast } = useToast();
    const { isPending: isSaving, runMutation } = useAdminMutation();
    const [admins, setAdmins] = useState<ManagedAdmin[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
    const [editingAdmin, setEditingAdmin] = useState<ManagedAdmin | null>(null);
    const [permissionsDraft, setPermissionsDraft] = useState("");
    const isPermissionsView = searchParams.get("view") === "permissions";

    const loadAdmins = async () => {
        setLoading(true);
        try {
            const response = await adminFetch<Record<string, unknown>>(ADMIN_ROUTES.ADMIN_USERS);
            const parsed = parseAdminResponse<Record<string, unknown>>(response);
            setAdmins(parsed.items.map(normalizeAdmin));
        } catch (error) {
            showToast(mapErrorToMessage(error, "Failed to load admin users"), "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadAdmins();
    }, []);

    const onCreate = async (values: AdminCreateUserFormValues) => {
        const name = `${values.firstName} ${values.lastName}`.trim();
        await runMutation(
            () =>
                adminFetch(ADMIN_ROUTES.ADMIN_USERS, {
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
                failureMessage: "Failed to create admin",
                onSuccess: async () => {
                    await loadAdmins();
                },
            }
        );
    };

    const onStartEdit = (admin: ManagedAdmin) => {
        setEditingAdminId(admin.id);
        setEditingAdmin(admin);
        setPermissionsDraft(admin.permissions.join(", "));
    };

    const onCancelEdit = () => {
        setEditingAdminId(null);
        setEditingAdmin(null);
        setPermissionsDraft("");
    };

    const onSaveEdit = async (values: AdminEditUserFormValues) => {
        if (!editingAdmin) return;

        await runMutation(
            () =>
                adminFetch(ADMIN_ROUTES.ADMIN_USER_BY_ID(editingAdmin.id), {
                    method: "PATCH",
                    body: {
                        firstName: values.firstName.trim(),
                        lastName: values.lastName.trim(),
                        email: values.email.trim(),
                        role: values.role,
                        status: values.status,
                        permissions: parsePermissionsText(values.permissionsText),
                    },
                }),
            {
                successMessage: "Admin updated successfully",
                failureMessage: "Failed to update admin",
                onSuccess: async () => {
                    onCancelEdit();
                    await loadAdmins();
                },
            }
        );
    };

    const onDeactivate = async (admin: ManagedAdmin) => {
        await runMutation(
            () =>
                adminFetch(ADMIN_ROUTES.ADMIN_USER_DEACTIVATE(admin.id), {
                    method: "PATCH",
                    body: {},
                }),
            {
                successMessage: `Deactivated ${admin.email}`,
                failureMessage: "Failed to deactivate admin",
                onSuccess: async () => {
                    await loadAdmins();
                },
            }
        );
    };

    const onDelete = async (admin: ManagedAdmin) => {
        if (!window.confirm(`Delete admin ${admin.email}?`)) return;

        await runMutation(
            () => adminFetch(ADMIN_ROUTES.ADMIN_USER_BY_ID(admin.id), { method: "DELETE" }),
            {
                successMessage: `Deleted ${admin.email}`,
                failureMessage: "Failed to delete admin",
                onSuccess: async () => {
                    await loadAdmins();
                },
            }
        );
    };

    const permissionsColumns: ColumnDef<ManagedAdmin>[] = useMemo(
        () => [
            ...ADMIN_IDENTITY_COLUMNS,
            {
                header: "Permissions",
                cell: (admin) => {
                    const isEditing = editingAdminId === admin.id;
                    if (isEditing) {
                        return (
                            <div className="flex items-center gap-2">
                                <input
                                    className="flex-1 rounded-lg border border-slate-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-300"
                                    value={permissionsDraft}
                                    placeholder="users:read, ads:write, ..."
                                    onChange={(e) => setPermissionsDraft(e.target.value)}
                                />
                                <button
                                    className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2 py-1 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                                    disabled={isSaving}
                                    onClick={() => {
                                        if (!editingAdmin) return;
                                        void onSaveEdit({
                                            ...toEditableAdminFormState(editingAdmin),
                                            permissionsText: permissionsDraft,
                                        });
                                    }}
                                >
                                    <Save size={12} /> Save
                                </button>
                                <button
                                    className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                                    onClick={onCancelEdit}
                                >
                                    Cancel
                                </button>
                            </div>
                        );
                    }
                    return (
                        <div className="flex flex-wrap gap-1 max-w-[380px]">
                            {admin.permissions.length > 0
                                ? admin.permissions.map((p) => (
                                    <span key={p} className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-700">{p}</span>
                                ))
                                : <span className="text-xs italic text-slate-400">No explicit permissions</span>
                            }
                        </div>
                    );
                },
            },
            {
                header: "Actions",
                cell: (admin) => (
                    editingAdminId === admin.id ? null : (
                        <button
                            className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            onClick={() => onStartEdit(admin)}
                        >
                            Edit Permissions
                        </button>
                    )
                ),
            },
        ],
        [editingAdmin, editingAdminId, isSaving, permissionsDraft]
    );

    const columns: ColumnDef<ManagedAdmin>[] = useMemo(
        () => [
            ...ADMIN_IDENTITY_COLUMNS,
            {
                header: "Status",
                cell: (admin) => {
                    const { status, label } = getAdminStatusPresentation(admin.status);
                    return <StatusChip status={status} label={label} />;
                },
            },
            {
                header: "Permissions",
                cell: (admin) => (
                    <div className="max-w-[280px] text-xs text-slate-600">
                        {admin.permissions.length > 0 ? admin.permissions.join(", ") : "No explicit permissions"}
                    </div>
                ),
            },
            {
                header: "Last Login",
                cell: (admin) => (admin.lastLogin ? new Date(admin.lastLogin).toLocaleString() : "Never"),
            },
            {
                header: "Actions",
                cell: (admin) => (
                    <div className="flex items-center gap-2">
                        <button
                            className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            onClick={() => onStartEdit(admin)}
                        >
                            Edit
                        </button>
                        <button
                            className="inline-flex items-center gap-1 rounded-md border border-amber-200 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                            disabled={isSaving || admin.status === "inactive"}
                            onClick={() => void onDeactivate(admin)}
                        >
                            <Power size={12} /> Deactivate
                        </button>
                        <button
                            className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                            disabled={isSaving}
                            onClick={() => void onDelete(admin)}
                        >
                            <Trash2 size={12} /> Delete
                        </button>
                    </div>
                ),
            },
        ],
        [isSaving]
    );

    return (
        <AdminPageShell
            title={isPermissionsView ? "Roles & Permissions" : "Admin User Management"}
            description={isPermissionsView
                ? "Manage admin roles and explicit permission strings."
                : "Create, update, deactivate, and review administrator accounts."}
            tabs={<AdminModuleTabs tabs={administrationTabs} />}
        >
        <div className="space-y-6">

          {isPermissionsView ? (
            <DataTable data={admins} columns={permissionsColumns} isLoading={loading} emptyMessage="No admin users found." />
          ) : (<>

            <AdminUserFormCard
                mode="create"
                values={DEFAULT_CREATE_FORM}
                submitLabel="Create Admin"
                secondaryLabel="Clear"
                submitIcon={UserPlus}
                secondaryIcon={XCircle}
                isSubmitting={isSaving}
                permissionsPlaceholder="Permissions, comma separated (example: users:read, ads:write)"
                onSubmit={(values) => void onCreate(values)}
                onSecondary={() => undefined}
            />

            {editingAdminId && editingAdmin ? (
                <AdminUserFormCard
                    mode="edit"
                    title="Edit Admin"
                    values={toEditableAdminFormState(editingAdmin)}
                    submitLabel="Save"
                    secondaryLabel="Cancel"
                    submitIcon={Save}
                    secondaryIcon={XCircle}
                    isSubmitting={isSaving}
                    permissionsPlaceholder="Permissions, comma separated"
                    onSubmit={(values) => void onSaveEdit(values)}
                    onSecondary={onCancelEdit}
                />
            ) : null}

            <DataTable data={admins} columns={columns} isLoading={loading} emptyMessage="No admin users found." />
          </>)}
        </div>
        </AdminPageShell>
    );
}
