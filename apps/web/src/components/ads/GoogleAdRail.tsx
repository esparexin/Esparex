"use client";

import { memo } from "react";
import { cn } from "@/components/ui/utils";

export type AdRailFormat = "skyscraper" | "half-page" | "rectangle";

interface GoogleAdRailProps {
  slotId: string;
  format?: AdRailFormat;
  className?: string;
  label?: string;
}

const FORMAT_CONFIG: Record<AdRailFormat, { width: string; minHeight: string; label: string }> = {
  skyscraper: {
    width: "w-[160px]",
    minHeight: "min-h-[600px]",
    label: "160x600 Skyscraper",
  },
  "half-page": {
    width: "w-[300px]",
    minHeight: "min-h-[600px]",
    label: "300x600 Half Page",
  },
  rectangle: {
    width: "w-[300px]",
    minHeight: "min-h-[250px]",
    label: "300x250 Rectangle",
  },
};

/**
 * GoogleAdRail
 * Canonical desktop sidebar container for Google Ads (AdSense / GAM).
 * Features:
 * - Fixed/min aspect bounds to prevent Cumulative Layout Shift (CLS < 0.1).
 * - Sticky self-start behavior for high viewability during list scrolling.
 * - Accessible aria labeling for screen readers.
 */
export const GoogleAdRail = memo(function GoogleAdRail({
  slotId,
  format = "skyscraper",
  className,
  label,
}: GoogleAdRailProps) {
  const config = FORMAT_CONFIG[format] || FORMAT_CONFIG.skyscraper;

  return (
    <aside
      aria-label="Sponsored advertisement"
      className={cn(
        "shrink-0 select-none",
        config.width,
        className
      )}
    >
      <div className="sticky top-20 flex flex-col gap-1.5">
        <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60 px-1 text-center">
          {label || "Advertisement"}
        </span>

        {/* Ad container slot with strict bounding to prevent layout shifts */}
        <div
          id={`google-ad-slot-${slotId}`}
          className={cn(
            "w-full rounded-2xl border border-dashed border-border/80 bg-muted/20 flex flex-col items-center justify-center p-3 text-center transition-colors overflow-hidden",
            config.minHeight
          )}
        >
          <div className="flex flex-col items-center gap-1 text-muted-foreground/60">
            <span className="text-tiny font-semibold">{config.label}</span>
            <span className="text-[10px] text-muted-foreground/40">Sponsored Placement</span>
          </div>
        </div>
      </div>
    </aside>
  );
});

GoogleAdRail.displayName = "GoogleAdRail";
