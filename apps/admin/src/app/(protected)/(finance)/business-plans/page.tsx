"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Plan } from "@esparex/contracts";
import {
    CreditCard,
    CheckCircle2,
    XCircle,
    Activity,
    Pencil,
    ShieldCheck,
    Award,
    DataTable,
    AlertCircle,
    type ColumnDef,
} from "@esparex/ui";
import { PlanFormModal } from "@/components/plans/PlanFormModal";
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
import { Button } from "@esparex/ui";

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
                        <div className="font-bold text-foreground flex items-center gap-2">
                            {plan.name}
                            {plan.isDefault && (
                                <span className="text-tiny bg-blue-100 text-blue-700 font-semibold px-1.5 py-0.5 rounded uppercase tracking-wider">
                                    Default Business Plan
                                </span>
                            )}
                        </div>
                        <div className="text-tiny font-mono text-foreground-tertiary bg-muted/40 px-1.5 py-0.5 rounded border border-border w-fit mt-1">
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
                    <span className="font-bold text-sm text-foreground-secondary">
                        {plan.price === 0 ? "Free / Included" : `${plan.currency} ${plan.price}`}
                    </span>
                    <span className="text-tiny text-foreground-subtle font-medium">
                        {plan.durationDays ? `${plan.durationDays} Days / Year` : "365 Days"}
                    </span>
                </div>
            )
        },
        {
            header: "Trust & Priority",
            cell: (plan: Plan) => (
                <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-foreground-secondary flex items-center gap-1">
                        <Activity size={12} className="text-sky-500" /> Priority: {plan.features?.priorityWeight ?? 1}/10
                    </span>
                    <span className="text-tiny text-foreground-tertiary uppercase tracking-widest flex items-center gap-1">
                        <ShieldCheck size={10} className={plan.features?.businessBadge ? "text-emerald-500" : "text-foreground-subtle"} />
                        Badge: {plan.features?.businessBadge ? "Enabled" : "Disabled"}
                    </span>
                </div>
            )
        },
        {
            header: "Posting Quotas",
            cell: (plan: Plan) => (
                <div className="text-xs text-foreground-secondary flex flex-col gap-1">
                    <div>Ads: <span className="font-medium text-foreground">{plan.limits?.maxAds ?? "Configurable"}</span></div>
                    <div>Services: <span className="font-medium text-foreground">{plan.limits?.maxServices ?? "Configurable"}</span></div>
                    <div>Spare Parts: <span className="font-medium text-foreground">{plan.limits?.maxParts ?? "Configurable"}</span></div>
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
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-caption font-medium transition-colors cursor-pointer ${
                        plan.active
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                            : "bg-muted text-foreground-secondary border border-border hover:bg-muted/80"
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
                        className="p-1.5 text-foreground-subtle hover:text-sky-600 rounded-lg hover:bg-sky-50 transition-colors"
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
            <AdminPageShell
                title="Business Plans"
                description="Manage Business Base and Business Pro membership subscription plans."
                tabs={<AdminModuleTabs tabs={financeTabs} />}
                actions={
                    <Button
                        variant="primary"
                        onClick={() => { setEditPlan(null); setShowModal(true); }}
                    >
                        <CreditCard size={18} /> New Business Plan
                    </Button>
                }
            >
                <div className="flex flex-col gap-6">
                    <AdminFilterToolbar
                        search={search}
                        onSearchChange={(val) => replaceQueryState({ q: val })}
                        searchPlaceholder="Search business plans by name or code..."
                    />

                    {error && (
                        <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg p-4 text-body font-medium flex items-center gap-2">
                            <AlertCircle size={18} /> {error}
                        </div>
                    )}

                    <div className="min-h-0 flex-1">
                        <DataTable
                            data={businessPlans}
                            columns={columns}
                            isLoading={loading}
                            emptyMessage="No business plans found matching your criteria"
                            enableCsvExport
                            csvFileName="business-plans.csv"
                            enableColumnVisibility
                        />
                    </div>

                    <PlanFormModal
                        open={showModal}
                        onClose={() => { setShowModal(false); setEditPlan(null); }}
                        onSaved={() => { void fetchPlans({ q: search, userType: "business" }); }}
                        editPlan={editPlan}
                    />
                </div>
            </AdminPageShell>

            <ConfirmDeactivateDialog
                isOpen={!!togglingPlanId}
                onClose={() => setTogglingPlanId(null)}
                onConfirm={confirmToggleStatus}
                isMutating={isMutating}
                title="Deactivate Business Plan"
                description="Disabling this plan will prevent new businesses from subscribing to it."
            />
        </>
    );
}
