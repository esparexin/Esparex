"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { 
    Building2, 
    Search, 
    Eye, 
    CheckCircle2, 
    XCircle, 
    Pencil,
    Trash2,
    FileCheck,
    ShieldAlert,
    ShieldCheck,
    ShieldOff
} from "lucide-react";
import { format } from "date-fns";
import { DataTable, ColumnDef } from "@/components/ui/DataTable";
import { adminFetch } from "@/lib/api/adminClient";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import { parseAdminResponse } from "@/lib/api/parseAdminResponse";
import { useToast } from "@/context/ToastContext";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { BusinessDetailsModal } from "@/components/business/BusinessDetailsModal";
import { BusinessRejectModal } from "@/components/business/BusinessRejectModal";
import { BusinessModifyModal } from "@/components/business/BusinessModifyModal";
import { Business } from "@/types/business";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { adminBusinessApprovalSchema } from "@/schemas/admin.schemas";

export default function BusinessRequestsView() {
    const { showToast } = useToast();
    const searchParams = useSearchParams();
    
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({ total: 0, pages: 1, limit: 20 });
    const [overview, setOverview] = useState({ total: 0, pending: 0, live: 0, rejected: 0 });

    const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
    const [rejectTarget, setRejectTarget] = useState<Business | null>(null);
    const [modifyTarget, setModifyTarget] = useState<Business | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Business | null>(null);
    const [approveTarget, setApproveTarget] = useState<Business | null>(null);

    const activeTab = searchParams.get("status") || "pending";

    const fetchBusinesses = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                search,
                status: activeTab,
                page: String(page),
                limit: "20"
            });
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
                rejected: Number(od.rejected || 0)
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
    }, [search, activeTab, page]);

    const handleApprove = async (id: string) => {
        try {
            await adminFetch(ADMIN_ROUTES.BUSINESS_APPROVE(id), { method: "PATCH" });
            showToast("Business approved successfully", "success");
            setApproveTarget(null);
            setSelectedBusiness(null);
            void fetchBusinesses();
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to approve business", "error");
        }
    };

    const handleReject = async (id: string, reason: string) => {
        // Pre-submit validation guard
        const validation = adminBusinessApprovalSchema.safeParse({
            status: 'REJECTED',
            reason
        });

        if (!validation.success) {
            showToast(validation.error.issues[0]?.message || "Invalid rejection reason", "error");
            return;
        }

        try {
            await adminFetch(ADMIN_ROUTES.BUSINESS_REJECT(id), { method: "PATCH", body: { reason } });
            showToast("Business rejected", "success");
            setRejectTarget(null);
            setSelectedBusiness(null);
            void fetchBusinesses();
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to reject business", "error");
        }
    };

    const handleModify = async (id: string, patch: Partial<Business>) => {
        try {
            await adminFetch(ADMIN_ROUTES.BUSINESS_UPDATE(id), { method: "PUT", body: patch });
            showToast("Business updated", "success");
            setModifyTarget(null);
            setSelectedBusiness(null);
            void fetchBusinesses();
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to update business", "error");
        }
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

    // Risk badge helper
    const RiskBadge = ({ score }: { score?: number }) => {
        const s = score ?? 0;
        if (s >= 70) return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                <ShieldCheck size={10} /> Low
            </span>
        );
        if (s >= 40) return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold border border-amber-200">
                <ShieldAlert size={10} /> Med
            </span>
        );
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold border border-red-200">
                <ShieldOff size={10} /> High
            </span>
        );
    };

    // Docs status helper
    const DocsStatus = ({ biz }: { biz: Business }) => {
        const hasId = (biz.documents ?? []).some(d => d.type === "id_proof");
        const hasBiz = (biz.documents ?? []).some(d => d.type === "business_proof");
        const count = [hasId, hasBiz].filter(Boolean).length;
        return (
            <div className="flex items-center gap-1.5">
                <FileCheck size={13} className={count === 2 ? "text-emerald-500" : count === 1 ? "text-amber-500" : "text-red-400"} />
                <span className="text-[10px] font-semibold text-slate-600">{count}/2</span>
            </div>
        );
    };

    const columns: ColumnDef<Business>[] = [
        {
            header: "Business",
            cell: (biz) => (
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 shrink-0 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                        <Building2 size={18} />
                    </div>
                    <div className="min-w-0">
                        <div className="font-bold text-slate-900 text-sm truncate">{biz.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">{biz.email}</div>
                    </div>
                </div>
            )
        },
        {
            header: "Owner / Mobile",
            cell: (biz) => (
                <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-slate-700">{biz.mobile}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{typeof biz.userId === "string" ? biz.userId.slice(-8) : ""}</div>
                </div>
            )
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
            header: "City",
            cell: (biz) => (
                <div className="text-xs text-slate-600">{biz.location?.city || "—"}</div>
            )
        },
        {
            header: "Risk",
            cell: (biz) => <RiskBadge score={biz.trustScore} />
        },
        {
            header: "Docs",
            cell: (biz) => <DocsStatus biz={biz} />
        },
        {
            header: "Submitted",
            cell: (biz) => (
                <div className="text-xs text-slate-500">
                    {format(new Date(biz.createdAt), "MMM d, yyyy")}
                </div>
            )
        },
        {
            header: "Status",
            cell: (biz) => (
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    biz.status === "live" ? "bg-emerald-100 text-emerald-700 border-emerald-200" :
                    biz.status === "pending" ? "bg-amber-100 text-amber-700 border-amber-200" :
                    biz.status === "rejected" ? "bg-red-100 text-red-700 border-red-200" :
                    "bg-slate-100 text-slate-600 border-slate-200"
                }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                        biz.status === "live" ? "bg-emerald-500" :
                        biz.status === "pending" ? "bg-amber-500 animate-pulse" :
                        biz.status === "rejected" ? "bg-red-500" : "bg-slate-400"
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
                        title="Modify Request"
                    >
                        <Pencil size={15} />
                    </button>
                    {biz.status === "pending" && (
                        <>
                            <button
                                onClick={() => setApproveTarget(biz)}
                                className="p-1.5 hover:bg-emerald-50 rounded-lg text-slate-400 hover:text-emerald-600 transition-colors"
                                title="Approve"
                            >
                                <CheckCircle2 size={15} />
                            </button>
                            <button
                                onClick={() => setRejectTarget(biz)}
                                className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                                title="Reject"
                            >
                                <XCircle size={15} />
                            </button>
                        </>
                    )}
                    <button
                        onClick={() => setDeleteTarget(biz)}
                        className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                        title="Delete"
                    >
                        <Trash2 size={15} />
                    </button>
                </div>
            )
        }
    ];

    return (
        <AdminPageShell
            title="Business Requests"
            description="Review and action pending business registration requests"
            headerVariant="compact"
        >
            <div className="space-y-6">
                {/* Error Banner */}
                {error && (
                    <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-800 rounded-xl px-4 py-3 text-sm shadow-sm">
                        <XCircle className="shrink-0 mt-0.5" size={16} />
                        <div>
                            <p className="font-semibold">Failed to load data</p>
                            <p className="text-xs text-red-600 mt-0.5">{error}</p>
                        </div>
                        <button
                            onClick={() => setError("")}
                            className="ml-auto text-red-400 hover:text-red-600 transition-colors"
                            aria-label="Dismiss error"
                        >
                            <XCircle size={14} />
                        </button>
                    </div>
                )}
                {/* Status Tabs */}
                <AdminModuleTabs
                    tabs={[
                        { label: "Pending", href: "/business-requests?status=pending", count: overview.pending },
                        { label: "Live", href: "/business-requests?status=live", count: overview.live },
                        { label: "Rejected", href: "/business-requests?status=rejected", count: overview.rejected },
                        { label: "All", href: "/business-requests?status=all" }
                    ]}
                />

                {/* Search Bar */}
                <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search by name, email or mobile..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <div className="text-xs text-slate-500">
                        {pagination.total} total
                    </div>
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
                    emptyMessage={error || "No business requests found."}
                />
            </div>

            {/* View Details Modal */}
            {selectedBusiness && (
                <BusinessDetailsModal
                    business={selectedBusiness}
                    onClose={() => setSelectedBusiness(null)}
                    onApprove={(id) => setApproveTarget(businesses.find(b => b.id === id) ?? selectedBusiness)}
                    onReject={(id) => setRejectTarget(businesses.find(b => b.id === id) ?? selectedBusiness)}
                    onModify={(biz) => setModifyTarget(biz)}
                    onDelete={(id) => setDeleteTarget(businesses.find(b => b.id === id) ?? selectedBusiness)}
                />
            )}

            {/* Approve Confirmation */}
            {approveTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                <CheckCircle2 size={20} />
                            </div>
                            <div>
                                <p className="font-bold text-slate-900 text-sm">Approve Business?</p>
                                <p className="text-xs text-slate-500 mt-0.5">{approveTarget.name}</p>
                            </div>
                        </div>
                        <p className="text-xs text-slate-600 bg-slate-50 rounded-lg p-3 border border-slate-100 mb-5">
                            Approving will set status to <strong>Live</strong> and notify the owner. They will be able to post services and ads immediately.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setApproveTarget(null)} className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-all">
                                Cancel
                            </button>
                            <button onClick={() => handleApprove(approveTarget.id)} className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all flex items-center gap-2">
                                <CheckCircle2 size={16} /> Approve
                            </button>
                        </div>
                    </div>
                </div>
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
                            This performs a <strong>soft-delete</strong> and expires all associated listings. The owner will be notified.
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
        </AdminPageShell>
    );
}
