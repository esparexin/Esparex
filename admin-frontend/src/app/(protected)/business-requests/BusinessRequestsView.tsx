"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
    Building2,
    CheckCircle2,
    XCircle,
    FileCheck,
    ShieldAlert,
    ShieldCheck,
    ShieldOff,
} from "lucide-react";
import { format } from "date-fns";
import { ColumnDef } from "@/components/ui/DataTable";
import { adminFetch } from "@/lib/api/adminClient";
import { ADMIN_ROUTES } from "@/lib/api/routes";
import { useToast } from "@/context/ToastContext";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { useAdminBusinessList } from "@/hooks/useAdminBusinessList";
import type { Business } from "@/types/business";
import { adminBusinessApprovalSchema } from "@/schemas/admin.schemas";
import {
    buildUrlWithSearchParams,
    normalizeSearchParamValue,
    parsePositiveIntParam,
    updateSearchParams,
} from "@/lib/urlSearchParams";
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

const DEFAULT_STATUS = "pending";
const BUSINESS_REQUEST_STATUSES = new Set(["pending", "live", "rejected", "all"]);

const mapOverview = (data: Record<string, unknown>) => ({
    total: Number(data.total || 0),
    pending: Number(data.pending || 0),
    live: Number(data.live || data.approved || 0),
    rejected: Number(data.rejected || 0),
});

export default function BusinessRequestsView() {
    const { showToast } = useToast();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [approveTarget, setApproveTarget] = useState<Business | null>(null);
    const rawStatus = searchParams.get("status");
    const rawSearch = searchParams.get("search");
    const rawPage = searchParams.get("page");

    const activeTab =
        rawStatus && BUSINESS_REQUEST_STATUSES.has(rawStatus)
            ? rawStatus
            : DEFAULT_STATUS;
    const search = normalizeSearchParamValue(rawSearch);
    const page = parsePositiveIntParam(rawPage, 1);

    const replaceQueryState = (updates: Record<string, string | number | null | undefined>) => {
        const nextUrl = buildUrlWithSearchParams(pathname, updateSearchParams(searchParams, updates));
        const currentUrl = buildUrlWithSearchParams(pathname, new URLSearchParams(searchParams.toString()));
        if (nextUrl !== currentUrl) {
            router.replace(nextUrl, { scroll: false });
        }
    };

    const businessList = useAdminBusinessList({
        activeTab,
        search,
        page,
        initialOverview: { total: 0, pending: 0, live: 0, rejected: 0 },
        mapOverview,
        rejectValidationMessage: (reason) => {
            const validation = adminBusinessApprovalSchema.safeParse({
                status: "REJECTED",
                reason,
            });

            return validation.success
                ? null
                : validation.error.issues[0]?.message || "Invalid rejection reason";
        },
    });
    const { businesses, loading, error, setError, pagination, overview } = businessList;

    useEffect(() => {
        const nextUrl = buildUrlWithSearchParams(
            pathname,
            updateSearchParams(searchParams, {
                status: activeTab,
                search,
                page: page > 1 ? page : null,
            })
        );
        const currentUrl = buildUrlWithSearchParams(pathname, new URLSearchParams(searchParams.toString()));

        if (nextUrl !== currentUrl) {
            router.replace(nextUrl, { scroll: false });
        }
    }, [activeTab, page, pathname, rawStatus, router, search, searchParams]);

    useEffect(() => {
        if (!loading && page > pagination.pages) {
            replaceQueryState({ page: pagination.pages > 1 ? pagination.pages : null });
        }
    }, [loading, page, pagination.pages]);

    const handleApprove = async (id: string) => {
        try {
            await adminFetch(ADMIN_ROUTES.BUSINESS_APPROVE(id), { method: "PATCH" });
            showToast("Business approved successfully", "success");
            setApproveTarget(null);
            businessList.setSelectedBusiness(null);
            await businessList.fetchBusinesses();
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to approve business", "error");
        }
    };

    const RiskBadge = ({ score }: { score?: number }) => {
        const nextScore = score ?? 0;

        if (nextScore >= 70) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                    <ShieldCheck size={10} /> Low
                </span>
            );
        }

        if (nextScore >= 40) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold border border-amber-200">
                    <ShieldAlert size={10} /> Med
                </span>
            );
        }

        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold border border-red-200">
                <ShieldOff size={10} /> High
            </span>
        );
    };

    const DocsStatus = ({ biz }: { biz: Business }) => {
        const hasId = (biz.documents ?? []).some((document) => document.type === "id_proof");
        const hasBusinessProof = (biz.documents ?? []).some((document) => document.type === "business_proof");
        const count = [hasId, hasBusinessProof].filter(Boolean).length;

        return (
            <div className="flex items-center gap-1.5">
                <FileCheck
                    size={13}
                    className={
                        count === 2 ? "text-emerald-500" : count === 1 ? "text-amber-500" : "text-red-400"
                    }
                />
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
            ),
        },
        {
            header: "Owner / Mobile",
            cell: (biz) => (
                <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-slate-700">{biz.mobile}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                        {typeof biz.userId === "string" ? biz.userId.slice(-8) : ""}
                    </div>
                </div>
            ),
        },
        {
            header: "Category",
            cell: (biz) => <BusinessTypesCell businessTypes={biz.businessTypes} />,
        },
        {
            header: "City",
            cell: (biz) => <div className="text-xs text-slate-600">{biz.location?.city || "—"}</div>,
        },
        {
            header: "Risk",
            cell: (biz) => <RiskBadge score={biz.trustScore} />,
        },
        {
            header: "Docs",
            cell: (biz) => <DocsStatus biz={biz} />,
        },
        {
            header: "Submitted",
            cell: (biz) => <div className="text-xs text-slate-500">{format(new Date(biz.createdAt), "MMM d, yyyy")}</div>,
        },
        createBusinessStatusColumn(),
        createBusinessActionsColumn({
            onView: businessList.setSelectedBusiness,
            onEdit: businessList.setModifyTarget,
            onDelete: businessList.setDeleteTarget,
            editTitle: "Modify Request",
            deleteTitle: "Delete",
            renderExtraActions: (biz) =>
                biz.status === "pending" ? (
                    <>
                        <BusinessActionButton
                            onClick={() => setApproveTarget(biz)}
                            title="Approve"
                            tone="success"
                            icon={<CheckCircle2 size={15} />}
                        />
                        <BusinessActionButton
                            onClick={() => businessList.setRejectTarget(biz)}
                            title="Reject"
                            tone="danger"
                            icon={<XCircle size={15} />}
                        />
                    </>
                ) : undefined,
        }),
    ];

    return (
        <AdminPageShell
            title="Business Requests"
            description="Review and action pending business registration requests"
            headerVariant="compact"
        >
            <div className="space-y-6">
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

                <AdminModuleTabs
                    tabs={[
                        {
                            label: "Pending",
                            href: buildUrlWithSearchParams(
                                pathname,
                                updateSearchParams(searchParams, { status: "pending", page: null })
                            ),
                            count: overview.pending,
                        },
                        {
                            label: "Live",
                            href: buildUrlWithSearchParams(
                                pathname,
                                updateSearchParams(searchParams, { status: "live", page: null })
                            ),
                            count: overview.live,
                        },
                        {
                            label: "Rejected",
                            href: buildUrlWithSearchParams(
                                pathname,
                                updateSearchParams(searchParams, { status: "rejected", page: null })
                            ),
                            count: overview.rejected,
                        },
                        {
                            label: "All",
                            href: buildUrlWithSearchParams(
                                pathname,
                                updateSearchParams(searchParams, { status: "all", page: null })
                            ),
                        },
                    ]}
                />

                <BusinessSearchToolbar
                    search={search}
                    onSearchChange={(value) => replaceQueryState({ search: value, page: null })}
                    placeholder="Search by name, email or mobile..."
                    summary={<>{pagination.total} total</>}
                />

                <BusinessListTable
                    data={businesses}
                    columns={columns}
                    isLoading={loading}
                    page={page}
                    setPage={(nextPage) => replaceQueryState({ page: nextPage > 1 ? nextPage : null })}
                    pagination={pagination}
                    onRowClick={(biz) => businessList.setSelectedBusiness(biz)}
                    emptyMessage={error || "No business requests found."}
                />
            </div>

            <BusinessListModals
                controller={buildBusinessModalController(businesses, businessList)}
                onApproveFromDetails={(business) => setApproveTarget(business)}
                deleteDescription={
                    <>
                        This performs a <strong>soft-delete</strong> and expires all associated listings. The owner will
                        be notified.
                    </>
                }
                extraDialogs={
                    approveTarget && (
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
                                    Approving will set status to <strong>Live</strong> and notify the owner. They will be
                                    able to post services and ads immediately.
                                </p>
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => setApproveTarget(null)}
                                        className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => handleApprove(approveTarget.id)}
                                        className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all flex items-center gap-2"
                                    >
                                        <CheckCircle2 size={16} /> Approve
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }
            />
        </AdminPageShell>
    );
}
