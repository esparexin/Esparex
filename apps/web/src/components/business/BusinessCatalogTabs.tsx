"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { AdCardList } from "@/components/user/ad-card";
import { buildPublicListingDetailRoute } from "@/lib/publicListingRoutes";
import type { Service } from "@/lib/api/user/businesses";
import type { Ad } from "@/schemas/ad.schema";
import { LISTING_TYPE } from "@esparex/contracts";
import { Button, Card, CardContent, LayoutGrid, Search, X } from "@esparex/ui";

export type ListingTab = "ads" | "services" | "spare-parts";

interface CatalogTab {
  key: ListingTab;
  label: string;
  count: number;
  icon?: React.ReactNode;
}

interface BusinessCatalogTabsProps {
  tabs: CatalogTab[];
  activeTab?: ListingTab;
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
  const [query, setQuery] = useState("");

  const filteredItems = useMemo(() => {
    if (!query.trim()) return activeItems;
    const q = query.toLowerCase().trim();
    return activeItems.filter((item) => {
      const title = String(item.title || "").toLowerCase();
      const cat = String(item.category || "").toLowerCase();
      return title.includes(q) || cat.includes(q);
    });
  }, [activeItems, query]);

  if (tabs.length === 0) {
    return (
      <Card className="rounded-2xl border-border shadow-xs bg-card">
        <CardContent className="py-12 text-center text-caption text-foreground-subtle font-medium">
          This store does not have any live public listings yet.
        </CardContent>
      </Card>
    );
  }

  const activeTabLabel = tabs.find((t) => t.key === effectiveActiveTab)?.label || "Products";

  return (
    <div className="flex flex-col gap-3 sm:gap-4 w-full min-w-0">
      {/* Tab Segment Controls & In-Store Search Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 w-full min-w-0">
        <div className="w-full sm:w-auto min-w-0 overflow-x-auto scrollbar-none overscroll-x-contain touch-pan-x">
          <div
            role="tablist"
            aria-label="Store catalog categories"
            className="inline-flex items-center gap-1.5 p-1 bg-muted/50 rounded-2xl border border-border/70 min-w-max"
          >
            {tabs.map((tab) => {
              const isActive = effectiveActiveTab === tab.key;
              return (
                <button
                  key={tab.key}
                  id={`tab-${tab.key}`}
                  role="tab"
                  type="button"
                  aria-selected={isActive}
                  aria-controls={`tabpanel-${tab.key}`}
                  onClick={() => {
                    onTabChange(tab.key);
                    setQuery("");
                  }}
                  className={cn(
                    "px-4 py-2 rounded-xl text-caption font-semibold transition-all whitespace-nowrap cursor-pointer select-none shrink-0",
                    isActive
                      ? "bg-card text-foreground shadow-xs border border-border font-bold"
                      : "text-foreground-secondary hover:text-foreground hover:bg-muted/60"
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick In-Store Filter */}
        {activeItems.length > 3 && (
          <div className="relative w-full sm:w-56 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder={`Search in ${activeTabLabel.toLowerCase()}...`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-8 pr-7 h-9 text-body-lg md:text-body bg-card border border-border rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none placeholder:text-muted-foreground transition-all"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                aria-label="Clear search"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tab Panel Content */}
      <div
        id={`tabpanel-${effectiveActiveTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${effectiveActiveTab}`}
      >
        {filteredItems.length > 0 ? (
          <div className="flex flex-col gap-2.5 sm:gap-3">
            {filteredItems.map((item, index) => {
              const record = item as Record<string, unknown>;
              const id = String(record.id || record._id || "");
              return (
                <AdCardList
                  key={id}
                  ad={item as Ad}
                  href={buildListingHref(item)}
                  priority={index < 4}
                />
              );
            })}
          </div>
        ) : effectiveActiveTab === "ads" && !query ? (
          <div className="flex items-center justify-center py-10 sm:py-14">
            <Button
              asChild
              className="h-10 px-8 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-caption font-semibold shadow-xs cursor-pointer"
            >
              <a href="/post">Post</a>
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-12 px-4 text-center rounded-2xl border border-border bg-card shadow-xs">
            <div className="size-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
              <LayoutGrid className="size-5" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-foreground text-body">
                {query ? `No items found matching "${query}"` : `No ${activeTabLabel.toLowerCase()} currently available.`}
              </p>
              <p className="text-caption text-foreground-subtle max-w-xs leading-relaxed">
                {query ? "Try checking for typos or searching a different keyword." : "Check back later or browse other categories."}
              </p>
            </div>
            {query && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuery("")}
                className="h-8 rounded-lg text-caption font-semibold mt-1"
              >
                Clear filter
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
