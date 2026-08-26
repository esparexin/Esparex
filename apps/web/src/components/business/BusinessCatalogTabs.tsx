"use client";

import { cn } from "@/components/ui/utils";
import { AdCardGrid } from "@/components/user/ad-card";
import { buildPublicListingDetailRoute } from "@/lib/publicListingRoutes";
import type { Service } from "@/lib/api/user/businesses";
import type { Ad } from "@/schemas/ad.schema";
import { LISTING_TYPE } from "@esparex/contracts";
import { Card, CardContent } from "@/components/ui/card";

export type ListingTab = "ads" | "services" | "spare-parts";

interface CatalogTab {
  key: ListingTab;
  label: string;
  count: number;
  icon: React.ReactNode;
}

interface BusinessCatalogTabsProps {
  tabs: CatalogTab[];
  activeTab: ListingTab;
  effectiveActiveTab: ListingTab;
  onTabChange: (tab: ListingTab) => void;
  activeItems: (Ad | Service)[];
}

const buildListingHref = (item: Ad | Service): string => {
  const record = item as Record<string, unknown>;
  const id = String(record.id || record._id || "");
  if (!id) return "/search";
  return buildPublicListingDetailRoute({
    id,
    listingType: record.listingType || LISTING_TYPE.AD,
    seoSlug: String(record.seoSlug || ""),
    title: String(record.title || "listing"),
  });
};

export function BusinessCatalogTabs({
  tabs,
  effectiveActiveTab,
  onTabChange,
  activeItems,
}: BusinessCatalogTabsProps) {
  if (tabs.length === 0) {
    return (
      <Card className="rounded-2xl border-border shadow-2xs bg-card">
        <CardContent className="py-8 text-center text-caption text-foreground-subtle font-normal">
          This business does not have any live public listings yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        role="tablist"
        aria-label="Business catalog tabs"
        className="flex gap-1.5 border-b border-border pb-1 overflow-x-auto scrollbar-hide"
      >
        {tabs.map((tab) => (
          <button
            key={tab.key}
            id={`tab-${tab.key}`}
            role="tab"
            type="button"
            aria-selected={effectiveActiveTab === tab.key}
            aria-controls={`tabpanel-${tab.key}`}
            onClick={() => onTabChange(tab.key)}
            className={cn(
              "-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2 text-caption font-semibold transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-t-lg",
              effectiveActiveTab === tab.key
                ? "border-primary text-primary font-bold"
                : "border-transparent text-foreground-subtle hover:text-foreground font-normal"
            )}
          >
            {tab.icon}
            <span>{tab.label}</span>
            <span
              className={cn(
                "ml-1 rounded-full px-1.5 text-tiny font-bold",
                effectiveActiveTab === tab.key
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-foreground-subtle"
              )}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <div
        id={`tabpanel-${effectiveActiveTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${effectiveActiveTab}`}
      >
        {activeItems.length > 0 ? (
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:gap-3">
            {activeItems.map((item, index) => {
              const record = item as Record<string, unknown>;
              const id = String(record.id || record._id || "");
              return (
                <AdCardGrid
                  key={id}
                  ad={item as Ad}
                  href={buildListingHref(item)}
                  priority={index < 4}
                />
              );
            })}
          </div>
        ) : (
          <p className="py-8 text-center text-caption text-foreground-subtle font-normal bg-card rounded-2xl border border-border">
            No{" "}
            {effectiveActiveTab === "ads"
              ? "listings"
              : effectiveActiveTab === "services"
                ? "services"
                : "spare parts"}{" "}
            available.
          </p>
        )}
      </div>
    </div>
  );
}
