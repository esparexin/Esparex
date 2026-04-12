"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { UserPlus, Power, Trash2, Save, XCircle } from "lucide-react";
import { DataTable, type ColumnDef } from "@/components/ui/DataTable";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { administrationTabs } from "@/components/layout/adminModuleTabSets";
import { StatusChip } from "@/components/ui/StatusChip";
import { AdminUserFormCard } from "@/components/system/adminUsers/AdminUserFormCard";
import { AdminUserIdentityCell } from "@/components/system/adminUsers/AdminUserIdentityCell";
import { AdminUserRoleBadge } from "@/components/system/adminUsers/AdminUserRoleBadge";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { CatalogModal } from "@/components/catalog/CatalogModal";
import {
    DEFAULT_CREATE_FORM,
    getAdminStatusPresentation,
    toEditableAdminFormState,
    getAdminDisplayName,
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
    
    const {
        admins,
        loading,
        isMutating,
        handleCreate,
        handleUpdate,
        handleToggleStatus,
        handleDelete
    } = useAdminUsers();

    const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
    const [editingAdmin, setEditingAdmin] = useState<ManagedAdmin | null>(null);
    const [permissionsDraft, setPermissionsDraft] = useState("");
    const [deletingAdminId, setDeletingAdminId] = useState<string | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    
    const isPermissionsView = searchParams.get("view") === "permissions";

    const onCreate = async (values: AdminCreateUserFormValues) => {
        const result = await handleCreate(values);
        if (result?.success) {
            setShowCreateForm(false);
        }
    };

    const onStartEdit = (admin: ManagedAdmin) => {
        setEditingAdminId(admin.id);
        setEditingAdmin(admin);
        setPermissionsDraft(admin.permissions.join(", "));
        setShowCreateForm(false);
    };

    const onCancelEdit = () => {
        setEditingAdminId(null);
        setEditingAdmin(null);
        setPermissionsDraft("");
    };

    const onSaveEdit = async (values: AdminEditUserFormValues) => {
        if (!editingAdminId) return;
        const result = await handleUpdate(editingAdminId, values);
        if (result?.success) {
            onCancelEdit();
        }
    };

    const confirmDelete = (id: string) => {
        setDeletingAdminId(id);
    };

    const onConfirmDelete = async () => {
        if (!deletingAdminId) return;
        const result = await handleDelete(deletingAdminId);
        if (result?.success) {
            setDeletingAdminId(null);
        }
    };

    const onToggleStatus = async (admin: ManagedAdmin) => {
        await handleToggleStatus(admin.id);
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
                                    disabled={isMutating}
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
        [editingAdmin, editingAdminId, isMutating, permissionsDraft]
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
                            onClick={() => onToggleStatus(admin)}
                            disabled={isMutating}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-primary transition-all group"
                            title={admin.status === "inactive" ? "Activate" : "Deactivate"}
                        >
                            <Power size={14} className={admin.status === "inactive" ? "text-slate-300" : "text-emerald-500"} />
                        </button>
                        <button
                            onClick={() => onStartEdit(admin)}
                            disabled={isMutating}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-blue-600 transition-all"
                            title="Edit Account"
                        >
                            <Save size={14} />
                        </button>
                        <button
                            onClick={() => confirmDelete(admin.id)}
                            disabled={isMutating}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-all"
                            title="Delete Account"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ),
            },
        ],
        [isMutating]
    );

    const deletingAdmin = admins.find(a => a.id === deletingAdminId);

    return (
        <AdminPageShell
            title={isPermissionsView ? "Roles & Permissions" : "Admin User Management"}
            description={isPermissionsView
                ? "Manage admin roles and explicit permission strings."
                : "Create, update, deactivate, and review administrator accounts."}
            actions={!isPermissionsView && !showCreateForm && !editingAdminId && (
                <button 
                    onClick={() => setShowCreateForm(true)}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 text-sm font-bold"
                >
                    <UserPlus size={18} />
                    <span>New Admin</span>
                </button>
            )}
        >
            <AdminModuleTabs tabs={administrationTabs} activeTab="admin-users" />

            <div className="space-y-6 mt-6">
                {!isPermissionsView && showCreateForm && (
                    <AdminUserFormCard
                        mode="create"
                        values={DEFAULT_CREATE_FORM}
                        submitLabel="Create Admin"
                        secondaryLabel="Cancel"
                        submitIcon={UserPlus}
                        secondaryIcon={XCircle}
                        isSubmitting={isMutating}
                        permissionsPlaceholder="Permissions, comma separated (example: users:read, ads:write)"
                        onSubmit={onCreate}
                        onSecondary={() => setShowCreateForm(false)}
                    />
                )}

                {!isPermissionsView && editingAdminId && editingAdmin && (
                    <AdminUserFormCard
                        mode="edit"
                        title={`Edit Admin: ${getAdminDisplayName(editingAdmin)}`}
                        values={toEditableAdminFormState(editingAdmin)}
                        submitLabel="Save Changes"
                        secondaryLabel="Cancel"
                        submitIcon={Save}
                        secondaryIcon={XCircle}
                        isSubmitting={isMutating}
                        permissionsPlaceholder="Permissions, comma separated"
                        onSubmit={onSaveEdit}
                        onSecondary={onCancelEdit}
                    />
                )}

                <DataTable
                    columns={isPermissionsView ? permissionsColumns : columns}
                    data={admins}
                    loading={loading}
                    searchPlaceholder="Search admin users..."
                />
            </div>

            {/* Delete Confirmation Modal */}
            <CatalogModal
                isOpen={!!deletingAdminId}
                onClose={() => setDeletingAdminId(null)}
                title="Confirm Account Deletion"
            >
                <div className="p-6">
                    <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                        Are you sure you want to delete the administrator account for <span className="font-bold text-slate-900">{deletingAdmin ? getAdminDisplayName(deletingAdmin) : "this user"}</span>? This action is permanent and will immediately revoke all access.
                    </p>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setDeletingAdminId(null)}
                            disabled={isMutating}
                            className="px-5 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-all text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirmDelete}
                            disabled={isMutating}
                            className="px-5 py-2 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 shadow-lg shadow-red-200 transition-all text-sm flex items-center gap-2"
                        >
                            {isMutating ? "Deleting..." : "Confirm Delete"}
                        </button>
                    </div>
                </div>
            </CatalogModal>
        </AdminPageShell>
    );
}
