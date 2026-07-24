"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ColumnDef } from "@/components/ui/DataTable";
import { Plan } from "@esparex/contracts";
import {
    CreditCard,
    Search,
    CheckCircle2,
    XCircle,
    Package,
    Users,
    Activity,
    Pencil,
    AlertTriangle,
    Loader2,
    ShieldCheck,
    Award
} from "lucide-react";
import { PlanFormModal } from "@/components/plans/PlanFormModal";
import { FinancePageTemplate } from "@/components/finance/FinancePageTemplate";
import { CatalogModal } from "@/components/catalog/CatalogModal";
import {
    buildUrlWithSearchParams,
    normalizeSearchParamValue,
    updateSearchParams,
} from "@/lib/urlSearchParams";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";

export default function BusinessPlansPage() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const {
        plans,
        loading,
        error,
        isMutating,
        fetchPlans,
        handleToggleStatus
    } = useSubscriptionPlans();

    const [showModal, setShowModal] = useState(false);
    const [editPlan, setEditPlan] = useState<Plan | null>(null);
    const [togglingPlanId, setTogglingPlanId] = useState<string | null>(null);

    const rawSearch = searchParams.get("q") ?? searchParams.get("search");
    const search = normalizeSearchParamValue(rawSearch);

    useEffect(() => {
        const timer = setTimeout(() => {
            void fetchPlans({ q: search, userType: "business" });
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchPlans, search]);

    useEffect(() => {
        const nextUrl = buildUrlWithSearchParams(
            pathname,
            updateSearchParams(searchParams, {
                search: null,
                q: search,
            })
        );
        const currentUrl = buildUrlWithSearchParams(pathname, new URLSearchParams(searchParams.toString()));
        if (nextUrl !== currentUrl) {
            router.replace(nextUrl, { scroll: false });
        }
    }, [pathname, router, search, searchParams]);

    const onToggleClick = async (plan: Plan) => {
        if (plan.active) {
            setTogglingPlanId(plan.id);
        } else {
            await handleToggleStatus(plan.id);
        }
    };

    const confirmToggleStatus = async () => {
        if (!togglingPlanId) return;
        const result = await handleToggleStatus(togglingPlanId);
        if (result.success) {
            setTogglingPlanId(null);
        }
    };

    const columns: ColumnDef<Plan>[] = [
        {
            header: "Plan Name & Code",
            cell: (plan) => (
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600 border border-blue-100">
                        <Award size={20} />
                    </div>
                    <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                            {plan.name}
                            {plan.isDefault && (
                                <span className="text-[9px] bg-blue-100 text-blue-700 font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider">
                                    Default Business Plan
                                </span>
                            )}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 w-fit mt-1">
                            {plan.code}
                        </div>
                    </div>
                </div>
            )
        },
        {
            header: "Pricing & Duration",
            cell: (plan) => (
                <div className="flex flex-col">
                    <span className="font-bold text-sm text-slate-700">
                        {plan.price === 0 ? "Free / Included" : `${plan.currency} ${plan.price}`}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                        {plan.durationDays ? `${plan.durationDays} Days / Year` : "365 Days"}
                    </span>
                </div>
            )
        },
        {
            header: "Trust & Priority",
            cell: (plan) => (
                <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <Activity size={12} className="text-sky-500" /> Priority: {plan.features?.priorityWeight ?? 1}/10
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest flex items-center gap-1">
                        <ShieldCheck size={10} className={plan.features?.businessBadge ? "text-emerald-500" : "text-slate-300"} />
                        Badge: {plan.features?.businessBadge ? "Enabled" : "Disabled"}
                    </span>
                </div>
            )
        },
        {
            header: "Posting Quotas",
            cell: (plan) => (
                <div className="text-xs text-slate-600 flex flex-col gap-1">
                    <div>Ads: <span className="font-medium text-slate-900">{plan.limits?.maxAds ?? "Configurable"}</span></div>
                    <div>Services: <span className="font-medium text-slate-900">{plan.limits?.maxServices ?? "Configurable"}</span></div>
                    <div>Spare Parts: <span className="font-medium text-slate-900">{plan.limits?.maxParts ?? "Configurable"}</span></div>
                </div>
            )
        },
        {
            header: "Status",
            cell: (plan) => (
                <button
                    type="button"
                    onClick={() => onToggleClick(plan)}
                    disabled={isMutating}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                        plan.active
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                            : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
                    }`}
                >
                    {plan.active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                    {plan.active ? "Active" : "Inactive"}
                </button>
            )
        },
        {
            header: "Actions",
            cell: (plan) => (
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            setEditPlan(plan);
                            setShowModal(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-sky-600 rounded-lg hover:bg-sky-50 transition-colors"
                        title="Edit Plan"
                        aria-label={`Edit ${plan.name}`}
                    >
                        <Pencil size={15} />
                    </button>
                </div>
            )
        }
    ];

    const businessPlans = plans.filter((p) => p.userType === "business");

    return (
        <FinancePageTemplate title="Business Plans" activeTab="business-plans">
            <div className="space-y-6">
                {/* Header controls */}
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search business plans..."
                            value={search}
                            onChange={(e) => {
                                const nextSearch = e.target.value;
                                const nextUrl = buildUrlWithSearchParams(
                                    pathname,
                                    updateSearchParams(searchParams, {
                                        search: null,
                                        q: nextSearch || null,
                                    })
                                );
                                const currentUrl = buildUrlWithSearchParams(pathname, new URLSearchParams(searchParams.toString()));
                                if (nextUrl !== currentUrl) {
                                    router.replace(nextUrl, { scroll: false });
                                }
                            }}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:bg-white transition-all"
                            aria-label="Search business plans"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={() => {
                            setEditPlan(null);
                            setShowModal(true);
                        }}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm rounded-lg shadow-sm transition-colors"
                    >
                        <CreditCard size={16} />
                        Create Business Plan
                    </button>
                </div>

                {/* Main Content Area */}
                {loading && businessPlans.length === 0 ? (
                    <div className="bg-white rounded-xl border border-slate-200 p-12 flex flex-col items-center justify-center text-slate-400">
                        <Loader2 className="animate-spin mb-3 text-sky-600" size={32} />
                        <p className="text-sm font-medium text-slate-600">Loading business plans...</p>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-700">
                        <AlertTriangle className="mx-auto mb-2 text-red-500" size={28} />
                        <p className="font-semibold text-sm">{error}</p>
                        <button
                            type="button"
                            onClick={() => fetchPlans({ q: search, userType: "business" })}
                            className="mt-3 text-xs bg-white border border-red-300 px-3 py-1.5 rounded-md font-medium hover:bg-red-50"
                        >
                            Retry
                        </button>
                    </div>
                ) : businessPlans.length === 0 ? (
                    <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
                        <Package className="mx-auto mb-3 text-slate-300" size={40} />
                        <h3 className="text-base font-semibold text-slate-800">No Business Plans Found</h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                            Create your first business plan (e.g. Business Base or Pro Plan) to manage commercial membership entitlements.
                        </p>
                        <button
                            type="button"
                            onClick={() => {
                                setEditPlan(null);
                                setShowModal(true);
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg shadow-sm"
                        >
                            <CreditCard size={14} />
                            Create Business Plan
                        </button>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        {columns.map((col, idx) => (
                                            <th key={idx} className="px-6 py-4">{col.header}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-slate-700">
                                    {businessPlans.map((plan) => (
                                        <tr key={plan.id} className="hover:bg-slate-50/80 transition-colors">
                                            {columns.map((col, idx) => (
                                                <td key={idx} className="px-6 py-4">{col.cell(plan)}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Form Modal */}
                <PlanFormModal
                    open={showModal}
                    onClose={() => {
                        setShowModal(false);
                        setEditPlan(null);
                    }}
                    onSaved={() => {
                        setShowModal(false);
                        setEditPlan(null);
                        void fetchPlans({ q: search, userType: "business" });
                    }}
                    editPlan={editPlan}
                />

                {/* Status Toggle Confirmation Modal */}
                {togglingPlanId && (
                    <CatalogModal
                        title="Deactivate Business Plan"
                        confirmLabel="Deactivate Plan"
                        confirmVariant="danger"
                        onClose={() => setTogglingPlanId(null)}
                        onConfirm={confirmToggleStatus}
                    >
                        <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-lg text-amber-800 border border-amber-200 text-xs">
                                <AlertTriangle className="shrink-0 text-amber-600" size={18} />
                                <span>
                                    Deactivating this plan will hide it from new purchase/assignment options. Existing active business users on this plan will retain their current term.
                                </span>
                            </div>
                            <p className="text-xs text-slate-600">
                                Are you sure you want to deactivate this business plan?
                            </p>
                        </div>
                    </CatalogModal>
                )}
            </div>
        </FinancePageTemplate>
    );
}
