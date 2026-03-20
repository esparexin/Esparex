"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { 
    Building2, 
    Search,
    Eye, 
    MapPin,
    Ban,
    RotateCcw,
    Pencil,
    Trash2,
    ChartBar
} from "lucide-react";
import { format } from "date-fns";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { adminFetch } from "@/lib/api/adminClient";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import { parseAdminResponse } from "@/lib/api/parseAdminResponse";
import { useToast } from "@/context/ToastContext";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { BusinessDetailsModal } from "@/components/business/BusinessDetailsModal";
import { BusinessSuspendModal } from "@/components/business/BusinessSuspendModal";
import { BusinessRejectModal } from "@/components/business/BusinessRejectModal";
import { BusinessModifyModal } from "@/components/business/BusinessModifyModal";
import { Business } from "@/types/business";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";

export default function BusinessesView() {
    const { showToast } = useToast();
    const searchParams = useSearchParams();
    
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [cityFilter, setCityFilter] = useState("");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, pages: 1, limit: 20 });
    const [overview, setOverview] = useState({ total: 0, pending: 0, live: 0, suspended: 0 });

    const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
    const [suspendTarget, setSuspendTarget] = useState<Business | null>(null);
    const [rejectTarget, setRejectTarget] = useState<Business | null>(null);
    const [modifyTarget, setModifyTarget] = useState<Business | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Business | null>(null);

    const activeTab = searchParams.get("status") || "live";

    const fetchBusinesses = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                search,
                status: activeTab,
                page: String(page),
                limit: "20"
            });
            if (cityFilter) queryParams.set("city", cityFilter);

            const [response, overviewResponse] = await Promise.all([
                adminFetch<any>(`${ADMIN_ROUTES.BUSINESS_ACCOUNTS}?${queryParams.toString()}`),
                adminFetch<any>(ADMIN_ROUTES.BUSINESS_OVERVIEW)
            ]);
            const parsed = parseAdminResponse<Business>(response);
            setBusinesses(parsed.items);
            if (parsed.pagination) {
                setPagination({
                    total: parsed.pagination.total ?? 0,
                    pages: parsed.pagination.pages ?? 1,
                    limit: parsed.pagination.limit ?? 20
                });
            }
            const od = overviewResponse?.data || overviewResponse || {};
            setOverview({
                total: Number(od.total || 0),
                pending: Number(od.pending || 0),
                live: Number(od.live || od.approved || 0),
                suspended: Number(od.suspended || 0)
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load businesses");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => { void fetchBusinesses(); }, 300);
        return () => clearTimeout(timer);
    }, [search, cityFilter, activeTab, page]);

    const handleSuspend = async (id: string, reason: string) => {
        await adminFetch(ADMIN_ROUTES.BUSINESS_STATUS(id), { method: "PATCH", body: { status: "suspended", reason } });
        showToast("Business suspended", "success");
        setSuspendTarget(null);
        setSelectedBusiness(null);
        void fetchBusinesses();
    };

    const handleActivate = async (id: string) => {
        try {
            await adminFetch(ADMIN_ROUTES.BUSINESS_APPROVE(id), { method: "PATCH" });
            showToast("Business reactivated successfully", "success");
            setSelectedBusiness(null);
            void fetchBusinesses();
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to activate business", "error");
        }
    };

    const handleReject = async (id: string, reason: string) => {
        await adminFetch(ADMIN_ROUTES.BUSINESS_REJECT(id), { method: "PATCH", body: { reason } });
        showToast("Business rejected", "success");
        setRejectTarget(null);
        setSelectedBusiness(null);
        void fetchBusinesses();
    };

    const handleModify = async (id: string, patch: Partial<Business>) => {
        await adminFetch(ADMIN_ROUTES.BUSINESS_UPDATE(id), { method: "PUT", body: patch });
        showToast("Business updated", "success");
        setModifyTarget(null);
        setSelectedBusiness(null);
        void fetchBusinesses();
    };

    const handleDelete = async (id: string) => {
        try {
            await adminFetch(ADMIN_ROUTES.DELETE_BUSINESS(id), { method: "DELETE" });
            showToast("Business deleted", "success");
            setDeleteTarget(null);
            setSelectedBusiness(null);
            void fetchBusinesses();
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to delete business", "error");
        }
    };

    const columns: ColumnDef<Business>[] = [
        {
            header: "Business",
            cell: (biz) => (
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                        <Building2 size={20} />
                    </div>
                    <div className="min-w-0">
                        <div className="font-bold text-slate-900 leading-tight truncate">{biz.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">{biz.id}</div>
                    </div>
                </div>
            )
        },
        {
            header: "Trust",
            cell: (biz) => {
                const score = biz.trustScore ?? 0;
                const color = score > 70 ? "text-emerald-500" : score > 40 ? "text-amber-500" : "text-red-500";
                const bar = score > 70 ? "bg-emerald-500" : score > 40 ? "bg-amber-500" : "bg-red-500";
                return (
                    <div className="flex flex-col gap-1 w-16">
                        <div className={`text-xs font-bold ${color}`}>{score}</div>
                        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div className={`h-full ${bar}`} style={{ width: `${score}%` }} />
                        </div>
                    </div>
                );
            }
        },
        {
            header: "Category",
            cell: (biz) => (
                <div className="text-xs text-slate-600 truncate max-w-[120px]">
                    {(biz.businessTypes ?? []).slice(0, 2).join(", ") || "—"}
                </div>
            )
        },
        {
            header: "Location",
            cell: (biz) => (
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <MapPin size={12} className="text-slate-400 shrink-0" />
                    <span className="truncate max-w-[110px]">{biz.location?.city || "—"}</span>
                </div>
            )
        },
        {
            header: "Active Since",
            cell: (biz) => (
                <div className="space-y-0.5">
                    <div className="text-xs text-slate-700 font-medium">
                        {biz.approvedAt ? format(new Date(biz.approvedAt), "MMM d, yyyy") : "N/A"}
                    </div>
                    {biz.expiresAt && (
                        <div className="text-[9px] text-slate-400 italic">
                            Exp {format(new Date(biz.expiresAt), "MMM d, yyyy")}
                        </div>
                    )}
                </div>
            )
        },
        {
            header: "Status",
            cell: (biz) => (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    biz.status === "live" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                    biz.status === "suspended" ? "bg-red-100 text-red-700 border-red-200" :
                    biz.status === "pending" ? "bg-amber-100 text-amber-700 border-amber-200" :
                    "bg-slate-100 text-slate-600 border-slate-200"
                }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                        biz.status === "live" ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]" :
                        biz.status === "suspended" ? "bg-red-500" :
                        biz.status === "pending" ? "bg-amber-500 animate-pulse" :
                        "bg-slate-300"
                    }`} />
                    {biz.status}
                </span>
            )
        },
        {
            header: "Actions",
            id: "actions",
            cell: (biz) => (
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                        onClick={() => setSelectedBusiness(biz)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-primary transition-colors"
                        title="View Details"
                    >
                        <Eye size={15} />
                    </button>
                    <button
                        onClick={() => setModifyTarget(biz)}
                        className="p-1.5 hover:bg-blue-50 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
                        title="Edit Business"
                    >
                        <Pencil size={15} />
                    </button>
                    {biz.status === "live" && (
                        <button
                            onClick={() => setSuspendTarget(biz)}
                            className="p-1.5 hover:bg-orange-50 rounded-lg text-slate-400 hover:text-orange-600 transition-colors"
                            title="Suspend Business"
                        >
                            <Ban size={15} />
                        </button>
                    )}
                    {biz.status === "suspended" && (
                        <button
                            onClick={() => handleActivate(biz.id)}
                            className="p-1.5 hover:bg-emerald-50 rounded-lg text-slate-400 hover:text-emerald-600 transition-colors"
                            title="Reactivate Business"
                        >
                            <RotateCcw size={15} />
                        </button>
                    )}
                    <button
                        onClick={() => setDeleteTarget(biz)}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                        title="Delete Business"
                    >
                        <Trash2 size={15} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <AdminPageShell
            title="Business Master"
            description="Central directory of all verified and registered business accounts"
            headerVariant="compact"
        >
            <div className="space-y-6">
                {/* Stats Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: "Total", value: overview.total, color: "text-slate-700" },
                        { label: "Live", value: overview.live, color: "text-emerald-600" },
                        { label: "Pending", value: overview.pending, color: "text-amber-600" },
                        { label: "Suspended", value: overview.suspended, color: "text-red-600" },
                    ].map(({ label, value, color }) => (
                        <div key={label} className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3 shadow-sm">
                            <ChartBar size={16} className="text-slate-300" />
                            <div>
                                <div className={`text-lg font-bold ${color}`}>{value}</div>
                                <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">{label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Status Tabs */}
                <AdminModuleTabs
                    tabs={[
                        { label: "Live", href: "/businesses?status=live", count: overview.live },
                        { label: "Suspended", href: "/businesses?status=suspended", count: overview.suspended },
                        { label: "Pending", href: "/businesses?status=pending", count: overview.pending },
                        { label: "Deleted", href: "/businesses?status=deleted" },
                        { label: "All", href: "/businesses?status=all" }
                    ]}
                />

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="relative flex-1 min-w-[200px] max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search by name, mobile, email..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <input
                        type="text"
                        placeholder="Filter by city..."
                        className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all w-36"
                        value={cityFilter}
                        onChange={(e) => setCityFilter(e.target.value)}
                    />
                    <div className="ml-auto text-xs text-slate-400">{pagination.total} results</div>
                </div>

                {/* Table */}
                <DataTable
                    data={businesses}
                    columns={columns}
                    isLoading={loading}
                    onRowClick={(biz) => setSelectedBusiness(biz)}
                    pagination={{
                        currentPage: page,
                        totalPages: pagination.pages,
                        totalItems: pagination.total,
                        pageSize: 20,
                        onPageChange: (p) => setPage(p)
                    }}
                    emptyMessage={error || "No businesses found."}
                />
            </div>

            {/* Detail Modal */}
            {selectedBusiness && (
                <BusinessDetailsModal
                    business={selectedBusiness}
                    onClose={() => setSelectedBusiness(null)}
                    onApprove={(id) => handleActivate(id)}
                    onReject={(id) => setRejectTarget(businesses.find(b => b.id === id) ?? selectedBusiness)}
                    onModify={(biz) => setModifyTarget(biz)}
                    onSuspend={(id) => setSuspendTarget(businesses.find(b => b.id === id) ?? selectedBusiness)}
                    onActivate={(id) => handleActivate(id)}
                    onDelete={(id) => setDeleteTarget(businesses.find(b => b.id === id) ?? selectedBusiness)}
                />
            )}

            {/* Suspend Modal */}
            {suspendTarget && (
                <BusinessSuspendModal
                    businessName={suspendTarget.name}
                    onClose={() => setSuspendTarget(null)}
                    onConfirm={(reason) => handleSuspend(suspendTarget.id, reason)}
                />
            )}

            {/* Reject Modal */}
            {rejectTarget && (
                <BusinessRejectModal
                    businessName={rejectTarget.name}
                    onClose={() => setRejectTarget(null)}
                    onConfirm={(reason) => handleReject(rejectTarget.id, reason)}
                />
            )}

            {/* Modify Modal */}
            {modifyTarget && (
                <BusinessModifyModal
                    business={modifyTarget}
                    onClose={() => setModifyTarget(null)}
                    onConfirm={(patch) => handleModify(modifyTarget.id, patch)}
                />
            )}

            {/* Delete Confirmation */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                                <Trash2 size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-slate-900 text-sm">Delete Business?</p>
                                <p className="text-xs text-slate-500 mt-0.5">{deleteTarget.name}</p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-600 bg-red-50 rounded-lg p-3 border border-red-100 mb-5">
                            Soft-deletes the business and expires all listings. This cannot be undone automatically.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-all">
                                Cancel
                            </button>
                            <button onClick={() => handleDelete(deleteTarget.id)} className="px-4 py-2 rounded-xl bg-red-600 text-white font-semibold text-sm hover:bg-red-700 shadow-lg shadow-red-200 transition-all flex items-center gap-2">
                                <Trash2 size={16} /> Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminPageShell>
    );
}
