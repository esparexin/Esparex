"use client";

import { useState, useRef } from "react";
import { type Ad } from "@/schemas/ad.schema";
import { cleanupListingDescription } from "@/lib/listings/descriptionCleanup";
import { cn } from "@/lib/utils";
import { ListingRelatedBusinessesSection } from "./ListingRelatedBusinessesSection";
import { ListingDescriptionTab } from "./ListingDescriptionTab";
import { ListingWorkingSparePartsTab, extractSparePartItems } from "./ListingWorkingSparePartsTab";
import type { UserPage } from "@/lib/routeUtils";
import { resolveListingSparePartsCount } from "@/lib/listings/listingPresentation";

interface ListingDescriptionCardProps {
    ad: Ad;
    /** Listing domain type — drives which tabs are shown. Defaults to "ad". */
    listingType?: "ad" | "service" | "spare_part";
    variant?: "mobile" | "desktop";
    navigateTo?: (
        page: UserPage,
        adId?: string | number,
        category?: string,
        sellerIdOrBusinessId?: string,
        serviceId?: string,
        sellerId?: string,
        sellerType?: "business" | "individual"
    ) => void;
}

// ── Tab definitions per listing domain ─────────────────────────────────────

/** Canonical tab set for General Ad listings */
export const TAB_KEYS = ["repair-shops", "description", "spare-parts"] as const;

const SERVICE_TAB_KEYS = ["about-service", "description"] as const;
const SPARE_PART_TAB_KEYS = ["part-details", "description"] as const;

type TabKey =
    | typeof TAB_KEYS[number]
    | typeof SERVICE_TAB_KEYS[number]
    | typeof SPARE_PART_TAB_KEYS[number];

// ── Tab label map ────────────────────────────────────────────────────────────
const TAB_LABELS: Record<TabKey, string> = {
    "repair-shops": "Repair Shops",
    "description": "Description",
    "spare-parts": "Working Spare Parts",
    "about-service": "About This Service",
    "part-details": "Part Details",
};

export function ListingDescriptionCard({ ad, navigateTo, listingType = "ad" }: ListingDescriptionCardProps) {
    const isService = listingType === "service";
    const isSparePart = listingType === "spare_part";

    // Compute the correct tab set and default active tab for this listing domain.
    // Ad listings keep the original Repair Shops → Description → Working Spare Parts flow.
    // Service and Spare Part listings get purpose-specific tabs with no irrelevant content.
    const tabKeys: readonly TabKey[] = isService
        ? SERVICE_TAB_KEYS
        : isSparePart
        ? SPARE_PART_TAB_KEYS
        : TAB_KEYS;

    const defaultTab = tabKeys[0] as TabKey;

    const [activeTab, setActiveTab] = useState<TabKey>(defaultTab);
    const sectionRef = useRef<HTMLElement>(null);
    const description = cleanupListingDescription(String(ad.description || ""));
    const sparePartItems = extractSparePartItems(ad);
    const sparePartsCount = resolveListingSparePartsCount(ad);

    const scrollToSection = () => {
        if (sectionRef.current && typeof window !== "undefined") {
            const headerEl = typeof document !== "undefined" ? document.querySelector("header") : null;
            const headerHeight = headerEl ? headerEl.getBoundingClientRect().height : (window.innerWidth >= 768 ? 70 : 120);
            const targetY = sectionRef.current.getBoundingClientRect().top + window.pageYOffset - headerHeight - 16;
            window.scrollTo({ top: Math.max(0, targetY), behavior: "smooth" });
        }
    };

    const handleTabSelect = (tabKey: TabKey) => {
        setActiveTab(tabKey);
        scrollToSection();
    };

    const handleTabKeyDown = (e: React.KeyboardEvent, currentTab: TabKey) => {
        const currentIndex = tabKeys.indexOf(currentTab as never);
        let nextIndex = currentIndex;

        if (e.key === "ArrowRight") {
            nextIndex = (currentIndex + 1) % tabKeys.length;
        } else if (e.key === "ArrowLeft") {
            nextIndex = (currentIndex - 1 + tabKeys.length) % tabKeys.length;
        } else if (e.key === "Home") {
            nextIndex = 0;
        } else if (e.key === "End") {
            nextIndex = tabKeys.length - 1;
        } else {
            return;
        }

        e.preventDefault();
        const nextTab = tabKeys[nextIndex] as TabKey;
        if (nextTab) {
            setActiveTab(nextTab);
            scrollToSection();
            document.getElementById(`tab-${nextTab}`)?.focus();
        }
    };

    return (
        <section ref={sectionRef} className="space-y-4 pt-3 sm:pt-4 pb-3 sm:pb-4 border-b border-border/80">
            {/* Accessible Tab Controls — rendered only for the active listing type's tab set */}
            <div
                role="tablist"
                aria-label="Listing content sections"
                className="flex items-center gap-1.5 border-b border-border pb-px overflow-x-auto scrollbar-hide"
            >
                {tabKeys.map((tabKey) => {
                    const isActive = activeTab === tabKey;
                    const showBadge = tabKey === "spare-parts" && sparePartsCount > 0;
                    return (
                        <button
                            key={tabKey}
                            type="button"
                            role="tab"
                            id={`tab-${tabKey}`}
                            aria-controls={`tabpanel-${tabKey}`}
                            aria-selected={isActive}
                            tabIndex={isActive ? 0 : -1}
                            onClick={() => handleTabSelect(tabKey)}
                            onKeyDown={(e) => handleTabKeyDown(e, tabKey)}
                            className={cn(
                                "inline-flex items-center gap-2 px-3.5 py-2.5 text-caption sm:text-body font-semibold rounded-t-xl transition-all border-b-2 -mb-px whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer",
                                isActive
                                    ? "border-primary text-emerald-700 dark:text-emerald-400 font-bold bg-primary/10"
                                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            )}
                        >
                            <span>{TAB_LABELS[tabKey]}</span>
                            {showBadge && (
                                <span className={cn(
                                    "rounded-full px-2 py-0.5 text-tiny font-bold",
                                    isActive ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                                )}>
                                    {sparePartsCount}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Tab 1 Panel: Repair Shops (Ad only) */}
            {activeTab === "repair-shops" && (
                <div
                    role="tabpanel"
                    id="tabpanel-repair-shops"
                    aria-labelledby="tab-repair-shops"
                    tabIndex={0}
                    className="pt-3.5 sm:pt-4 focus-visible:outline-none"
                >
                    <ListingRelatedBusinessesSection
                        ad={ad}
                        navigateTo={navigateTo || (() => {})}
                        variant="default"
                    />
                </div>
            )}

            {/* Tab Panel: About This Service (Service only) */}
            {activeTab === "about-service" && (
                <ListingDescriptionTab ad={ad} description={description} />
            )}

            {/* Tab Panel: Part Details (Spare Part only) */}
            {activeTab === "part-details" && (
                <ListingDescriptionTab ad={ad} description="" />
            )}

            {/* Tab Panel: Description (all listing types) */}
            {activeTab === "description" && (
                <ListingDescriptionTab ad={ad} description={description} />
            )}

            {/* Tab Panel: Working Spare Parts (Ad only) */}
            {activeTab === "spare-parts" && (
                <ListingWorkingSparePartsTab ad={ad} sparePartItems={sparePartItems} />
            )}
        </section>
    );
}

