"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Plan } from "@esparex/contracts";
import {
    CreditCard,
    Filter,
    CheckCircle2,
    XCircle,
    Package,
    Users,
    Activity,
    Pencil,
    Archive,
    RotateCcw,
    ShieldCheck,
    DataTable,
    AlertCircle,
    type ColumnDef,
} from "@esparex/ui";
import { PlanFormModal } from "@/components/plans/PlanFormModal";
import { ArchivePlanModal } from "@/components/plans/ArchivePlanModal";
import { AdminPageShell } from "@/components/layout/AdminPageShell";
import { AdminModuleTabs } from "@/components/layout/AdminModuleTabs";
import { AdminFilterToolbar } from "@/components/layout/AdminFilterToolbar";
import { financeTabs } from "@/components/layout/adminModuleTabSets";
import { ConfirmDeactivateDialog } from "@/components/finance/ConfirmDeactivateDialog";
import {
    buildUrlWithSearchParams,
    normalizeSearchParamValue,
    updateSearchParams,
} from "@/lib/urlSearchParams";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";

const PLAN_TYPES = new Set(["all", "FREE_DEFAULT", "AD_PACK", "BOOST_AD", "SPOTLIGHT", "SMART_ALERT"]);

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
        handleToggleStatus,
        handleArchive,
        handleRestore,
    } = useSubscriptionPlans();

    const [showModal, setShowModal] = useState(false);
    const [editPlan, setEditPlan] = useState<Plan | null>(null);
    const [togglingPlanId, setTogglingPlanId] = useState<string | null>(null);
    const [archivingPlan, setArchivingPlan] = useState<Plan | null>(null);

    const rawSearch = searchParams.get("q") ?? searchParams.get("search");
    const rawType = searchParams.get("type");
    const search = normalizeSearchParamValue(rawSearch);
    const typeFilter = rawType && PLAN_TYPES.has(rawType) ? rawType : "all";

    const replaceQueryState = (updates: Record<string, string | null | undefined>) => {
        const nextUrl = buildUrlWithSearchParams(pathname, updateSearchParams(searchParams, { search: null, ...updates }));
        const currentUrl = buildUrlWithSearchParams(pathname, new URLSearchParams(searchParams.toString()));
        if (nextUrl !== currentUrl) {
            router.replace(nextUrl, { scroll: false });
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            void fetchPlans({ q: search, type: typeFilter });
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchPlans, search, typeFilter]);

    useEffect(() => {
        const nextUrl = buildUrlWithSearchParams(
            pathname,
            updateSearchParams(searchParams, {
                search: null,
                q: search,
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
                        <div className="font-bold text-foreground flex items-center gap-2">
                            {plan.name}
                            {plan.isDefault && (
                                <span className="text-tiny bg-slate-100 text-foreground-secondary px-1.5 py-0.5 rounded uppercase tracking-wider">Default</span>
                            )}
                        </div>
                        <div className="text-tiny font-mono text-foreground-tertiary bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 w-fit mt-1">
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
                    <span className="font-bold text-sm text-foreground-secondary">
                        {plan.price === 0 ? "Free" : `${plan.currency} ${plan.price}`}
                    </span>
                    <span className="text-tiny text-foreground-subtle font-medium">
                        {plan.durationDays ? `${plan.durationDays} Days` : "Lifetime"}
                    </span>
                </div>
            )
        },
        {
            header: "Type & Audience",
            cell: (plan) => (
                <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-foreground-secondary flex items-center gap-1">
                        <Activity size={12} className="text-foreground-subtle" /> {plan.type.replace("_", " ")}
                    </span>
                    <span className="text-tiny text-foreground-tertiary uppercase tracking-widest flex items-center gap-1">
                        <Users size={10} /> {plan.userType}
                    </span>
                </div>
            )
        },
        {
            header: "Key Limits",
            cell: (plan) => (
                <div className="text-xs text-foreground-secondary flex flex-col gap-1">
                    {plan.type === "FREE_DEFAULT" && (
                        <div>Free Slots: <strong className="font-semibold text-emerald-700">{plan.limits?.maxAds ?? 2}/month</strong></div>
                    )}
                    {plan.type === "AD_PACK" && (
                        <div>Ad Slots: <strong className="font-semibold text-amber-700">{plan.limits?.maxAds ?? 1} Slots</strong></div>
                    )}
                    {plan.type === "BOOST_AD" && (
                        <div>Boost Priority: <strong className="font-semibold text-amber-600">{plan.features?.priorityWeight ?? 2}x Weight</strong></div>
                    )}
                    {plan.type === "SPOTLIGHT" && (
                        <div>Spotlight: <strong className="font-semibold text-purple-600">{plan.limits?.spotlightCredits ?? 1} Credits</strong></div>
                    )}
                    {plan.type === "SMART_ALERT" && (
                        <div>Alert Slots: <strong className="font-semibold text-sky-600">{plan.limits?.smartAlerts ?? 1} Slots</strong></div>
                    )}
                </div>
            )
        },
        {
            header: "Status",
            cell: (plan) => {
                const status = plan.status ?? (plan.active ? "ACTIVE" : "INACTIVE");
                type CfgEntry = { dot: string; label: string; text: string };
                const fallback: CfgEntry = { dot: "bg-slate-400", label: "Inactive", text: "text-slate-600" };
                const statusConfig: Partial<Record<string, CfgEntry>> = {
                    ACTIVE: { dot: "bg-emerald-500", label: "Active", text: "text-emerald-700" },
                    INACTIVE: fallback,
                    DRAFT: { dot: "bg-sky-400", label: "Draft", text: "text-sky-700" },
                    ARCHIVED: { dot: "bg-amber-500", label: "Archived", text: "text-amber-700" },
                };
                const cfg: CfgEntry = statusConfig[status] ?? fallback;
                return (
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                        <span className={`capitalize text-xs font-medium ${cfg.text}`}>
                            {cfg.label}
                        </span>
                        {plan.isSystemPlan && (
                            <ShieldCheck size={12} className="text-sky-500" aria-label="System protected plan" />
                        )}
                    </div>
                );
            }
        },
        {
            header: "Actions",
            cell: (plan) => {
                const status = plan.status ?? (plan.active ? "ACTIVE" : "INACTIVE");
                const isActive = status === "ACTIVE";
                const isArchived = status === "ARCHIVED";
                const isProtectedPlan = Boolean((plan.isDefault && isActive) || plan.isSystemPlan);
                return (
                    <div className="flex items-center gap-1 flex-wrap">
                        {/* Edit — always available unless archived */}
                        {!isArchived && (
                            <button
                                onClick={() => { setEditPlan(plan); setShowModal(true); }}
                                className="p-1.5 rounded text-foreground-tertiary hover:bg-slate-100 transition-colors flex items-center gap-1 text-xs font-medium"
                                aria-label={`Edit plan ${plan.name}`}
                            >
                                <Pencil size={13} aria-hidden="true" /> Edit
                            </button>
                        )}
                        {/* Toggle active/inactive — only for non-protected, non-archived plans */}
                        {!isArchived && !isProtectedPlan && (
                            <button
                                onClick={() => void onToggleClick(plan)}
                                disabled={isMutating}
                                aria-label={isActive ? `Disable plan ${plan.name}` : `Enable plan ${plan.name}`}
                                className={`p-1.5 rounded transition-colors flex items-center gap-1 text-xs font-medium ${
                                    isActive
                                        ? "text-red-600 hover:bg-red-50"
                                        : "text-emerald-600 hover:bg-emerald-50"
                                }`}
                            >
                                {isActive ? <><XCircle size={14} aria-hidden="true" /> Disable</> : <><CheckCircle2 size={14} aria-hidden="true" /> Enable</>}
                            </button>
                        )}
                        {/* Archive — only INACTIVE non-protected plans */}
                        {!isArchived && !isProtectedPlan && !isActive && (
                            <button
                                onClick={() => setArchivingPlan(plan)}
                                disabled={isMutating}
                                aria-label={`Archive plan ${plan.name}`}
                                className="p-1.5 rounded text-amber-600 hover:bg-amber-50 transition-colors flex items-center gap-1 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Archive size={13} aria-hidden="true" /> Archive
                            </button>
                        )}
                        {/* Restore — only ARCHIVED plans */}
                        {isArchived && (
                            <button
                                onClick={() => void handleRestore(plan.id)}
                                disabled={isMutating}
                                aria-label={`Restore plan ${plan.name}`}
                                className="p-1.5 rounded text-sky-600 hover:bg-sky-50 transition-colors flex items-center gap-1 text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <RotateCcw size={13} aria-hidden="true" /> Restore
                            </button>
                        )}
                        {/* Protected Default Plan lock badge */}
                        {isProtectedPlan && !isArchived && (
                            <span
                                className="text-xs text-sky-700 bg-sky-50 border border-sky-200 font-semibold flex items-center gap-1 px-2 py-1 rounded-md"
                                title="Active Default Free Plan is mandatory and protected — cannot be disabled or archived."
                                aria-label="Active Default Free Plan protected"
                            >
                                <ShieldCheck size={13} className="text-sky-600" aria-hidden="true" /> Protected
                            </span>
                        )}
                    </div>
                );
            }
        }
    ];

    return (
        <>
            <AdminPageShell
                title="Plans & Packages"
                description="Manage subscription plans, ad packs, and spotlight credits."
                tabs={<AdminModuleTabs tabs={financeTabs} />}
                actions={
                    <button
                        onClick={() => { setEditPlan(null); setShowModal(true); }}
                        className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-lg shadow-sky-600/20 active:scale-95"
                    >
                        <CreditCard size={18} /> New Plan
                    </button>
                }
            >
                <div className="flex flex-col gap-6">
                    <AdminFilterToolbar
                        search={search}
                        onSearchChange={(value) => replaceQueryState({ q: value })}
                        searchPlaceholder="Search plans by name or code..."
                        extraFilters={
                            <div className="flex items-center gap-1.5">
                                <Filter className="shrink-0 text-foreground-subtle" size={14} aria-hidden="true" />
                                <select
                                    aria-label="Filter by plan type"
                                    className="rounded-lg border border-input bg-background py-1.5 pl-2.5 pr-7 text-sm font-medium text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                                    value={typeFilter}
                                    onChange={(e) => replaceQueryState({ type: e.target.value === "all" ? null : e.target.value })}
                                >
                                    <option value="all">Every Type</option>
                                    <option value="FREE_DEFAULT">Free Plan (Default)</option>
                                    <option value="AD_PACK">Ad Packs</option>
                                    <option value="BOOST_AD">Boost Ad</option>
                                    <option value="SPOTLIGHT">Spotlight</option>
                                    <option value="SMART_ALERT">Smart Alerts</option>
                                </select>
                            </div>
                        }
                    />

                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 rounded-lg p-4 text-sm font-medium flex items-center gap-2">
                            <AlertCircle size={18} /> {error}
                        </div>
                    )}

                    <div className="min-h-0 flex-1">
                        <DataTable
                            data={plans}
                            columns={columns}
                            isLoading={loading}
                            emptyMessage="No plans found matching your criteria"
                            enableCsvExport
                            csvFileName="plans.csv"
                            enableColumnVisibility
                        />
                    </div>

                    <PlanFormModal
                        open={showModal}
                        onClose={() => { setShowModal(false); setEditPlan(null); }}
                        onSaved={() => { void fetchPlans({ q: search, type: typeFilter }); }}
                        editPlan={editPlan}
                    />
                </div>
            </AdminPageShell>

            <ConfirmDeactivateDialog
                isOpen={!!togglingPlanId}
                onClose={() => setTogglingPlanId(null)}
                onConfirm={confirmToggleStatus}
                isMutating={isMutating}
                title="Deactivate Plan"
                description="Disabling this plan will prevent new users from purchasing or subscribing to it."
            />

            <ArchivePlanModal
                plan={archivingPlan}
                isOpen={!!archivingPlan}
                onClose={() => setArchivingPlan(null)}
                onConfirm={handleArchive}
                isMutating={isMutating}
            />
        </>
    );
}
