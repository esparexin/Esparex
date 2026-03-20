"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { adminFetch } from "@/lib/api/adminClient";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import { parseAdminResponse } from "@/lib/api/parseAdminResponse";
import { useToast } from "@/context/ToastContext";
import { User } from "@/types/user";
import {
    User as UserIcon,
    Mail,
    Shield,
    CheckCircle2,
    AlertCircle,
    Search,
    Filter,
    MoreVertical,
    Eye,
    Ban,
    PlayCircle,
    X,
} from "lucide-react";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { AdminPageShell } from "@/components/layout/AdminPageShell";

export default function UsersPage() {
    const { showToast } = useToast();
    const searchParams = useSearchParams();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [verifiedFilter, setVerifiedFilter] = useState<"all" | "true" | "false">("all");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({
        total: 0,
        pages: 1,
        limit: 20
    });
    const [overview, setOverview] = useState({
        totalUsers: 0,
        activeUsers: 0,
        blockedUsers: 0,
        verifiedUsers: 0
    });

    // NEW STATE: Details & Actions
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [actionModal, setActionModal] = useState<{
        isOpen: boolean;
        type: 'suspend' | 'ban' | 'activate' | 'verify' | 'unverify';
        user: User | null;
    }>({ isOpen: false, type: 'suspend', user: null });
    const [actionReason, setActionReason] = useState("");
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState<string | null>(null);

    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                search,
                status: statusFilter,
                page: String(page),
                limit: "20"
            });
            if (verifiedFilter !== "all") {
                queryParams.set("isVerified", verifiedFilter);
            }
            const query = queryParams.toString();

            const [response, overviewResponse] = await Promise.all([
                adminFetch<any>(`${ADMIN_ROUTES.USERS}?${query}`),
                adminFetch<any>(ADMIN_ROUTES.USER_OVERVIEW)
            ]);
            const parsed = parseAdminResponse<User>(response);
            setUsers(parsed.items);
            if (parsed.pagination) {
                setPagination({
                    total: parsed.pagination.total ?? 0,
                    pages: parsed.pagination.pages ?? parsed.pagination.totalPages ?? 1,
                    limit: parsed.pagination.limit ?? 20
                });
            }
            const overviewParsed = parseAdminResponse<never, Record<string, unknown>>(overviewResponse);
            const overviewData = overviewParsed.data || {};
            const suspended = Number(overviewData.suspendedUsers || 0);
            const banned = Number(overviewData.bannedUsers || 0);
            setOverview({
                totalUsers: Number(overviewData.totalUsers || 0),
                activeUsers: Number(overviewData.activeUsers || 0),
                blockedUsers: suspended + banned,
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
    }, [search, statusFilter, verifiedFilter, page]);

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [search, statusFilter, verifiedFilter]);

    useEffect(() => {
        const requestedStatus = searchParams.get("status");
        const requestedVerified = searchParams.get("isVerified");
        const requestedSearch = searchParams.get("search");
        const allowed = new Set(["all", "active", "suspended", "banned", "blocked"]);
        const normalizedStatus =
            requestedStatus && allowed.has(requestedStatus)
                ? (requestedStatus === "blocked" ? "banned" : requestedStatus)
                : "all";
        const normalizedVerified =
            requestedVerified === "true" || requestedVerified === "false"
                ? requestedVerified
                : "all";
        const normalizedSearch = typeof requestedSearch === "string" ? requestedSearch : "";
        setStatusFilter((prev) => (prev === normalizedStatus ? prev : normalizedStatus));
        setVerifiedFilter((prev) => (prev === normalizedVerified ? prev : normalizedVerified));
        setSearch((prev) => (prev === normalizedSearch ? prev : normalizedSearch));
        setPage(1);
    }, [searchParams]);

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

    const executeAction = async () => {
        if (!actionModal.user) return;
        setIsActionLoading(true);
        try {
            if (['suspend', 'ban', 'activate'].includes(actionModal.type)) {
                const newStatus = actionModal.type === 'activate' ? 'active' : actionModal.type === 'suspend' ? 'suspended' : 'banned';
                await adminFetch(ADMIN_ROUTES.USER_STATUS(actionModal.user.id), {
                    method: 'PATCH',
                    body: { status: newStatus, reason: actionReason }
                });
            } else if (['verify', 'unverify'].includes(actionModal.type)) {
                const isVerified = actionModal.type === 'verify';
                await adminFetch(ADMIN_ROUTES.USER_VERIFY(actionModal.user.id), {
                    method: 'PATCH',
                    body: { isVerified }
                });
            }
            showToast(`User ${actionModal.type} action completed successfully`, 'success' as const);
            setActionModal({ isOpen: false, type: 'suspend', user: null });
            setActionReason("");
            setSelectedUser(null);
            void fetchUsers();
        } catch (err) {
            showToast(err instanceof Error ? err.message : `Failed to ${actionModal.type} user`, 'error' as const);
        } finally {
            setIsActionLoading(false);
        }
    };

    const columns: ColumnDef<User>[] = [
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
                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${user.role === 'super_admin' ? "bg-purple-100 text-purple-700" :
                    user.role === 'admin' ? "bg-blue-100 text-blue-700" :
                        user.role === 'business' ? "bg-amber-100 text-amber-700" :
                            "bg-slate-100 text-slate-600"
                    }`}>
                    {user.role}
                </span>
            )
        },
        {
            header: "Status",
            cell: (user) => (
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${user.status === 'active' ? "bg-emerald-500" :
                        user.status === 'suspended' ? "bg-amber-500" :
                            "bg-red-500"
                        }`} />
                    <span className="capitalize text-xs font-medium">{user.status}</span>
                </div>
            )
        },
        {
            header: "Joined Date",
            cell: (user) => new Date(user.createdAt as string).toLocaleDateString()
        },
        {
            header: "Total Ads Posted",
            cell: (user) => (
                <span className="text-xs font-semibold text-slate-700">
                    {Number((user as any).totalAdsPosted || 0)}
                </span>
            )
        },
        {
            header: "",
            cell: (user) => (
                <div className="relative flex justify-end">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setDropdownOpen(dropdownOpen === user.id ? null : user.id);
                        }}
                        className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-400"
                    >
                        <MoreVertical size={20} />
                    </button>

                    {dropdownOpen === user.id && (
                        <div
                            ref={dropdownRef}
                            className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-100 py-1 z-50 text-sm font-medium"
                        >
                            <Link
                                href={`/users/${encodeURIComponent(user.id)}`}
                                onClick={() => setDropdownOpen(null)}
                                className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2 block"
                            >
                                <Eye size={16} /> View Profile
                            </Link>
                            <Link
                                href={`/moderation?sellerId=${encodeURIComponent(user.id)}`}
                                onClick={() => setDropdownOpen(null)}
                                className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2 block"
                            >
                                <Search size={16} /> View Ads
                            </Link>
                            <button
                                onClick={() => { setSelectedUser(user); setDropdownOpen(null); }}
                                className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                            >
                                <UserIcon size={16} /> Quick Details
                            </button>
                            <button
                                onClick={() => { setActionModal({ isOpen: true, type: user.isVerified ? 'unverify' : 'verify', user }); setDropdownOpen(null); }}
                                className="w-full text-left px-4 py-2 hover:bg-slate-50 text-slate-700 flex items-center gap-2"
                            >
                                <Shield size={16} /> {user.isVerified ? 'Revoke Verification' : 'Verify User'}
                            </button>

                            <hr className="my-1 border-slate-100" />

                            {user.status === 'active' ? (
                                <>
                                    <button
                                        onClick={() => { setActionModal({ isOpen: true, type: 'ban', user }); setDropdownOpen(null); }}
                                        className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-700 flex items-center gap-2"
                                    >
                                        <Ban size={16} /> Block User
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => { setActionModal({ isOpen: true, type: 'activate', user }); setDropdownOpen(null); }}
                                    className="w-full text-left px-4 py-2 hover:bg-emerald-50 text-emerald-700 flex items-center gap-2"
                                >
                                    <PlayCircle size={16} /> Reactivate Account
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )
        }
    ];

    return (
        <AdminPageShell
            title="User Management"
            description="Review, verify and manage platform accounts"
            tabs={
                <AdminModuleTabs
                    tabs={[
                        { label: "All Users", href: "/users" },
                        { label: "Active", href: "/users?status=active", count: overview.activeUsers },
                        { label: "Suspended", href: "/users?status=suspended" },
                        { label: "Blocked", href: "/users?status=blocked", count: overview.blockedUsers },
                        { label: "Verified", href: "/users?isVerified=true", count: overview.verifiedUsers },
                    ]}
                />
            }
            className="h-full overflow-hidden"
        >
        <div className="relative flex h-full min-h-0 overflow-hidden">
            <div className={`flex min-h-0 flex-1 flex-col overflow-hidden transition-all duration-300 ${selectedUser ? 'pr-[400px]' : ''}`}>
                <div className="flex min-h-0 flex-1 flex-col gap-6">

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <Link href="/users" className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Users</p>
                            <p className="mt-2 text-2xl font-bold text-slate-900">{overview.totalUsers.toLocaleString()}</p>
                        </Link>
                        <Link href="/users?status=active" className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Active Users</p>
                            <p className="mt-2 text-2xl font-bold text-emerald-700">{overview.activeUsers.toLocaleString()}</p>
                        </Link>
                        <Link href="/users?status=blocked" className="rounded-xl border border-red-200 bg-red-50/40 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                            <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Blocked Users</p>
                            <p className="mt-2 text-2xl font-bold text-red-700">{overview.blockedUsers.toLocaleString()}</p>
                        </Link>
                        <Link href="/users?isVerified=true" className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Verified Users</p>
                            <p className="mt-2 text-2xl font-bold text-blue-700">{overview.verifiedUsers.toLocaleString()}</p>
                        </Link>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by name, email or mobile..."
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <Filter className="text-slate-400" size={18} />
                            <select
                                className="flex-1 md:w-40 bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="suspended">Suspended</option>
                                <option value="banned">Banned</option>
                            </select>
                        </div>
                    </div>


                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 rounded-lg p-4 text-sm font-medium flex items-center gap-2 italic">
                            <AlertCircle size={18} /> {error}
                        </div>
                    )}

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
                                onPageChange: setPage
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Slide-over User Details Panel */}
            {selectedUser && (
                <div className="w-[400px] border-l border-slate-200 bg-white shadow-[-10px_0_20px_-10px_rgba(0,0,0,0.05)] h-full absolute right-0 top-0 overflow-y-auto z-10">
                    <div className="p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900">User Details</h2>
                            <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex flex-col items-center bg-slate-50 p-6 rounded-xl border border-slate-100">
                            <div className="w-20 h-20 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 mb-4">
                                <UserIcon size={40} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">{selectedUser.name || "Unknown"}</h3>
                            <div className={`mt-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${selectedUser.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                                selectedUser.status === 'suspended' ? 'bg-amber-100 text-amber-700' :
                                    'bg-red-100 text-red-700'
                                }`}>
                                {selectedUser.status}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest text-slate-500 border-b border-slate-100 pb-2">Identity</h4>

                            <div>
                                <div className="text-xs text-slate-500 mb-1">Mobile Number</div>
                                <div className="font-semibold text-slate-900 flex items-center gap-2">
                                    {selectedUser.mobile} {selectedUser.isPhoneVerified && <CheckCircle2 size={14} className="text-emerald-500" />}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-500 mb-1">Email Address</div>
                                <div className="font-semibold text-slate-900 flex items-center gap-2">
                                    {selectedUser.email || "N/A"} {selectedUser.isEmailVerified && <CheckCircle2 size={14} className="text-emerald-500" />}
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-500 mb-1">Overall Verification</div>
                                <div className="font-semibold text-slate-900">
                                    {selectedUser.isVerified ? <span className="text-emerald-600">Verified</span> : <span className="text-slate-400">Unverified</span>}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4">
                            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest text-slate-500 border-b border-slate-100 pb-2">Business & Status</h4>
                            <div>
                                <div className="text-xs text-slate-500 mb-1">Role</div>
                                <div className="font-semibold text-slate-900 capitalize">{selectedUser.role}</div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-500 mb-1">Business Status</div>
                                <div className="font-semibold text-slate-900 capitalize">{selectedUser.businessStatus || "None"}</div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-500 mb-1">Account Created</div>
                                <div className="font-semibold text-slate-900">{new Date(selectedUser.createdAt as string).toLocaleString()}</div>
                            </div>
                        </div>

                        <div className="space-y-3 pt-2">
                            <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest text-slate-500 border-b border-slate-100 pb-2">Quick Access</h4>
                            <div className="flex flex-col gap-2">
                                <Link href={`/moderation?sellerId=${encodeURIComponent(selectedUser.id)}`} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                                    View User Ads
                                </Link>
                                <Link href={`/reports?search=${encodeURIComponent(selectedUser.id)}`} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                                    View User Reports
                                </Link>
                                <Link href={`/finance?search=${encodeURIComponent(selectedUser.id)}`} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                                    View User Payments
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Action Confirmation Modal */}
            {actionModal.isOpen && actionModal.user && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className={`p-6 border-b ${['ban'].includes(actionModal.type) ? 'bg-red-50 border-red-100 text-red-900' :
                            ['suspend'].includes(actionModal.type) ? 'bg-amber-50 border-amber-100 text-amber-900' :
                                'bg-emerald-50 border-emerald-100 text-emerald-900'
                            }`}>
                            <h3 className="text-lg font-bold capitalize flex items-center gap-2">
                                {actionModal.type === 'ban' ? <Ban size={20} /> : actionModal.type === 'suspend' ? <Shield size={20} /> : <Shield size={20} />}
                                Confirm {actionModal.type}
                            </h3>
                            <p className="text-sm mt-1 opacity-80">
                                You are about to {actionModal.type} <strong>{actionModal.user.name || actionModal.user.mobile}</strong>.
                            </p>
                        </div>

                        <div className="p-6">
                            {['suspend', 'ban'].includes(actionModal.type) && (
                                <div className="mb-4">
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">Reason for Action (Required)</label>
                                    <textarea
                                        className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[100px]"
                                        placeholder="Explain why this account is being actioned to maintain the audit log..."
                                        value={actionReason}
                                        onChange={(e) => setActionReason(e.target.value)}
                                    ></textarea>
                                </div>
                            )}

                            <p className="text-sm text-slate-500 mb-6">
                                Are you sure you wish to proceed? This will be logged permanently in the system audit trail.
                            </p>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setActionModal({ isOpen: false, type: 'suspend', user: null })}
                                    className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors"
                                    disabled={isActionLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={executeAction}
                                    disabled={isActionLoading || (['suspend', 'ban'].includes(actionModal.type) && !actionReason.trim())}
                                    className={`flex-1 px-4 py-2 font-bold rounded-lg transition-colors text-white ${isActionLoading ? 'opacity-50 cursor-not-allowed' : ''
                                        } ${['ban'].includes(actionModal.type) ? 'bg-red-600 hover:bg-red-700' :
                                            ['suspend'].includes(actionModal.type) ? 'bg-amber-600 hover:bg-amber-700' :
                                                'bg-emerald-600 hover:bg-emerald-700'
                                        }`}
                                >
                                    {isActionLoading ? 'Processing...' : `Confirm ${actionModal.type}`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
        </AdminPageShell>
    );
}
