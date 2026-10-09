"use client";

import { memo } from "react";
import { Card } from "@esparex/ui";
import { cn } from "@/lib/utils";
import { type AdCardData, type AdCardClickEvent, type AdCardKeyboardEvent } from "../shared";

export interface AdCardShellProps {
  ad: AdCardData;
  handleCardClick: (e?: AdCardClickEvent) => void;
  handleKeyDown?: (e: AdCardKeyboardEvent) => void;
  className?: string;
  children: React.ReactNode;
}

export const AdCardShell = memo(function AdCardShell({
  ad,
  handleCardClick,
  handleKeyDown,
  className,
  children,
}: AdCardShellProps) {
  return (
    /* article gives screen readers proper landmark for list card items */
    <article
      aria-label={ad.title}
      className="group relative"
    >
      <Card
        tabIndex={0}
        role="button"
        className={cn(
          "overflow-hidden transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          className
        )}
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
      >
        {children}
      </Card>
    </article>
  );
});

AdCardShell.displayName = "AdCardShell";
