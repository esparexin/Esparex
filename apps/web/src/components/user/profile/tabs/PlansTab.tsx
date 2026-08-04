import React, { useState, useRef, useEffect } from "react";
import { Button } from "@esparex/ui";
import { Star, Package, Bell } from "@/icons/IconRegistry";
import { ChevronLeft, ChevronRight } from "@/components/ui/icons";
import { getPlanDisplayName } from "./PurchasesTab";
import { MyBenefitsOverviewCard } from "../MyBenefitsOverviewCard";
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
        id: "Boost Ad",
        label: "Boost Ad",
        description: "Elevate your listing search ranking priority score",
        icon: <Star className="h-3.5 w-3.5 text-amber-600" />,
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
    currentPlan,
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
    currentPlan?: string;
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
    const cardConfig = SUB_TABS.find((t) => t.id === plan.type) ?? activeConfig;
    const isCurrentPlan = currentPlan?.toLowerCase() === plan.name?.toLowerCase() || (plan.price === 0 && (currentPlan === "Free" || currentPlan === "USER_DEFAULT_PLAN" || !currentPlan));
    const buttonLabel = plan.price === 0 ? "Claim Free" : "Buy Now";

    return (
        <div className="space-y-2.5">
            {/* Main Plan Card (Blue Border Card Box) */}
            <div
                className={`bg-white rounded-2xl p-4 sm:p-5 border-2 transition-all duration-200 relative text-center flex flex-col items-center justify-between gap-2.5 ${
                    isCurrentPlan || isRecommended
                        ? "border-blue-300 shadow-xs"
                        : "border-slate-200 hover:border-slate-300"
                }`}
            >
                {/* Current Plan Badge */}
                {isCurrentPlan && (
                    <div className="inline-block bg-blue-100 text-blue-700 text-tiny font-semibold px-3 py-0.5 rounded-full mb-0.5">
                        Your current plan
                    </div>
                )}

                {/* Multiple Plans In-Card Navigation */}
                {hasMultiplePlans && (
                    <div className="flex items-center justify-between w-full sm:hidden pt-0.5">
                        <button
                            type="button"
                            onClick={onPrev}
                            disabled={activeSlideIndex === 0}
                            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-95"
                            aria-label="Previous Plan"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-tiny font-semibold text-slate-400 tracking-wider">
                            {activeSlideIndex + 1} / {totalSlides}
                        </span>
                        <button
                            type="button"
                            onClick={onNext}
                            disabled={activeSlideIndex === totalSlides - 1}
                            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-20 disabled:pointer-events-none transition-all active:scale-95"
                            aria-label="Next Plan"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}

                {/* Circular Soft Blue Category Icon Container */}
                <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-blue-100/80 text-blue-600">
                    {cardConfig.icon}
                </div>

                {/* Plan Name & Description */}
                <div className="w-full">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                        {getPlanDisplayName(plan.name)}
                    </h3>
                    <p className="text-tiny text-slate-500 mt-0.5 leading-snug max-w-xs mx-auto">
                        {cardConfig.description}
                    </p>
                </div>

                {/* Price Display */}
                <div className="w-full py-1">
                    <div className="flex items-baseline justify-center gap-1">
                        <span className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-none">
                            {plan.price === 0 ? "Free" : formatCurrency(plan.price)}
                        </span>
                        <span className="text-tiny font-normal text-slate-500 leading-none">
                            / {plan.duration}
                        </span>
                    </div>
                </div>

                {/* Primary CTA Action Button */}
                {isCurrentPlan ? (
                    <div className="w-full h-9 rounded-xl font-semibold text-xs bg-slate-100 text-slate-500 border border-slate-200/80 flex items-center justify-center select-none">
                        Current Plan
                    </div>
                ) : (
                    <Button
                        onClick={() => {
                            setSelectedPlan(plan.id);
                            setShowPlanDialog(true);
                        }}
                        className="w-full h-9 rounded-xl font-bold text-xs sm:text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all active:scale-[0.98] tracking-tight mt-0.5"
                    >
                        {buttonLabel}
                    </Button>
                )}
            </div>

            {/* Plan Highlights Card (Separate Box below main card) */}
            <div className="bg-slate-50/50 border border-slate-200/80 rounded-2xl p-3 sm:p-4 space-y-1.5 text-left">
                <h4 className="text-tiny font-bold text-slate-900 tracking-tight">
                    Plan highlights
                </h4>
                <ul className="space-y-1">
                    {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-tiny font-medium text-slate-700">
                            <span className="text-emerald-600 font-bold text-tiny">✓</span>
                            <span>{feature}</span>
                        </li>
                    ))}
                </ul>
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
        "Boost Ad": null,
        "Alert Slots": null,
    });

    const isProfilePlanType = (value: string): value is ProfilePlanType => {
        return value === "Spotlight" || value === "More Ads" || value === "Boost Ad" || value === "Alert Slots";
    };

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
        const cardEl = carouselRef.current.firstElementChild as HTMLElement | null;
        const cardWidth = cardEl ? cardEl.offsetWidth + 16 : carouselRef.current.clientWidth;
        carouselRef.current.scrollTo({
            left: targetIndex * cardWidth,
            behavior: "smooth",
        });
        setActiveSlideIndex(targetIndex);
    };

    const handleCarouselScroll = () => {
        if (!carouselRef.current) return;
        const cardEl = carouselRef.current.firstElementChild as HTMLElement | null;
        const cardWidth = cardEl ? cardEl.offsetWidth + 16 : carouselRef.current.clientWidth;
        if (cardWidth > 0) {
            const index = Math.round(carouselRef.current.scrollLeft / cardWidth);
            if (index !== activeSlideIndex && index >= 0 && index < filteredPlans.length) {
                setActiveSlideIndex(index);
            }
        }
    };

    return (
        <div className="space-y-4">
            {/* Top Persistent My Benefits Overview Card */}
            <MyBenefitsOverviewCard />

            {/* Top Sub-Tabs Bar: Rounded Soft Blue Pills + Top Right Current Plan Badge */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto touch-pan-x scrollbar-none pb-0.5">
                <div
                    role="tablist"
                    aria-label="Plan Categories"
                    className="flex items-center gap-1.5 shrink-0"
                >
                    {SUB_TABS.map((tab) => {
                        const isActive = activeTab === tab.id;

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
                                className={`flex flex-row items-center gap-1.5 py-1.5 px-3 text-tiny sm:text-xs font-semibold rounded-full border transition-all duration-200 shrink-0 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                                    isActive
                                        ? "bg-blue-100 text-blue-700 border-blue-200 shadow-none"
                                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                                }`}
                            >
                                <span className="shrink-0">{tab.icon}</span>
                                <span className="whitespace-nowrap">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Top Right Plan Badge */}
                {currentPlan && (
                    <div className="bg-blue-100 text-blue-700 text-tiny font-semibold px-2.5 py-0.5 rounded-full shrink-0">
                        {currentPlan === "Free" || currentPlan === "USER_DEFAULT_PLAN" ? "Free plan" : currentPlan}
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
                        {/* MOBILE VIEWPORT: Carousel Card Deck */}
                        <div className="block sm:hidden pt-0.5">
                            {/* Slider Track */}
                            <div
                                ref={carouselRef}
                                onScroll={handleCarouselScroll}
                                className="flex overflow-x-auto scrollbar-none snap-x snap-mandatory gap-4 pb-0.5 scroll-smooth touch-pan-x overscroll-x-contain"
                            >
                                {filteredPlans.map((plan) => (
                                    <div key={plan.id} className="w-full shrink-0 snap-center">
                                        <PlanCardView
                                            plan={plan}
                                            activeConfig={activeConfig}
                                            currentPlan={currentPlan}
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

                            {/* Pagination Dots Indicator */}
                            {filteredPlans.length > 1 && (
                                <div className="flex items-center justify-center gap-1.5 mt-2">
                                    {filteredPlans.map((_, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => scrollCarousel(idx)}
                                            aria-label={`Go to plan ${idx + 1}`}
                                            className={`transition-all duration-200 ${
                                                activeSlideIndex === idx
                                                    ? "w-3.5 h-1 bg-blue-600 rounded-full"
                                                    : "w-1 h-1 bg-slate-300 rounded-full hover:bg-slate-400"
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
                                    currentPlan={currentPlan}
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
