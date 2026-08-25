"use client";

import { AlertCircle, ArrowRight } from "@/icons/IconRegistry";
import { Button } from "@esparex/ui";
import type { SingleEntitlementState } from "@esparex/contracts";

interface EntitlementExhaustedShellProps {
  moduleTitle: string;
  entitlement: SingleEntitlementState;
  onPrimaryAction: () => void;
  onClose: () => void;
}

export function EntitlementExhaustedShell({
  moduleTitle,
  entitlement,
  onPrimaryAction,
  onClose,
}: EntitlementExhaustedShellProps) {
  const isAdPackAction = entitlement.action === "BUY_AD_PACK";
  const primaryButtonLabel = isAdPackAction ? "Buy Ad Pack Credits" : "Upgrade Business Plan";

  return (
    <div className="p-6 text-center space-y-6 max-w-md mx-auto my-auto">
      <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200/80 flex items-center justify-center mx-auto text-amber-600 shadow-xs">
        <AlertCircle className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h3 className="text-h3 font-bold text-foreground tracking-tight">
          {moduleTitle} Limit Reached
        </h3>
        <p className="text-body text-foreground-secondary leading-relaxed">
          {isAdPackAction
            ? "You have used all your available free ad posting slots for this month."
            : "You have reached the maximum active inventory limit allowed on your current plan."}
        </p>
      </div>

      <div className="p-4 bg-muted/40 border border-border rounded-2xl space-y-2.5 text-left text-caption text-foreground-secondary">
        <div className="flex justify-between items-center">
          <span>Monthly Free Slots</span>
          <strong className="font-semibold text-foreground">
            {entitlement.used} / {entitlement.limit} Used
          </strong>
        </div>
        {typeof entitlement.paidCredits === "number" && (
          <div className="flex justify-between items-center pt-1 border-t border-border/60">
            <span>Purchased Credits Available</span>
            <strong className="font-semibold text-foreground">{entitlement.paidCredits} Credits</strong>
          </div>
        )}
        {entitlement.resetDate && (
          <div className="flex justify-between items-center pt-1 border-t border-border/60 text-foreground-tertiary">
            <span>Monthly Reset Date</span>
            <span>{new Date(entitlement.resetDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
          </div>
        )}
      </div>

      <div className="space-y-3 pt-2">
        <Button
          type="button"
          onClick={onPrimaryAction}
          className="w-full h-12 rounded-xl text-body font-semibold bg-primary hover:bg-primary/90 active:bg-primary/95 text-primary-foreground shadow-md shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>{primaryButtonLabel}</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2 text-caption font-semibold text-foreground-tertiary hover:text-foreground transition-colors cursor-pointer"
        >
          Cancel & Close
        </button>
      </div>
    </div>
  );
}
