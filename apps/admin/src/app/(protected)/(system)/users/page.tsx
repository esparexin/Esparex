"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import {
    AlertCircle,
    User as UserIcon,
    Mail,
} from "@esparex/ui";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { AdminFilterToolbar } from "@/components/layout/AdminFilterToolbar";
import { StatusChip } from "@/components/ui/StatusChip";
import { UserActionDialog } from "@/components/system/users/UserActionDialog";
import { UserActionMenu } from "@/components/system/users/UserActionMenu";
import { UserQuickDetailsPanel } from "@/components/system/users/UserQuickDetailsPanel";
import {
    DEFAULT_USER_ACTION_STATE,
    getUserStatusPresentation,
    normalizeUserManagementStatusFilter,
    type ManagedUser,
    type UserActionState,
    type UserActionType,
} from "@/components/system/users/userManagement";
import { ADMIN_UI_ROUTES, readPositiveIntParam, readStringParam } from "@/lib/adminUiRoutes";
import { useClientUsers } from "@/hooks/useClientUsers";

import { AdminUserRoleBadge } from "@/components/system/adminUsers/AdminUserRoleBadge";

const USER_STATUS_OPTIONS = [
    { value: "all", label: "All Status" },
    { value: "live", label: "Active" },
    { value: "suspended", label: "Suspended" },
    { value: "banned", label: "Banned" },
];

export default function UsersPage() {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();

    const {
        users,
        loading,
        isMutating,
        error,
        pagination,
        overview,
        fetchUsers,
        handleUserAction
    } = useClientUsers();

    const [searchInput, setSearchInput] = useState("");
    const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
    const [actionModal, setActionModal] = useState<UserActionState>(DEFAULT_USER_ACTION_STATE);
    const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

    const dropdownRef = useRef<HTMLDivElement>(null);

    const statusFilter = normalizeUserManagementStatusFilter(searchParams.get("status"));
    const roleFilter = searchParams.get("role") || "all";
    const verifiedFilter =
        searchParams.get("isVerified") === "true" || searchParams.get("isVerified") === "false"
            ? (searchParams.get("isVerified") as "true" | "false")
            : "all";
    const committedSearch = readStringParam(searchParams.get("q") ?? searchParams.get("search"));
    const page = readPositiveIntParam(searchParams.get("page"), 1);

    useEffect(() => {
        const timer = setTimeout(() => {
            void fetchUsers({
                page,
                q: committedSearch,
                status: statusFilter,
                role: roleFilter !== "all" ? roleFilter : undefined,
                isVerified: verifiedFilter !== "all" ? verifiedFilter : undefined
            });
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchUsers, committedSearch, page, statusFilter, roleFilter, verifiedFilter]);

    useEffect(() => {
        void (async () => {
            setSearchInput((prev) => (prev === committedSearch ? prev : (committedSearch || "")));
        })();
    }, [committedSearch]);

    useEffect(() => {
        const nextUrl = ADMIN_UI_ROUTES.users({
            status: statusFilter !== "all" ? statusFilter : undefined,
            role: roleFilter !== "all" ? roleFilter : undefined,
            isVerified: verifiedFilter !== "all" ? verifiedFilter : undefined,
            q: committedSearch || undefined,
            page: page > 1 ? page : undefined,
        });
        const currentUrl = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;
        if (nextUrl !== currentUrl) {
            void router.replace(nextUrl, { scroll: false });
        }
    }, [committedSearch, page, pathname, router, searchParams, statusFilter, roleFilter, verifiedFilter]);

    useEffect(() => {
        const normalizedSearchInput = readStringParam(searchInput);
        if (normalizedSearchInput === committedSearch) {
            return;
        }

        const timer = setTimeout(() => {
            const nextUrl = ADMIN_UI_ROUTES.users({
                status: statusFilter !== "all" ? statusFilter : undefined,
                role: roleFilter !== "all" ? roleFilter : undefined,
                isVerified: verifiedFilter !== "all" ? verifiedFilter : undefined,
                q: normalizedSearchInput || undefined,
            });
            const currentUrl = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;
            if (nextUrl !== currentUrl) {
                void router.replace(nextUrl, { scroll: false });
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [committedSearch, pathname, router, searchInput, searchParams, statusFilter, roleFilter, verifiedFilter]);

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

        const result = await handleUserAction(type, user, reason);
        if (result.success) {
            closeActionModal();
            setSelectedUser(null);
            void fetchUsers({ page, q: committedSearch, status: statusFilter, role: roleFilter !== "all" ? roleFilter : undefined, isVerified: verifiedFilter });
        }
    };

    const columns: ColumnDef<ManagedUser>[] = [
        {
            header: "User Name",
            cell: (user) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-foreground-subtle">
                        <UserIcon size={20} />
                    </div>
                    <div>
                        <div className="font-bold text-foreground">{user.name || "Unknown"}</div>
                        <div className="text-xs text-foreground-tertiary">ID: {user.id}</div>
                    </div>
                </div>
            )
        },
        {
            header: "Mobile",
            cell: (user) => (
                <div className="text-sm font-medium text-foreground-secondary flex items-center gap-1">
                    {user.mobile}
                </div>
            )
        },
        {
            header: "Email",
            cell: (user) => (
                <div className="text-xs text-foreground-secondary flex items-center gap-1">
                    <Mail size={12} className="text-foreground-subtle" />
                    {user.email || "No email"}
                </div>
            )
        },
        {
            header: "Role",
            cell: (user) => <AdminUserRoleBadge role={user.role} />
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
                <span className="text-xs font-semibold text-foreground-secondary">
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
            showGlobalSearch={false}
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
                <div className="flex min-h-0 flex-1 flex-col gap-3">

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5 max-w-3xl">
                        <Link href={ADMIN_UI_ROUTES.users()} className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 shadow-2xs transition hover:border-slate-300 hover:shadow-xs">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground-tertiary">Total Users</p>
                            <p className="mt-0.5 text-base font-bold text-foreground">{overview.totalUsers.toLocaleString()}</p>
                        </Link>
                        <Link href={ADMIN_UI_ROUTES.users({ role: "user" })} className="rounded-md border border-emerald-200 bg-emerald-50/40 px-2.5 py-1.5 shadow-2xs transition hover:border-emerald-300 hover:shadow-xs">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700">Individuals</p>
                            <p className="mt-0.5 text-base font-bold text-emerald-700">{overview.individuals.toLocaleString()}</p>
                        </Link>
                        <Link href={ADMIN_UI_ROUTES.users({ role: "business" })} className="rounded-md border border-blue-200 bg-blue-50/40 px-2.5 py-1.5 shadow-2xs transition hover:border-blue-300 hover:shadow-xs">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-700">Businesses</p>
                            <p className="mt-0.5 text-base font-bold text-blue-700">{overview.businesses.toLocaleString()}</p>
                        </Link>
                        <Link href={ADMIN_UI_ROUTES.users({ role: "business", isVerified: "true" })} className="rounded-md border border-indigo-200 bg-indigo-50/40 px-2.5 py-1.5 shadow-2xs transition hover:border-indigo-300 hover:shadow-xs">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-700">Verified Businesses</p>
                            <p className="mt-0.5 text-base font-bold text-indigo-700">{overview.verifiedBusinesses.toLocaleString()}</p>
                        </Link>
                        <Link href={ADMIN_UI_ROUTES.users({ status: "suspended" })} className="rounded-md border border-red-200 bg-red-50/40 px-2.5 py-1.5 shadow-2xs transition hover:border-red-300 hover:shadow-xs">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-red-700">Blocked Users</p>
                            <p className="mt-0.5 text-base font-bold text-red-700">{overview.blockedUsers.toLocaleString()}</p>
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
                                    role: roleFilter !== "all" ? roleFilter : undefined,
                                    isVerified: verifiedFilter !== "all" ? verifiedFilter : undefined,
                                    q: committedSearch || undefined,
                                }),
                                { scroll: false }
                            );
                        }}
                        statusOptions={USER_STATUS_OPTIONS}
                        extraFilters={
                            <>
                                <select
                                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-200"
                                    value={roleFilter}
                                    onChange={(event) => {
                                        const nextRole = event.target.value;
                                        void router.replace(
                                            ADMIN_UI_ROUTES.users({
                                                status: statusFilter !== "all" ? statusFilter : undefined,
                                                role: nextRole !== "all" ? nextRole : undefined,
                                                isVerified: verifiedFilter !== "all" ? verifiedFilter : undefined,
                                                q: committedSearch || undefined,
                                            }),
                                            { scroll: false }
                                        );
                                    }}
                                >
                                    <option value="all">All Roles</option>
                                    <option value="user">Individuals</option>
                                    <option value="business">Businesses</option>
                                </select>
                                <select
                                    className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-sky-200"
                                    value={verifiedFilter}
                                    onChange={(event) => {
                                        const nextVerified = event.target.value as "all" | "true" | "false";
                                        void router.replace(
                                            ADMIN_UI_ROUTES.users({
                                                status: statusFilter !== "all" ? statusFilter : undefined,
                                                role: roleFilter !== "all" ? roleFilter : undefined,
                                                isVerified: nextVerified !== "all" ? nextVerified : undefined,
                                                q: committedSearch || undefined,
                                            }),
                                            { scroll: false }
                                        );
                                    }}
                                >
                                    <option value="all">All Verification</option>
                                    <option value="true">Verified</option>
                                    <option value="false">Unverified</option>
                                </select>
                            </>
                        }
                    />

                    {error ? (
                        <div className="flex items-center gap-2 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    ) : null}

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
                                            role: roleFilter !== "all" ? roleFilter : undefined,
                                            isVerified: verifiedFilter !== "all" ? verifiedFilter : undefined,
                                            q: committedSearch || undefined,
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
                isSubmitting={isMutating}
                onClose={closeActionModal}
                onConfirm={executeAction}
            />
        </div>
        </AdminPageShell>
    );
}
