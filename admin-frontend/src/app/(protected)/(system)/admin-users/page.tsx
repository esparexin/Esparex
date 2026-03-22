"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Shield, UserPlus, Power, Trash2, Save, XCircle } from "lucide-react";
import { DataTable, type ColumnDef } from "@/components/ui/DataTable";
import { useToast } from "@/context/ToastContext";
import { adminFetch } from "@/lib/api/adminClient";
import { parseAdminResponse } from "@/lib/api/parseAdminResponse";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { administrationTabs } from "@/components/layout/adminModuleTabSets";

type AdminRole = "super_admin" | "admin" | "moderator";
type AdminStatus = "live" | "inactive" | "suspended" | "banned";

type ManagedAdmin = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    status: string;
    permissions: string[];
    lastLogin?: string;
    createdAt?: string;
};

type AdminFormState = {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: AdminRole;
    status: AdminStatus;
    permissionsText: string;
};

const DEFAULT_CREATE_FORM: AdminFormState = {
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "moderator",
    status: "live",
    permissionsText: "",
};

const ROLE_COLORS: Record<string, string> = {
    super_admin: "bg-purple-100 text-purple-700",
    admin: "bg-blue-100 text-blue-700",
    moderator: "bg-amber-100 text-amber-700",
    user_manager: "bg-teal-100 text-teal-700",
    finance_manager: "bg-green-100 text-green-700",
    content_moderator: "bg-orange-100 text-orange-700",
    editor: "bg-sky-100 text-sky-700",
    viewer: "bg-slate-100 text-slate-600",
};

const DEFAULT_EDIT_FORM: Omit<AdminFormState, "password"> = {
    firstName: "",
    lastName: "",
    email: "",
    role: "moderator",
    status: "live",
    permissionsText: "",
};

function normalizeAdmin(raw: Record<string, unknown>): ManagedAdmin {
    const id = String(raw.id || raw._id || "");
    return {
        id,
        firstName: String(raw.firstName || ""),
        lastName: String(raw.lastName || ""),
        email: String(raw.email || ""),
        role: String(raw.role || "admin"),
        status: String(raw.status || "active"),
        permissions: Array.isArray(raw.permissions)
            ? raw.permissions.filter((item): item is string => typeof item === "string")
            : [],
        lastLogin: typeof raw.lastLogin === "string" ? raw.lastLogin : undefined,
        createdAt: typeof raw.createdAt === "string" ? raw.createdAt : undefined,
    };
}

export default function AdminUsersPage() {
    const searchParams = useSearchParams();
    const { showToast } = useToast();
    const [admins, setAdmins] = useState<ManagedAdmin[]>([]);
    const [loading, setLoading] = useState(true);
    const [createForm, setCreateForm] = useState<AdminFormState>(DEFAULT_CREATE_FORM);
    const [editForm, setEditForm] = useState<Omit<AdminFormState, "password">>(DEFAULT_EDIT_FORM);
    const [editingAdminId, setEditingAdminId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const isPermissionsView = searchParams.get("view") === "permissions";

    const loadAdmins = async () => {
        setLoading(true);
        try {
            const response = await adminFetch<Record<string, unknown>>(ADMIN_ROUTES.ADMIN_USERS);
            const parsed = parseAdminResponse<Record<string, unknown>>(response);
            setAdmins(parsed.items.map(normalizeAdmin));
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Failed to load admin users", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadAdmins();
    }, []);

    const resetCreateForm = () => setCreateForm(DEFAULT_CREATE_FORM);

    const onCreate = async () => {
        const name = `${createForm.firstName} ${createForm.lastName}`.trim();
        if (!name || !createForm.email || !createForm.password) {
            showToast("First name, last name, email, and password are required", "error");
            return;
        }

        setIsSaving(true);
        try {
            await adminFetch(ADMIN_ROUTES.ADMIN_USERS, {
                method: "POST",
                body: {
                    firstName: createForm.firstName.trim(),
                    lastName: createForm.lastName.trim(),
                    name,
                    email: createForm.email.trim(),
                    password: createForm.password,
                    role: createForm.role,
                    permissions: createForm.permissionsText
                        .split(",")
                        .map((value) => value.trim())
                        .filter(Boolean),
                },
            });
            showToast("Admin created successfully", "success");
            resetCreateForm();
            await loadAdmins();
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Failed to create admin", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const onStartEdit = (admin: ManagedAdmin) => {
        setEditingAdminId(admin.id);
        setEditForm({
            firstName: admin.firstName,
            lastName: admin.lastName,
            email: admin.email,
            role: (["super_admin", "admin", "moderator"].includes(admin.role) ? admin.role : "moderator") as AdminRole,
            status: (["live", "inactive", "suspended", "banned"].includes(admin.status) ? admin.status : "live") as AdminStatus,
            permissionsText: admin.permissions.join(", "),
        });
    };

    const onCancelEdit = () => {
        setEditingAdminId(null);
        setEditForm(DEFAULT_EDIT_FORM);
    };

    const onSaveEdit = async () => {
        if (!editingAdminId) return;
        setIsSaving(true);
        try {
            await adminFetch(ADMIN_ROUTES.ADMIN_USER_BY_ID(editingAdminId), {
                method: "PATCH",
                body: {
                    firstName: editForm.firstName.trim(),
                    lastName: editForm.lastName.trim(),
                    email: editForm.email.trim(),
                    role: editForm.role,
                    status: editForm.status,
                    permissions: editForm.permissionsText
                        .split(",")
                        .map((value) => value.trim())
                        .filter(Boolean),
                },
            });
            showToast("Admin updated successfully", "success");
            onCancelEdit();
            await loadAdmins();
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Failed to update admin", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const onDeactivate = async (admin: ManagedAdmin) => {
        setIsSaving(true);
        try {
            await adminFetch(ADMIN_ROUTES.ADMIN_USER_DEACTIVATE(admin.id), {
                method: "PATCH",
                body: {},
            });
            showToast(`Deactivated ${admin.email}`, "success");
            await loadAdmins();
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Failed to deactivate admin", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const onDelete = async (admin: ManagedAdmin) => {
        if (!window.confirm(`Delete admin ${admin.email}?`)) return;

        setIsSaving(true);
        try {
            await adminFetch(ADMIN_ROUTES.ADMIN_USER_BY_ID(admin.id), { method: "DELETE" });
            showToast(`Deleted ${admin.email}`, "success");
            await loadAdmins();
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Failed to delete admin", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const permissionsColumns: ColumnDef<ManagedAdmin>[] = useMemo(
        () => [
            {
                header: "Admin",
                cell: (admin) => (
                    <div>
                        <div className="font-semibold text-slate-900">{`${admin.firstName} ${admin.lastName}`.trim() || admin.email}</div>
                        <div className="text-xs text-slate-500">{admin.email}</div>
                    </div>
                ),
            },
            {
                header: "Role",
                cell: (admin) => (
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${ROLE_COLORS[admin.role] ?? "bg-slate-100 text-slate-600"}`}>
                        {admin.role.replace(/_/g, " ")}
                    </span>
                ),
            },
            {
                header: "Permissions",
                cell: (admin) => {
                    const isEditing = editingAdminId === admin.id;
                    if (isEditing) {
                        return (
                            <div className="flex items-center gap-2">
                                <input
                                    className="flex-1 rounded-lg border border-slate-300 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-300"
                                    value={editForm.permissionsText}
                                    placeholder="users:read, ads:write, ..."
                                    onChange={(e) => setEditForm((prev) => ({ ...prev, permissionsText: e.target.value }))}
                                />
                                <button
                                    className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2 py-1 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                                    disabled={isSaving}
                                    onClick={() => void onSaveEdit()}
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
        [editingAdminId, editForm.permissionsText, isSaving]
    );

    const columns: ColumnDef<ManagedAdmin>[] = useMemo(
        () => [
            {
                header: "Admin",
                cell: (admin) => (
                    <div>
                        <div className="font-semibold text-slate-900">{`${admin.firstName} ${admin.lastName}`.trim() || admin.email}</div>
                        <div className="text-xs text-slate-500">{admin.email}</div>
                    </div>
                ),
            },
            {
                header: "Role",
                cell: (admin) => <span className="text-xs font-semibold uppercase tracking-wide text-slate-700">{admin.role}</span>,
            },
            {
                header: "Status",
                cell: (admin) => {
                    const STATUS_COLORS: Record<string, string> = {
                        live: "bg-emerald-100 text-emerald-700",
                        inactive: "bg-slate-100 text-slate-500",
                        suspended: "bg-amber-100 text-amber-700",
                        banned: "bg-red-100 text-red-700",
                    };
                    const color = STATUS_COLORS[admin.status] ?? "bg-slate-100 text-slate-500";
                    return (
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${color}`}>
                            {admin.status}
                        </span>
                    );
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

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                    <input
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        placeholder="First name"
                        value={createForm.firstName}
                        onChange={(event) => setCreateForm((prev) => ({ ...prev, firstName: event.target.value }))}
                    />
                    <input
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Last name"
                        value={createForm.lastName}
                        onChange={(event) => setCreateForm((prev) => ({ ...prev, lastName: event.target.value }))}
                    />
                    <input
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Email"
                        value={createForm.email}
                        onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))}
                    />
                    <input
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        placeholder="Password"
                        type="password"
                        value={createForm.password}
                        onChange={(event) => setCreateForm((prev) => ({ ...prev, password: event.target.value }))}
                    />
                    <select
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        value={createForm.role}
                        onChange={(event) => setCreateForm((prev) => ({ ...prev, role: event.target.value as AdminRole }))}
                    >
                        <option value="moderator">moderator</option>
                        <option value="admin">admin</option>
                        <option value="super_admin">super_admin</option>
                    </select>
                    <input
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm md:col-span-5"
                        placeholder="Permissions, comma separated (example: users:read, ads:write)"
                        value={createForm.permissionsText}
                        onChange={(event) => setCreateForm((prev) => ({ ...prev, permissionsText: event.target.value }))}
                    />
                </div>
                <div className="mt-3 flex items-center gap-2">
                    <button
                        className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                        disabled={isSaving}
                        onClick={() => void onCreate()}
                    >
                        <UserPlus size={14} /> Create Admin
                    </button>
                    <button
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        onClick={resetCreateForm}
                    >
                        <XCircle size={14} /> Clear
                    </button>
                </div>
            </div>

            {editingAdminId && (
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="mb-3 text-base font-semibold text-slate-900">Edit Admin</h2>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
                        <input
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            value={editForm.firstName}
                            onChange={(event) => setEditForm((prev) => ({ ...prev, firstName: event.target.value }))}
                        />
                        <input
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            value={editForm.lastName}
                            onChange={(event) => setEditForm((prev) => ({ ...prev, lastName: event.target.value }))}
                        />
                        <input
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            value={editForm.email}
                            onChange={(event) => setEditForm((prev) => ({ ...prev, email: event.target.value }))}
                        />
                        <select
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            value={editForm.role}
                            onChange={(event) => setEditForm((prev) => ({ ...prev, role: event.target.value as AdminRole }))}
                        >
                            <option value="moderator">moderator</option>
                            <option value="admin">admin</option>
                            <option value="super_admin">super_admin</option>
                        </select>
                        <select
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                            value={editForm.status}
                            onChange={(event) => setEditForm((prev) => ({ ...prev, status: event.target.value as AdminStatus }))}
                        >
                            <option value="live">live</option>
                            <option value="inactive">inactive</option>
                            <option value="suspended">suspended</option>
                            <option value="banned">banned</option>
                        </select>
                        <input
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm md:col-span-5"
                            value={editForm.permissionsText}
                            onChange={(event) => setEditForm((prev) => ({ ...prev, permissionsText: event.target.value }))}
                            placeholder="Permissions, comma separated"
                        />
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                        <button
                            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
                            disabled={isSaving}
                            onClick={() => void onSaveEdit()}
                        >
                            <Save size={14} /> Save
                        </button>
                        <button
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            onClick={onCancelEdit}
                        >
                            <XCircle size={14} /> Cancel
                        </button>
                    </div>
                </div>
            )}

            <DataTable data={admins} columns={columns} isLoading={loading} emptyMessage="No admin users found." />
          </>)}
        </div>
        </AdminPageShell>
    );
}
