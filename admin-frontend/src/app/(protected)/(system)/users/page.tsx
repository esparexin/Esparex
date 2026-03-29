"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { adminFetch } from "@/lib/api/adminClient";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import { parseAdminResponse } from "@/lib/api/parseAdminResponse";
import {
    User as UserIcon,
    Mail,
} from "lucide-react";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { AdminFilterToolbar } from "@/components/layout/AdminFilterToolbar";
import { AdminInlineAlert } from "@/components/ui/AdminInlineAlert";
import { StatusChip } from "@/components/ui/StatusChip";
import { useAdminMutation } from "@/hooks/useAdminMutation";
import { UserActionDialog } from "@/components/system/users/UserActionDialog";
import { UserActionMenu } from "@/components/system/users/UserActionMenu";
import { UserQuickDetailsPanel } from "@/components/system/users/UserQuickDetailsPanel";
import {
    DEFAULT_USER_ACTION_STATE,
    getUserStatusPresentation,
    normalizeManagedUser,
    normalizeUserManagementStatusFilter,
    type ManagedUser,
    type UserActionState,
    type UserActionType,
} from "@/components/system/users/userManagement";
import { ADMIN_UI_ROUTES, readPositiveIntParam, readStringParam } from "@/lib/adminUiRoutes";

const USER_STATUS_OPTIONS = [
    { value: "all", label: "All Status" },
    { value: "live", label: "Active" },
    { value: "suspended", label: "Suspended" },
    { value: "banned", label: "Banned" },
];

const USER_ROLE_COLORS: Record<string, string> = {
    super_admin: "bg-purple-100 text-purple-700",
    admin: "bg-blue-100 text-blue-700",
    business: "bg-amber-100 text-amber-700",
};

export default function UsersPage() {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isPending: isActionLoading, runMutation } = useAdminMutation();
    const [users, setUsers] = useState<ManagedUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [pagination, setPagination] = useState({
        total: 0,
        pages: 1,
        limit: 20
    });
    const [overview, setOverview] = useState({
        totalUsers: 0,
        activeUsers: 0,
        suspendedUsers: 0,
        bannedUsers: 0,
        verifiedUsers: 0
    });

    const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
    const [actionModal, setActionModal] = useState<UserActionState>(DEFAULT_USER_ACTION_STATE);
    const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

    const dropdownRef = useRef<HTMLDivElement>(null);

    const statusFilter = normalizeUserManagementStatusFilter(searchParams.get("status"));
    const verifiedFilter =
        searchParams.get("isVerified") === "true" || searchParams.get("isVerified") === "false"
            ? (searchParams.get("isVerified") as "true" | "false")
            : "all";
    const committedSearch = readStringParam(searchParams.get("search"));
    const page = readPositiveIntParam(searchParams.get("page"), 1);

    const fetchUsers = async () => {
        setLoading(true);
        setError("");
        try {
            const queryParams = new URLSearchParams({
                page: String(page),
                limit: "20",
            });
            if (committedSearch) {
                queryParams.set("search", committedSearch);
            }
            if (statusFilter !== "all") {
                queryParams.set("status", statusFilter);
            }
            if (verifiedFilter !== "all") {
                queryParams.set("isVerified", verifiedFilter);
            }
            const query = queryParams.toString();

            const [response, overviewResponse] = await Promise.all([
                adminFetch<any>(`${ADMIN_ROUTES.USERS}?${query}`),
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
            const overviewParsed = parseAdminResponse<never, Record<string, unknown>>(overviewResponse);
            const overviewData = overviewParsed.data || {};
            const banned = Number(overviewData.bannedUsers || 0);
            const suspended = Number(overviewData.suspendedUsers || 0);
            setOverview({
                totalUsers: Number(overviewData.totalUsers || 0),
                activeUsers: Number(overviewData.activeUsers || 0),
                suspendedUsers: suspended,
                bannedUsers: banned,
                verifiedUsers: Number(overviewData.verifiedUsers || 0)
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            void fetchUsers();
        }, 300);
        return () => clearTimeout(timer);
    }, [committedSearch, page, statusFilter, verifiedFilter]);

    useEffect(() => {
        setSearchInput((prev) => (prev === committedSearch ? prev : committedSearch));
    }, [committedSearch]);

    useEffect(() => {
        const nextUrl = ADMIN_UI_ROUTES.users({
            status: statusFilter !== "all" ? statusFilter : undefined,
            isVerified: verifiedFilter !== "all" ? verifiedFilter : undefined,
            search: committedSearch || undefined,
            page: page > 1 ? page : undefined,
        });
        const currentUrl = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;
        if (nextUrl !== currentUrl) {
            void router.replace(nextUrl, { scroll: false });
        }
    }, [committedSearch, page, pathname, router, searchParams, statusFilter, verifiedFilter]);

    useEffect(() => {
        const normalizedSearchInput = readStringParam(searchInput);
        if (normalizedSearchInput === committedSearch) {
            return;
        }

        const timer = setTimeout(() => {
            const nextUrl = ADMIN_UI_ROUTES.users({
                status: statusFilter !== "all" ? statusFilter : undefined,
                isVerified: verifiedFilter !== "all" ? verifiedFilter : undefined,
                search: normalizedSearchInput || undefined,
            });
            const currentUrl = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;
            if (nextUrl !== currentUrl) {
                void router.replace(nextUrl, { scroll: false });
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [committedSearch, pathname, router, searchInput, searchParams, statusFilter, verifiedFilter]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const openActionModal = (type: UserActionType, user: ManagedUser) => {
        setActionModal({ isOpen: true, type, user });
    };

    const closeActionModal = () => {
        setActionModal(DEFAULT_USER_ACTION_STATE);
    };

    const executeAction = async (reason: string) => {
        const { type, user } = actionModal;
        if (!user) return;

        await runMutation(
            async () => {
                if (["suspend", "ban", "activate"].includes(type)) {
                    const newStatus =
                        type === "activate" ? "active" : type === "suspend" ? "suspended" : "banned";
                    return adminFetch(ADMIN_ROUTES.USER_STATUS(user.id), {
                        method: "PATCH",
                        body: { status: newStatus, reason },
                    });
                }

                return adminFetch(ADMIN_ROUTES.USER_VERIFY(user.id), {
                    method: "PATCH",
                    body: { isVerified: type === "verify" },
                });
            },
            {
                successMessage: `User ${type} action completed successfully`,
                failureMessage: `Failed to ${type} user`,
                onSuccess: async () => {
                    closeActionModal();
                    setSelectedUser(null);
                    await fetchUsers();
                },
            }
        );
    };

    const columns: ColumnDef<ManagedUser>[] = [
        {
            header: "User Name",
            cell: (user) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <UserIcon size={20} />
                    </div>
                    <div>
                        <div className="font-bold text-slate-900">{user.name || "Unknown"}</div>
                        <div className="text-xs text-slate-500">ID: {user.id}</div>
                    </div>
                </div>
            )
        },
        {
            header: "Mobile",
            cell: (user) => (
                <div className="text-sm font-medium text-slate-700 flex items-center gap-1">
                    {user.mobile}
                </div>
            )
        },
        {
            header: "Email",
            cell: (user) => (
                <div className="text-xs text-slate-600 flex items-center gap-1">
                    <Mail size={12} className="text-slate-400" />
                    {user.email || "No email"}
                </div>
            )
        },
        {
            header: "Role",
            cell: (user) => (
                <span
                    className={`rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        USER_ROLE_COLORS[user.role] ?? "bg-slate-100 text-slate-600"
                    }`}
                >
                    {user.role}
                </span>
            )
        },
        {
            header: "Status",
            cell: (user) => {
                const { status, label } = getUserStatusPresentation(user.status);
                return <StatusChip status={status} label={label} />;
            }
        },
        {
            header: "Joined Date",
            cell: (user) => new Date(user.createdAt as string).toLocaleDateString()
        },
        {
            header: "Total Ads Posted",
            cell: (user) => (
                <span className="text-xs font-semibold text-slate-700">
                    {Number(user.totalAdsPosted ?? user.totalAds ?? 0)}
                </span>
            )
        },
        {
            header: "",
            cell: (user) => (
                <UserActionMenu
                    user={user}
                    isOpen={dropdownOpen === user.id}
                    menuRef={dropdownRef}
                    onToggle={() => setDropdownOpen(dropdownOpen === user.id ? null : user.id)}
                    onClose={() => setDropdownOpen(null)}
                    onOpenDetails={setSelectedUser}
                    onOpenAction={openActionModal}
                />
            ),
        }
    ];

    return (
        <AdminPageShell
            title="User Management"
            description="Review, verify and manage platform accounts"
            tabs={
                <AdminModuleTabs
                    tabs={[
                        { label: "All Users", href: ADMIN_UI_ROUTES.users() },
                        { label: "Active", href: ADMIN_UI_ROUTES.users({ status: "live" }), count: overview.activeUsers },
                        { label: "Suspended", href: ADMIN_UI_ROUTES.users({ status: "suspended" }), count: overview.suspendedUsers },
                        { label: "Banned", href: ADMIN_UI_ROUTES.users({ status: "banned" }), count: overview.bannedUsers },
                        { label: "Verified", href: ADMIN_UI_ROUTES.users({ isVerified: "true" }), count: overview.verifiedUsers },
                    ]}
                />
            }
            className="h-full overflow-hidden"
        >
        <div className="relative flex h-full min-h-0 overflow-hidden">
            <div className={`flex min-h-0 flex-1 flex-col overflow-hidden transition-all duration-300 ${selectedUser ? 'pr-[400px]' : ''}`}>
                <div className="flex min-h-0 flex-1 flex-col gap-6">

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
                        <Link href={ADMIN_UI_ROUTES.users()} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Users</p>
                            <p className="mt-2 text-2xl font-bold text-slate-900">{overview.totalUsers.toLocaleString()}</p>
                        </Link>
                        <Link href={ADMIN_UI_ROUTES.users({ status: "live" })} className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Active Users</p>
                            <p className="mt-2 text-2xl font-bold text-emerald-700">{overview.activeUsers.toLocaleString()}</p>
                        </Link>
                        <Link href={ADMIN_UI_ROUTES.users({ status: "suspended" })} className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Suspended Users</p>
                            <p className="mt-2 text-2xl font-bold text-amber-700">{overview.suspendedUsers.toLocaleString()}</p>
                        </Link>
                        <Link href={ADMIN_UI_ROUTES.users({ status: "banned" })} className="rounded-xl border border-red-200 bg-red-50/40 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                            <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Banned Users</p>
                            <p className="mt-2 text-2xl font-bold text-red-700">{overview.bannedUsers.toLocaleString()}</p>
                        </Link>
                        <Link href={ADMIN_UI_ROUTES.users({ isVerified: "true" })} className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Verified Users</p>
                            <p className="mt-2 text-2xl font-bold text-blue-700">{overview.verifiedUsers.toLocaleString()}</p>
                        </Link>
                    </div>

                    <AdminFilterToolbar
                        search={searchInput}
                        onSearchChange={setSearchInput}
                        searchPlaceholder="Search by name, email or mobile..."
                        status={statusFilter}
                        onStatusChange={(value) => {
                            const nextStatus = normalizeUserManagementStatusFilter(value);
                            void router.replace(
                                ADMIN_UI_ROUTES.users({
                                    status: nextStatus !== "all" ? nextStatus : undefined,
                                    isVerified: verifiedFilter !== "all" ? verifiedFilter : undefined,
                                    search: committedSearch || undefined,
                                }),
                                { scroll: false }
                            );
                        }}
                        statusOptions={USER_STATUS_OPTIONS}
                        extraFilters={
                            <select
                                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-200"
                                value={verifiedFilter}
                                onChange={(event) => {
                                    const nextVerified = event.target.value as "all" | "true" | "false";
                                    void router.replace(
                                        ADMIN_UI_ROUTES.users({
                                            status: statusFilter !== "all" ? statusFilter : undefined,
                                            isVerified: nextVerified !== "all" ? nextVerified : undefined,
                                            search: committedSearch || undefined,
                                        }),
                                        { scroll: false }
                                    );
                                }}
                            >
                                <option value="all">All Verification</option>
                                <option value="true">Verified</option>
                                <option value="false">Unverified</option>
                            </select>
                        }
                    />

                    <AdminInlineAlert message={error} />

                    <div className="min-h-0 flex-1">
                        <DataTable
                            data={users}
                            columns={columns}
                            isLoading={loading}
                            emptyMessage="No users matching your criteria"
                            pagination={{
                                currentPage: page,
                                totalPages: pagination.pages || 1,
                                totalItems: pagination.total,
                                pageSize: pagination.limit,
                                onPageChange: (nextPage) => {
                                    void router.replace(
                                        ADMIN_UI_ROUTES.users({
                                            status: statusFilter !== "all" ? statusFilter : undefined,
                                            isVerified: verifiedFilter !== "all" ? verifiedFilter : undefined,
                                            search: committedSearch || undefined,
                                            page: nextPage > 1 ? nextPage : undefined,
                                        }),
                                        { scroll: false }
                                    );
                                }
                            }}
                        />
                    </div>
                </div>
            </div>

            {selectedUser ? (
                <UserQuickDetailsPanel user={selectedUser} onClose={() => setSelectedUser(null)} />
            ) : null}

            <UserActionDialog
                open={actionModal.isOpen}
                user={actionModal.user}
                actionType={actionModal.type}
                isSubmitting={isActionLoading}
                onClose={closeActionModal}
                onConfirm={executeAction}
            />
        </div>
        </AdminPageShell>
    );
}
