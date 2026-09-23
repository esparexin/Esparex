"use client";

import { Button, Card, Building2, CheckCircle2, ArrowRight } from "@esparex/ui";

interface BusinessRegistrationPromoProps {
  onRegister: () => void;
}

export function BusinessRegistrationPromo({ onRegister }: BusinessRegistrationPromoProps) {
  return (
    <Card className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs max-w-2xl">
      {/* Header */}
      <div className="flex items-start gap-3.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Building2 className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h2 className="text-body-lg font-semibold text-foreground tracking-tight">Register your business</h2>
          <p className="text-caption text-foreground-subtle mt-0.5">
            Create a verified business profile to list services and spare parts on Esparex.
          </p>
        </div>
      </div>

      {/* Clean Highlights */}
      <div className="grid gap-2 pt-4 pb-5">
        <div className="flex items-center gap-3 rounded-xl bg-muted/30 px-3.5 py-2.5 border border-border/40">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span className="text-body text-foreground-secondary font-normal">
            Get a verified public business profile customers can trust.
          </span>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-muted/30 px-3.5 py-2.5 border border-border/40">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span className="text-body text-foreground-secondary font-normal">
            Post services and manage business listings from one workspace.
          </span>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-muted/30 px-3.5 py-2.5 border border-border/40">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span className="text-body text-foreground-secondary font-normal">
            Use your real address and review documents once, then keep the profile updated.
          </span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-start pt-1 border-t border-border/40">
        <Button
          onClick={onRegister}
          className="w-full sm:w-auto h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-body px-6 rounded-xl transition-all shadow-xs active:scale-[0.98] cursor-pointer inline-flex items-center justify-center gap-2"
        >
          <span>Start business registration</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
}
