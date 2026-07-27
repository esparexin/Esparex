import React, { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@esparex/ui";
import { Star, Package, Bell } from "@/icons/IconRegistry";
import { ChevronLeft, ChevronRight } from "@/components/ui/icons";
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

function PlanCardView({
    plan,
    activeConfig,
    formatCurrency,
    setSelectedPlan,
    setShowPlanDialog,
    hasMultiplePlans = false,
    activeSlideIndex = 0,
    totalSlides = 1,
    onPrev,
    onNext,
}: {
    plan: PlanCard;
    activeConfig: SubTabConfig;
    formatCurrency: (amount: number) => string;
    setSelectedPlan: (id: string) => void;
    setShowPlanDialog: (show: boolean) => void;
    hasMultiplePlans?: boolean;
    activeSlideIndex?: number;
    totalSlides?: number;
    onPrev?: () => void;
    onNext?: () => void;
}) {
    const isRecommended = plan.popular;

    return (
        <div
            className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all duration-200 relative h-auto space-y-4 ${
                isRecommended
                    ? "border-2 border-slate-900 shadow-md"
                    : "border-slate-200 hover:border-slate-300 hover:shadow-xs"
            }`}
        >
            {/* Recommended Badge Pill */}
            {isRecommended && (
                <div className="absolute -top-2.5 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-xs">
                    Recommended
                </div>
            )}

            {/* In-Card Header Arrow Navigation (Image 2 style) */}
            {hasMultiplePlans && (
                <div className="flex items-center justify-between sm:hidden pt-0.5">
                    <button
                        type="button"
                        onClick={onPrev}
                        disabled={activeSlideIndex === 0}
                        className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-95"
                        aria-label="Previous Plan"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="text-[10px] font-semibold text-slate-400 tracking-wider">
                        {activeSlideIndex + 1} / {totalSlides}
                    </span>
                    <button
                        type="button"
                        onClick={onNext}
                        disabled={activeSlideIndex === totalSlides - 1}
                        className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-95"
                        aria-label="Next Plan"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            )}

            {/* Card Content Header & Category Icon */}
            <div className="text-center">
                <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-900">
                    {activeConfig.icon}
                </div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    {plan.name}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    {activeConfig.description}
                </p>
            </div>

            {/* Price Section */}
            <div className="text-center my-2">
                <div className="flex items-baseline justify-center gap-1">
                    <span className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
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

            {/* Features Checklist */}
            <div className="pt-3 border-t border-slate-100 space-y-2 text-left">
                <p className="text-[10px] font-bold text-slate-900 uppercase tracking-wider">
                    Highlights
                </p>
                <PlanFeatureList features={plan.features} />
            </div>
        </div>
    );
}

export function PlansTab({
    dynamicPlans,
    currentPlan,
    setSelectedPlan,
    setShowPlanDialog,
    formatCurrency,
}: PlansTabProps) {
    const [activeTab, setActiveTab] = useState<ProfilePlanType>("Spotlight");
    const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
    const carouselRef = useRef<HTMLDivElement | null>(null);

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

    const activeConfig: SubTabConfig = SUB_TABS.find((t) => t.id === activeTab) ?? DEFAULT_SUB_TAB;
    const filteredPlans = dynamicPlans.filter((p) => isProfilePlanType(p.type) && p.type === activeTab);

    // Reset slide index when active category tab changes
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: resets carousel slide position when plan category changes
        setActiveSlideIndex(0);
        if (carouselRef.current) {
            carouselRef.current.scrollLeft = 0;
        }
    }, [activeTab]);

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

    const scrollCarousel = (targetIndex: number) => {
        if (!carouselRef.current || targetIndex < 0 || targetIndex >= filteredPlans.length) return;
        const width = carouselRef.current.clientWidth;
        carouselRef.current.scrollTo({
            left: targetIndex * width,
            behavior: "smooth",
        });
        setActiveSlideIndex(targetIndex);
    };

    const handleCarouselScroll = () => {
        if (!carouselRef.current) return;
        const width = carouselRef.current.clientWidth;
        if (width > 0) {
            const index = Math.round(carouselRef.current.scrollLeft / width);
            if (index !== activeSlideIndex && index >= 0 && index < filteredPlans.length) {
                setActiveSlideIndex(index);
            }
        }
    };

    return (
        <div className="space-y-4">
            {/* Top Row: Single-Line Sub-Tabs Switcher + Desktop Current Plan Badge */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div
                    role="tablist"
                    aria-label="Plan Categories"
                    className="flex items-center justify-between w-full md:max-w-md gap-1.5 sm:gap-2"
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
                                className={`flex-1 flex flex-row items-center justify-center gap-1 sm:gap-1.5 py-1.5 px-1 sm:px-3 text-[10px] sm:text-xs font-bold rounded-full border transition-all duration-200 shrink-0 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${
                                    isActive
                                        ? "bg-blue-50/30 text-blue-900 border-blue-200 shadow-sm"
                                        : "bg-white text-slate-500 border-slate-200 hover:text-slate-700 hover:bg-slate-50"
                                }`}
                            >
                                <span className="shrink-0">{tab.icon}</span>
                                <span className="whitespace-nowrap tracking-tight">{tab.label}</span>
                                {count > 0 && (
                                    <span
                                        className={`px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold rounded-full ${
                                            isActive
                                                ? "bg-blue-100 text-blue-800"
                                                : "bg-slate-100 text-slate-500"
                                        }`}
                                    >
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Desktop-only Current Plan Badge */}
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
                    <>
                        {/* MOBILE VIEWPORT: Carousel Card Deck (Image 2 style) */}
                        <div className="block sm:hidden pt-1">
                            {/* Slider Track */}
                            <div
                                ref={carouselRef}
                                onScroll={handleCarouselScroll}
                                className="flex overflow-x-auto scrollbar-none snap-x snap-mandatory gap-4 pb-1 scroll-smooth"
                            >
                                {filteredPlans.map((plan) => (
                                    <div key={plan.id} className="w-full shrink-0 snap-center">
                                        <PlanCardView
                                            plan={plan}
                                            activeConfig={activeConfig}
                                            formatCurrency={formatCurrency}
                                            setSelectedPlan={setSelectedPlan}
                                            setShowPlanDialog={setShowPlanDialog}
                                            hasMultiplePlans={filteredPlans.length > 1}
                                            activeSlideIndex={activeSlideIndex}
                                            totalSlides={filteredPlans.length}
                                            onPrev={() => scrollCarousel(activeSlideIndex - 1)}
                                            onNext={() => scrollCarousel(activeSlideIndex + 1)}
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* Pagination Dots Indicator (Image 2 style: ● ○ ○) */}
                            {filteredPlans.length > 1 && (
                                <div className="flex items-center justify-center gap-1.5 mt-2.5">
                                    {filteredPlans.map((_, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => scrollCarousel(idx)}
                                            aria-label={`Go to plan ${idx + 1}`}
                                            className={`transition-all duration-200 ${
                                                activeSlideIndex === idx
                                                    ? "w-4 h-1.5 bg-blue-600 rounded-full"
                                                    : "w-1.5 h-1.5 bg-slate-300 rounded-full hover:bg-slate-400"
                                            }`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* DESKTOP VIEWPORT: Clean Grid Layout */}
                        <div className="hidden sm:grid grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
                            {filteredPlans.map((plan) => (
                                <PlanCardView
                                    key={plan.id}
                                    plan={plan}
                                    activeConfig={activeConfig}
                                    formatCurrency={formatCurrency}
                                    setSelectedPlan={setSelectedPlan}
                                    setShowPlanDialog={setShowPlanDialog}
                                />
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="bg-white rounded-xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">
                        No plans currently available for {activeConfig.label}. Please check back soon.
                    </div>
                )}
            </div>
        </div>
    );
}
