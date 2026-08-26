"use client";

import { useState, useRef } from "react";
import { type Ad } from "@/schemas/ad.schema";
import { cleanupListingDescription } from "@/lib/listings/descriptionCleanup";
import { cn } from "@/components/ui/utils";
import { ListingRelatedBusinessesSection } from "./ListingRelatedBusinessesSection";
import { ListingDescriptionTab } from "./ListingDescriptionTab";
import { ListingWorkingSparePartsTab, extractSparePartItems } from "./ListingWorkingSparePartsTab";
import type { UserPage } from "@/lib/routeUtils";

interface ListingDescriptionCardProps {
    ad: Ad;
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

const TAB_KEYS = ["repair-shops", "description", "spare-parts"] as const;
type TabKey = typeof TAB_KEYS[number];

export function ListingDescriptionCard({ ad, navigateTo }: ListingDescriptionCardProps) {
    const [activeTab, setActiveTab] = useState<TabKey>("repair-shops");
    const sectionRef = useRef<HTMLElement>(null);
    const description = cleanupListingDescription(String(ad.description || ""));
    const sparePartItems = extractSparePartItems(ad);

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
        const currentIndex = TAB_KEYS.indexOf(currentTab);
        let nextIndex = currentIndex;

        if (e.key === "ArrowRight") {
            nextIndex = (currentIndex + 1) % TAB_KEYS.length;
        } else if (e.key === "ArrowLeft") {
            nextIndex = (currentIndex - 1 + TAB_KEYS.length) % TAB_KEYS.length;
        } else if (e.key === "Home") {
            nextIndex = 0;
        } else if (e.key === "End") {
            nextIndex = TAB_KEYS.length - 1;
        } else {
            return;
        }

        e.preventDefault();
        const nextTab = TAB_KEYS[nextIndex];
        if (nextTab) {
            setActiveTab(nextTab);
            scrollToSection();
            document.getElementById(`tab-${nextTab}`)?.focus();
        }
    };

    return (
        <section ref={sectionRef} className="space-y-4 pt-3 sm:pt-4 pb-3 sm:pb-4 border-b border-border/80">
            {/* Accessible 3-Tab Controls: Repair Shops | Description | Spare Parts */}
            <div
                role="tablist"
                aria-label="Listing content sections"
                className="flex items-center gap-1.5 border-b border-border pb-px overflow-x-auto scrollbar-hide"
            >
                <button
                    type="button"
                    role="tab"
                    id="tab-repair-shops"
                    aria-controls="tabpanel-repair-shops"
                    aria-selected={activeTab === "repair-shops"}
                    tabIndex={activeTab === "repair-shops" ? 0 : -1}
                    onClick={() => handleTabSelect("repair-shops")}
                    onKeyDown={(e) => handleTabKeyDown(e, "repair-shops")}
                    className={cn(
                        "inline-flex items-center gap-2 px-3.5 py-2.5 text-caption sm:text-body font-semibold rounded-t-xl transition-all border-b-2 -mb-px whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer",
                        activeTab === "repair-shops"
                            ? "border-primary text-primary font-bold bg-primary/5"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                >
                    <span>Repair Shops</span>
                </button>

                <button
                    type="button"
                    role="tab"
                    id="tab-description"
                    aria-controls="tabpanel-description"
                    aria-selected={activeTab === "description"}
                    tabIndex={activeTab === "description" ? 0 : -1}
                    onClick={() => handleTabSelect("description")}
                    onKeyDown={(e) => handleTabKeyDown(e, "description")}
                    className={cn(
                        "inline-flex items-center gap-2 px-3.5 py-2.5 text-caption sm:text-body font-semibold rounded-t-xl transition-all border-b-2 -mb-px whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer",
                        activeTab === "description"
                            ? "border-primary text-primary font-bold bg-primary/5"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                >
                    <span>Description</span>
                </button>

                <button
                    type="button"
                    role="tab"
                    id="tab-spare-parts"
                    aria-controls="tabpanel-spare-parts"
                    aria-selected={activeTab === "spare-parts"}
                    tabIndex={activeTab === "spare-parts" ? 0 : -1}
                    onClick={() => handleTabSelect("spare-parts")}
                    onKeyDown={(e) => handleTabKeyDown(e, "spare-parts")}
                    className={cn(
                        "inline-flex items-center gap-2 px-3.5 py-2.5 text-caption sm:text-body font-semibold rounded-t-xl transition-all border-b-2 -mb-px whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer",
                        activeTab === "spare-parts"
                            ? "border-primary text-primary font-bold bg-primary/5"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    )}
                >
                    <span>Spare Parts</span>
                    {sparePartItems.length > 0 && (
                        <span className={cn(
                            "rounded-full px-1.5 py-0.2 text-tiny font-bold",
                            activeTab === "spare-parts" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                        )}>
                            {sparePartItems.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Tab 1 Panel: Repair Shops */}
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

            {/* Tab 2 Panel: Description */}
            {activeTab === "description" && (
                <ListingDescriptionTab ad={ad} description={description} />
            )}

            {/* Tab 3 Panel: Spare Parts */}
            {activeTab === "spare-parts" && (
                <ListingWorkingSparePartsTab ad={ad} sparePartItems={sparePartItems} />
            )}
        </section>
    );
}
