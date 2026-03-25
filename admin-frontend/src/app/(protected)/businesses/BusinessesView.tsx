"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import {
    Building2,
    MapPin,
    Ban,
    RotateCcw,
    ChartBar,
} from "lucide-react";
import { format } from "date-fns";
import { ColumnDef } from "@/components/ui/DataTable";
import { adminFetch } from "@/lib/api/adminClient";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import { useToast } from "@/context/ToastContext";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { BusinessSuspendModal } from "@/components/business/BusinessSuspendModal";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { useAdminBusinessesMasterList } from "@/hooks/useAdminBusinessPageControllers";
import type { Business } from "@/types/business";
import {
    BusinessActionButton,
    buildBusinessModalController,
    createBusinessActionsColumn,
    createBusinessStatusColumn,
    BusinessListModals,
    BusinessListTable,
    BusinessSearchToolbar,
    BusinessTypesCell,
} from "@/components/business/BusinessListPrimitives";

export default function BusinessesView() {
    const { showToast } = useToast();
    const searchParams = useSearchParams();

    const [cityFilter, setCityFilter] = useState("");
    const [suspendTarget, setSuspendTarget] = useState<Business | null>(null);
    const activeTab = searchParams.get("status") || "live";

    const businessList = useAdminBusinessesMasterList(activeTab, cityFilter);
    const { businesses, loading, error, search, setSearch, page, setPage, pagination, overview } = businessList;

    const handleSuspend = async (id: string, reason: string) => {
        try {
            await adminFetch(ADMIN_ROUTES.BUSINESS_STATUS(id), {
                method: "PATCH",
                body: { status: "suspended", reason },
            });
            showToast("Business suspended", "success");
            setSuspendTarget(null);
            businessList.setSelectedBusiness(null);
            await businessList.fetchBusinesses();
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to suspend business";
            showToast(message, "error");
            throw err instanceof Error ? err : new Error(message);
        }
    };

    const handleActivate = async (id: string) => {
        try {
            await adminFetch(ADMIN_ROUTES.BUSINESS_APPROVE(id), { method: "PATCH" });
            showToast("Business reactivated successfully", "success");
            businessList.setSelectedBusiness(null);
            await businessList.fetchBusinesses();
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to activate business", "error");
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
            ),
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
            },
        },
        {
            header: "Category",
            cell: (biz) => <BusinessTypesCell businessTypes={biz.businessTypes} />,
        },
        {
            header: "Location",
            cell: (biz) => (
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <MapPin size={12} className="text-slate-400 shrink-0" />
                    <span className="truncate max-w-[110px]">{biz.location?.city || "—"}</span>
                </div>
            ),
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
            ),
        },
        createBusinessStatusColumn(true),
        createBusinessActionsColumn({
            onView: businessList.setSelectedBusiness,
            onEdit: businessList.setModifyTarget,
            onDelete: businessList.setDeleteTarget,
            editTitle: "Edit Business",
            deleteTitle: "Delete Business",
            renderExtraActions: (biz) =>
                biz.status === "live" ? (
                    <BusinessActionButton
                        onClick={() => setSuspendTarget(biz)}
                        title="Suspend Business"
                        tone="warning"
                        icon={<Ban size={15} />}
                    />
                ) : biz.status === "suspended" ? (
                    <BusinessActionButton
                        onClick={() => void handleActivate(biz.id)}
                        title="Reactivate Business"
                        tone="success"
                        icon={<RotateCcw size={15} />}
                    />
                ) : undefined,
        }),
    ];

    return (
        <AdminPageShell
            title="Business Master"
            description="Central directory of all verified and registered business accounts"
            headerVariant="compact"
        >
            <div className="space-y-6">
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

                <AdminModuleTabs
                    tabs={[
                        { label: "Live", href: "/businesses?status=live", count: overview.live },
                        { label: "Suspended", href: "/businesses?status=suspended", count: overview.suspended },
                        { label: "Pending", href: "/businesses?status=pending", count: overview.pending },
                        { label: "Deleted", href: "/businesses?status=deleted" },
                        { label: "All", href: "/businesses?status=all" },
                    ]}
                />

                <BusinessSearchToolbar
                    search={search}
                    onSearchChange={setSearch}
                    placeholder="Search by name, mobile, email..."
                    summary={<>{pagination.total} results</>}
                    wrap
                    searchClassName="relative flex-1 min-w-[200px] max-w-sm"
                    extraFilters={
                        <input
                            type="text"
                            placeholder="Filter by city..."
                            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all w-36"
                            value={cityFilter}
                            onChange={(event) => setCityFilter(event.target.value)}
                        />
                    }
                />

                <BusinessListTable
                    data={businesses}
                    columns={columns}
                    isLoading={loading}
                    page={page}
                    setPage={setPage}
                    pagination={pagination}
                    onRowClick={(biz) => businessList.setSelectedBusiness(biz)}
                    emptyMessage={error || "No businesses found."}
                />
            </div>

            <BusinessListModals
                controller={buildBusinessModalController(businesses, businessList)}
                onApproveFromDetails={(business) => void handleActivate(business.id)}
                onSuspendFromDetails={(business) => setSuspendTarget(business)}
                onActivateFromDetails={(id) => void handleActivate(id)}
                deleteDescription={
                    <>
                        Soft-deletes the business and expires all listings. This cannot be undone automatically.
                    </>
                }
                extraDialogs={
                    suspendTarget && (
                        <BusinessSuspendModal
                            businessName={suspendTarget.name}
                            onClose={() => setSuspendTarget(null)}
                            onConfirm={(reason) => handleSuspend(suspendTarget.id, reason)}
                        />
                    )
                }
            />
        </AdminPageShell>
    );
}
