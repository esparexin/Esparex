"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ColumnDef } from "@/components/ui/DataTable";
import { Plan } from "@/types/plan";
import {
    CreditCard,
    Search,
    Filter,
    CheckCircle2,
    XCircle,
    Package,
    Users,
    Activity,
    Pencil,
    AlertTriangle,
    Loader2,
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

const PLAN_TYPES = new Set(["all", "AD_PACK", "SPOTLIGHT", "SMART_ALERT"]);

export default function PlansPage() {
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

    const rawSearch = searchParams.get("search");
    const rawType = searchParams.get("type");
    const search = normalizeSearchParamValue(rawSearch);
    const typeFilter = rawType && PLAN_TYPES.has(rawType) ? rawType : "all";

    const replaceQueryState = (updates: Record<string, string | null | undefined>) => {
        const nextUrl = buildUrlWithSearchParams(pathname, updateSearchParams(searchParams, updates));
        const currentUrl = buildUrlWithSearchParams(pathname, new URLSearchParams(searchParams.toString()));
        if (nextUrl !== currentUrl) {
            router.replace(nextUrl, { scroll: false });
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            void fetchPlans({ search, type: typeFilter });
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchPlans, search, typeFilter]);

    useEffect(() => {
        const nextUrl = buildUrlWithSearchParams(
            pathname,
            updateSearchParams(searchParams, {
                search,
                type: typeFilter === "all" ? null : typeFilter,
            })
        );
        const currentUrl = buildUrlWithSearchParams(pathname, new URLSearchParams(searchParams.toString()));
        if (nextUrl !== currentUrl) {
            router.replace(nextUrl, { scroll: false });
        }
    }, [pathname, router, search, searchParams, typeFilter]);

    const onToggleClick = async (plan: Plan) => {
        if (plan.active) {
            // If active, we need a confirmation before disabling
            setTogglingPlanId(plan.id);
        } else {
            // If inactive, we just enable it blindly
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
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${plan.type === "AD_PACK" ? "bg-blue-50 text-blue-600" :
                        plan.type === "SPOTLIGHT" ? "bg-amber-50 text-amber-600" :
                            "bg-purple-50 text-purple-600"
                        }`}>
                        <Package size={20} />
                    </div>
                    <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                            {plan.name}
                            {plan.isDefault && (
                                <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded uppercase tracking-wider">Default</span>
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
            header: "Pricing",
            cell: (plan) => (
                <div className="flex flex-col">
                    <span className="font-bold text-sm text-slate-700">
                        {plan.price === 0 ? "Free" : `${plan.currency} ${plan.price}`}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                        {plan.durationDays ? `${plan.durationDays} Days` : "Lifetime"}
                    </span>
                </div>
            )
        },
        {
            header: "Type & Audience",
            cell: (plan) => (
                <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <Activity size={12} className="text-slate-400" /> {plan.type.replace("_", " ")}
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest flex items-center gap-1">
                        <Users size={10} /> {plan.userType}
                    </span>
                </div>
            )
        },
        {
            header: "Key Limits",
            cell: (plan) => (
                <div className="text-xs text-slate-600 flex flex-col gap-1">
                    {plan.limits?.maxAds ? <div>Ads: <span className="font-medium text-slate-900">{plan.limits.maxAds}</span></div> : null}
                    {plan.type === "SPOTLIGHT" && plan.limits?.spotlightCredits ? <div>Credits: <span className="font-medium text-emerald-600">{plan.limits.spotlightCredits}</span></div> : null}
                    {plan.type === "AD_PACK" && (!plan.limits?.maxAds && !plan.limits?.spotlightCredits) ? <span className="italic text-slate-400">Standard</span> : null}
                </div>
            )
        },
        {
            header: "Status",
            cell: (plan) => (
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${plan.active ? "bg-emerald-500" : "bg-red-500"}`} />
                    <span className={`capitalize text-xs font-medium ${plan.active ? "text-emerald-700" : "text-red-700"}`}>
                        {plan.active ? "Active" : "Inactive"}
                    </span>
                </div>
            )
        },
        {
            header: "Actions",
            cell: (plan) => (
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => { setEditPlan(plan); setShowModal(true); }}
                        className="p-1.5 rounded text-slate-500 hover:bg-slate-100 transition-colors flex items-center gap-1 text-xs font-medium"
                    >
                        <Pencil size={13} /> Edit
                    </button>
                    <button
                        onClick={() => void onToggleClick(plan)}
                        disabled={isMutating}
                        className={`p-1.5 rounded transition-colors flex items-center gap-1 text-xs font-medium ${plan.active
                            ? "text-red-600 hover:bg-red-50"
                            : "text-emerald-600 hover:bg-emerald-50"
                            }`}
                    >
                        {plan.active ? <><XCircle size={14} /> Disable</> : <><CheckCircle2 size={14} /> Enable</>}
                    </button>
                </div>
            )
        }
    ];

    return (
        <>
            <FinancePageTemplate<Plan>
                title="Plans & Packages"
                description="Manage subscription plans, ad packs, and spotlight credits."
                data={plans}
                columns={columns}
                isLoading={loading}
                error={error || ""}
                emptyMessage="No plans found matching your criteria"
                csvFileName="plans.csv"
                actions={
                    <button
                        onClick={() => { setEditPlan(null); setShowModal(true); }}
                        className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-lg shadow-sky-600/20 active:scale-95"
                    >
                        <CreditCard size={18} /> New Plan
                    </button>
                }
                filters={
                    <>
                        <div className="relative flex-1 w-full text-black">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search plans by name or code..."
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-black outline-none"
                                value={search}
                                onChange={(e) => replaceQueryState({ search: e.target.value })}
                            />
                        </div>
                        <div className="flex items-center gap-2 w-full md:w-auto text-black">
                            <Filter className="text-slate-400" size={18} />
                            <select
                                className="flex-1 md:w-40 bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium text-black outline-none"
                                value={typeFilter}
                                onChange={(e) => replaceQueryState({ type: e.target.value === "all" ? null : e.target.value })}
                            >
                                <option value="all">Every Type</option>
                                <option value="AD_PACK">Ad Packs</option>
                                <option value="SPOTLIGHT">Spotlight</option>
                                <option value="SMART_ALERT">Smart Alerts</option>
                            </select>
                        </div>
                    </>
                }
            >
                <PlanFormModal
                    open={showModal}
                    onClose={() => { setShowModal(false); setEditPlan(null); }}
                    onSaved={() => { void fetchPlans({ search, type: typeFilter }); }}
                    editPlan={editPlan}
                />
            </FinancePageTemplate>

            <CatalogModal
                isOpen={!!togglingPlanId}
                onClose={() => !isMutating && setTogglingPlanId(null)}
                title="Deactivate Plan"
            >
                <div className="p-6 space-y-4">
                    <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
                        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <h3 className="text-sm font-bold text-amber-900">Are you sure?</h3>
                            <p className="mt-1 text-sm text-amber-800 leading-relaxed">
                                Disabling this plan will prevent new users from purchasing or subscribing to it. 
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
