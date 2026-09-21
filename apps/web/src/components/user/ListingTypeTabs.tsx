"use client";

import { useCallback, useRef } from "react";
import { Sparkles, Smartphone, Wrench, Cpu } from "@esparex/ui";
import { cn } from "@/lib/utils";
import type { PublicBrowseType } from "@/lib/publicBrowseRoutes";

export interface ListingTypeTabItem {
  id: PublicBrowseType;
  label: string;
  icon: typeof Sparkles;
  ariaLabel: string;
}

export const LISTING_TYPE_TABS: readonly ListingTypeTabItem[] = [
  {
    id: "all",
    label: "All Listings",
    icon: Sparkles,
    ariaLabel: "Filter by all listings",
  },
  {
    id: "ad",
    label: "Devices",
    icon: Smartphone,
    ariaLabel: "Filter by devices",
  },
  {
    id: "service",
    label: "Services",
    icon: Wrench,
    ariaLabel: "Filter by repair services",
  },
  {
    id: "spare_part",
    label: "Spare Parts",
    icon: Cpu,
    ariaLabel: "Filter by spare parts",
  },
] as const;

export interface ListingTypeTabsProps {
  activeType: PublicBrowseType;
  onTypeChange: (type: PublicBrowseType) => void;
  counts?: Partial<Record<PublicBrowseType, number>>;
  className?: string;
  compact?: boolean;
}

export function ListingTypeTabs({
  activeType,
  onTypeChange,
  counts,
  className,
  compact = false,
}: ListingTypeTabsProps) {
  const tabRefs = useRef<Map<PublicBrowseType, HTMLButtonElement>>(new Map());

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
      let targetIndex = -1;

      if (e.key === "ArrowRight") {
        e.preventDefault();
        targetIndex = (currentIndex + 1) % LISTING_TYPE_TABS.length;
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        targetIndex = (currentIndex - 1 + LISTING_TYPE_TABS.length) % LISTING_TYPE_TABS.length;
      } else if (e.key === "Home") {
        e.preventDefault();
        targetIndex = 0;
      } else if (e.key === "End") {
        e.preventDefault();
        targetIndex = LISTING_TYPE_TABS.length - 1;
      }

      if (targetIndex >= 0 && targetIndex < LISTING_TYPE_TABS.length) {
        const targetTab = LISTING_TYPE_TABS[targetIndex];
        if (targetTab) {
          onTypeChange(targetTab.id);
          const button = tabRefs.current.get(targetTab.id);
          button?.focus();
        }
      }
    },
    [onTypeChange]
  );

  return (
    <div
      role="tablist"
      aria-label="Listing type filter"
      className={cn(
        "flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1 touch-pan-x",
        className
      )}
    >
      {LISTING_TYPE_TABS.map((tab, index) => {
        const isActive = activeType === tab.id;
        const Icon = tab.icon;
        const count = counts?.[tab.id];

        return (
          <button
            key={tab.id}
            ref={(node) => {
              if (node) tabRefs.current.set(tab.id, node);
              else tabRefs.current.delete(tab.id);
            }}
            type="button"
            role="tab"
            id={`tab-listing-type-${tab.id}`}
            aria-selected={isActive}
            aria-label={tab.ariaLabel}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onTypeChange(tab.id)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            className={cn(
              "inline-flex items-center gap-1.5 sm:gap-2 rounded-full border transition-all duration-150 shrink-0 select-none whitespace-nowrap cursor-pointer",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              compact
                ? "h-9 px-3 text-caption font-semibold"
                : "h-10 sm:h-11 px-3.5 sm:px-4 text-small sm:text-body font-semibold",
              isActive
                ? "border-primary bg-primary text-primary-foreground shadow-2xs font-bold"
                : "border-border/80 bg-card text-foreground-secondary hover:bg-muted hover:text-foreground active:scale-95"
            )}
          >
            <Icon
              className={cn(
                "shrink-0 transition-transform",
                compact ? "size-3.5" : "size-4",
                isActive ? "text-primary-foreground" : "text-foreground-subtle"
              )}
              aria-hidden="true"
            />
            <span>{tab.label}</span>
            {typeof count === "number" && count > 0 && (
              <span
                className={cn(
                  "inline-flex items-center justify-center rounded-full px-1.5 py-0.2 text-tiny font-bold tabular-nums",
                  isActive
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-muted text-foreground-secondary"
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
