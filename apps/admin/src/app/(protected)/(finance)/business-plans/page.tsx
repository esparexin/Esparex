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

    const replaceQueryState = (updates: Record<string, string | null | undefined>) => {
        const nextUrl = buildUrlWithSearchParams(pathname, updateSearchParams(searchParams, { search: null, ...updates }));
        const currentUrl = buildUrlWithSearchParams(pathname, new URLSearchParams(searchParams.toString()));
        if (nextUrl !== currentUrl) {
            router.replace(nextUrl, { scroll: false });
        }
    };

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
            cell: (plan: Plan) => (
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
            cell: (plan: Plan) => (
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
            cell: (plan: Plan) => (
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
            cell: (plan: Plan) => (
                <div className="text-xs text-slate-600 flex flex-col gap-1">
                    <div>Ads: <span className="font-medium text-slate-900">{plan.limits?.maxAds ?? "Configurable"}</span></div>
                    <div>Services: <span className="font-medium text-slate-900">{plan.limits?.maxServices ?? "Configurable"}</span></div>
                    <div>Spare Parts: <span className="font-medium text-slate-900">{plan.limits?.maxParts ?? "Configurable"}</span></div>
                </div>
            )
        },
        {
            header: "Status",
            cell: (plan: Plan) => (
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
            cell: (plan: Plan) => (
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
        <>
            <FinancePageTemplate<Plan>
                title="Business Plans"
                description="Manage Business Base and Business Pro membership subscription plans."
                data={businessPlans}
                columns={columns}
                isLoading={loading}
                error={error || ""}
                emptyMessage="No business plans found matching your criteria"
                csvFileName="business-plans.csv"
                actions={
                    <button
                        onClick={() => { setEditPlan(null); setShowModal(true); }}
                        className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-lg shadow-sky-600/20 active:scale-95"
                    >
                        <CreditCard size={18} /> New Business Plan
                    </button>
                }
                filters={
                    <div className="relative flex-1 w-full text-black">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search business plans by name or code..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-black outline-none"
                            value={search}
                            onChange={(e) => replaceQueryState({ q: e.target.value })}
                        />
                    </div>
                }
            >
                <PlanFormModal
                    open={showModal}
                    onClose={() => { setShowModal(false); setEditPlan(null); }}
                    onSaved={() => { void fetchPlans({ q: search, userType: "business" }); }}
                    editPlan={editPlan}
                />
            </FinancePageTemplate>

            <CatalogModal
                isOpen={!!togglingPlanId}
                onClose={() => !isMutating && setTogglingPlanId(null)}
                title="Deactivate Business Plan"
            >
                <div className="p-6 space-y-4">
                    <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
                        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <h3 className="text-sm font-bold text-amber-900">Are you sure?</h3>
                            <p className="mt-1 text-sm text-amber-800 leading-relaxed">
                                Disabling this plan will prevent new businesses from subscribing to it. 
                                <span className="block mt-2 font-semibold italic text-amber-900/60">Existing subscriptions will not be affected.</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            disabled={isMutating}
                            onClick={() => setTogglingPlanId(null)}
                            className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={isMutating}
                            onClick={confirmToggleStatus}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-bold hover:bg-amber-700 transition-all disabled:opacity-70 shadow-lg shadow-amber-200"
                        >
                            {isMutating ? (
                                <><Loader2 size={16} className="animate-spin" /> Updating...</>
                            ) : (
                                "Yes, Deactivate Plan"
                            )}
                        </button>
                    </div>
                </div>
            </CatalogModal>
        </>
    );
}
