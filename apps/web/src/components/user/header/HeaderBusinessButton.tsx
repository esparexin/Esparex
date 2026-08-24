"use client";

import { Building2, LayoutDashboard } from "@/icons/IconRegistry";
import { Button } from "@esparex/ui";
import type { UserPage } from "@/lib/routeUtils";

interface HeaderBusinessButtonProps {
  isBusinessLive: boolean;
  shouldShowPendingReview: boolean;
  canRegister: boolean;
  businessStatus: string;
  onNavigate: (page: UserPage) => void;
}

export function HeaderBusinessButton({
  isBusinessLive,
  shouldShowPendingReview,
  canRegister,
  businessStatus,
  onNavigate,
}: HeaderBusinessButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={`hidden md:flex gap-2 ${
        isBusinessLive ? "text-primary font-semibold" : "text-muted-foreground"
      } hover:text-foreground cursor-pointer`}
      onClick={() => {
        if (isBusinessLive || shouldShowPendingReview || !canRegister) {
          onNavigate("business-entry");
        } else {
          onNavigate("business-register");
        }
      }}
    >
      {isBusinessLive ? (
        <>
          <LayoutDashboard className="h-4 w-4" />
          <span className="hidden xl:inline">Business Hub</span>
        </>
      ) : shouldShowPendingReview ? (
        <>
          <Building2 className="h-4 w-4 text-amber-500" />
          <span className="hidden xl:inline text-amber-600">Pending Review</span>
        </>
      ) : businessStatus === "rejected" ? (
        <>
          <Building2 className="h-4 w-4 text-destructive" />
          <span className="hidden xl:inline text-destructive">Fix Application</span>
        </>
      ) : (
        <>
          <Building2 className="h-4 w-4" />
          <span className="hidden xl:inline">Register Business</span>
        </>
      )}
    </Button>
  );
}
