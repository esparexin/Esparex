"use client";

import { memo } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/components/ui/utils";
import {
  AdCardLinkWrapper,
  type AdCardData,
} from "../shared";

export interface AdCardShellProps {
  ad: AdCardData;
  resolvedHref?: string;
  useDeclarativeLink: boolean;
  handleCardClick: (e?: React.MouseEvent) => void;
  className?: string;
  children: React.ReactNode;
}

export const AdCardShell = memo(function AdCardShell({
  ad,
  resolvedHref,
  useDeclarativeLink,
  handleCardClick,
  className,
  children,
}: AdCardShellProps) {
  return (
    <AdCardLinkWrapper href={resolvedHref} enabled={useDeclarativeLink}>
      {/* article gives screen readers proper document structure for list items */}
      <article aria-label={ad.title}>
        <Card
          tabIndex={useDeclarativeLink ? undefined : 0}
          role={useDeclarativeLink ? undefined : "button"}
          className={cn(
            "overflow-hidden transition-all group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            className
          )}
          onClick={useDeclarativeLink ? undefined : handleCardClick}
          onKeyDown={
            useDeclarativeLink
              ? undefined
              : (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleCardClick();
                  }
                }
          }
        >
          {children}
        </Card>
      </article>
    </AdCardLinkWrapper>
  );
});

AdCardShell.displayName = "AdCardShell";
