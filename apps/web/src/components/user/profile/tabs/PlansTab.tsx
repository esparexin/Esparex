import React, { useState, useRef, useCallback } from "react";
import { Button } from "@esparex/ui";
import { Star, Package, Bell } from "@/icons/IconRegistry";
import { PlanFeatureList } from "@/components/user/profile/PlanFeatureList";
import type { ProfilePlan, ProfilePlanType } from "../types";

type PlanCard = Omit<ProfilePlan, "type"> & { type: string };

interface SubTabConfig {
    id: ProfilePlanType;
    label: string;
    description: string;
    icon: React.ReactNode;
}

const DEFAULT_SUB_TAB: SubTabConfig = {
    id: "Spotlight",
    label: "Spotlight",
    description: "Get your ad to the top of search results for maximum buyer reach",
    icon: <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />,
};

const SUB_TABS: SubTabConfig[] = [
    DEFAULT_SUB_TAB,
    {
        id: "More Ads",
        label: "More Ads",
        description: "Post additional ads beyond your free monthly posting allowance",
        icon: <Package className="h-3.5 w-3.5 text-blue-600" />,
    },
    {
        id: "Alert Slots",
        label: "Smart Alerts",
        description: "Increase active automated search & instant stock alert capacity",
        icon: <Bell className="h-3.5 w-3.5 text-purple-600" />,
    },
];

interface PlansTabProps {
    dynamicPlans: PlanCard[];
    currentPlan: string;
    setSelectedPlan: (id: string) => void;
    setShowPlanDialog: (show: boolean) => void;
    formatCurrency: (amount: number) => string;
}

export function PlansTab({
    dynamicPlans,
    currentPlan,
    setSelectedPlan,
    setShowPlanDialog,
    formatCurrency,
}: PlansTabProps) {
    const [activeTab, setActiveTab] = useState<ProfilePlanType>("Spotlight");
    const tabRefs = useRef<Record<ProfilePlanType, HTMLButtonElement | null>>({
        Spotlight: null,
        "More Ads": null,
        "Alert Slots": null,
    });

    const isProfilePlanType = (value: string): value is ProfilePlanType => {
        return value === "Spotlight" || value === "More Ads" || value === "Alert Slots";
    };

    const countPlansForType = useCallback((type: ProfilePlanType) => {
        return dynamicPlans.filter((p) => isProfilePlanType(p.type) && p.type === type).length;
    }, [dynamicPlans]);

    const handleKeyDown = (e: React.KeyboardEvent, currentType: ProfilePlanType) => {
        const index = SUB_TABS.findIndex((t) => t.id === currentType);
        let nextIndex = index >= 0 ? index : 0;

        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
            e.preventDefault();
            nextIndex = (nextIndex + 1) % SUB_TABS.length;
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
            e.preventDefault();
            nextIndex = (nextIndex - 1 + SUB_TABS.length) % SUB_TABS.length;
        } else if (e.key === "Home") {
            e.preventDefault();
            nextIndex = 0;
        } else if (e.key === "End") {
            e.preventDefault();
            nextIndex = SUB_TABS.length - 1;
        }

        const targetTab = SUB_TABS[nextIndex];
        if (nextIndex !== index && targetTab) {
            setActiveTab(targetTab.id);
            tabRefs.current[targetTab.id]?.focus();
        }
    };

    const activeConfig: SubTabConfig = SUB_TABS.find((t) => t.id === activeTab) ?? DEFAULT_SUB_TAB;
    const filteredPlans = dynamicPlans.filter((p) => isProfilePlanType(p.type) && p.type === activeTab);

    return (
        <div className="account-container-default space-y-4 pb-28 sm:pb-8">
            {/* Top Row: Full-Width 3-Sub-Tab Switcher + Desktop Current Plan Badge */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div
                    role="tablist"
                    aria-label="Plan Categories"
                    className="flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 shadow-xs w-full md:max-w-md"
                >
                    {SUB_TABS.map((tab) => {
                        const isActive = activeTab === tab.id;
                        const count = countPlansForType(tab.id);

                        return (
                            <button
                                key={tab.id}
                                ref={(el) => { tabRefs.current[tab.id] = el; }}
                                role="tab"
                                id={`tab-${tab.id.replace(/\s+/g, '-').toLowerCase()}`}
                                aria-selected={isActive}
                                aria-controls={`tabpanel-${tab.id.replace(/\s+/g, '-').toLowerCase()}`}
                                tabIndex={isActive ? 0 : -1}
                                onClick={() => setActiveTab(tab.id)}
                                onKeyDown={(e) => handleKeyDown(e, tab.id)}
                                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 shrink-0 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${
                                    isActive
                                        ? "bg-white text-slate-900 shadow-xs border border-slate-200/80"
                                        : "text-slate-500 hover:text-slate-900"
                                }`}
                            >
                                <span className="shrink-0">{tab.icon}</span>
                                <span>{tab.label}</span>
                                {count > 0 && (
                                    <span
                                        className={`px-1.5 py-0.2 text-[10px] font-bold rounded-full border ${
                                            isActive
                                                ? "bg-blue-100 text-blue-800 border-blue-200"
                                                : "bg-slate-200/80 text-slate-600 border-slate-300/50"
                                        }`}
                                    >
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Desktop-only Current Plan Badge (Mobile renders in top sticky header) */}
                {currentPlan && (
                    <div className="hidden md:block text-xs font-medium text-slate-500 bg-slate-100/80 border border-slate-200/60 px-3 py-1.5 rounded-full shrink-0">
                        Current: <span className="font-bold text-slate-800">{currentPlan}</span>
                    </div>
                )}
            </div>

            {/* Active Tab Panel Content */}
            <div
                id={`tabpanel-${activeConfig.id.replace(/\s+/g, '-').toLowerCase()}`}
                role="tabpanel"
                aria-labelledby={`tab-${activeConfig.id.replace(/\s+/g, '-').toLowerCase()}`}
                tabIndex={0}
                className="outline-none"
            >
                {filteredPlans.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                        {filteredPlans.map((plan) => {
                            const isRecommended = plan.popular;

                            return (
                                <div
                                    key={plan.id}
                                    className={`bg-white rounded-xl p-4 sm:p-5 border transition-all duration-200 flex flex-col justify-between relative ${
                                        isRecommended
                                            ? "border-2 border-slate-900 shadow-md"
                                            : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                                    }`}
                                >
                                    {/* Recommended Badge Pill (Compact Image 1 Style) */}
                                    {isRecommended && (
                                        <div className="absolute -top-2.5 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-xs">
                                            Recommended
                                        </div>
                                    )}

                                    <div>
                                        {/* Card Header & Category Icon */}
                                        <div className="text-center">
                                            <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-900">
                                                {activeConfig.icon}
                                            </div>
                                            <h3 className="text-base font-bold text-slate-900 tracking-tight">
                                                {plan.name}
                                            </h3>
                                            <p className="text-[11px] text-slate-500 mt-0.5 min-h-[28px] flex items-center justify-center leading-normal">
                                                {activeConfig.description}
                                            </p>
                                        </div>

                                        {/* Price Section */}
                                        <div className="my-3 text-center">
                                            <div className="flex items-baseline justify-center gap-1">
                                                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                                                    {formatCurrency(plan.price)}
                                                </span>
                                            </div>
                                            <span className="text-[11px] font-medium text-slate-400 block mt-0.5">
                                                / {plan.duration}
                                            </span>
                                        </div>

                                        {/* Primary Action Button */}
                                        <Button
                                            onClick={() => {
                                                setSelectedPlan(plan.id);
                                                setShowPlanDialog(true);
                                            }}
                                            className={`w-full h-9 rounded-lg font-semibold text-xs transition-all active:scale-[0.98] ${
                                                isRecommended
                                                    ? "bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
                                                    : "bg-white border border-slate-300 hover:bg-slate-50 text-slate-900"
                                            }`}
                                        >
                                            Buy Now
                                        </Button>
                                    </div>

                                    {/* Features Checklist */}
                                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-left">
                                        <p className="text-[10px] font-bold text-slate-900 uppercase tracking-wider">
                                            Highlights
                                        </p>
                                        <PlanFeatureList features={plan.features} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">
                        No plans currently available for {activeConfig.label}. Please check back soon.
                    </div>
                )}
            </div>
        </div>
    );
}
