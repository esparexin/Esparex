import React from 'react';
import type { CreditPackDTO } from '@esparex/contracts';
import { getEntitlementPresentationMeta, formatPlanName } from '@esparex/shared';
import { AlertCircle, CheckCircle2, Calendar, Clock } from "@esparex/ui";

interface HistoryPackCardProps {
  pack: CreditPackDTO;
}

export const HistoryPackCard: React.FC<HistoryPackCardProps> = ({ pack }) => {
  const meta = getEntitlementPresentationMeta(pack.entitlementType);
  const displayName = pack.planName ? formatPlanName(pack.planName) : meta.label;
  const isExpired = pack.status === 'EXPIRED' || Boolean(pack.expiresAt && new Date(pack.expiresAt).getTime() < Date.now());

  return (
    <div
      key={pack.packId}
      className="p-3.5 rounded-xl border border-border/40 bg-card/60 text-caption space-y-2 shadow-2xs"
    >
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="font-bold text-foreground text-caption sm:text-body">{displayName}</span>
          {isExpired ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-tiny font-bold bg-destructive/10 text-destructive border border-destructive/20">
              <AlertCircle className="w-3 h-3 shrink-0" /> Expired
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-tiny font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <CheckCircle2 className="w-3 h-3 shrink-0" /> Fully Used
            </span>
          )}
        </div>
        <span className="text-tiny font-medium text-muted-foreground">
          0 / {pack.totalGranted} Available
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-tiny text-muted-foreground pt-1.5 border-t border-border/30">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
          <span>Purchased: <strong className="text-foreground-secondary">{new Date(pack.purchaseDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</strong></span>
        </div>

        {pack.expiresAt && (
          <div className={`flex items-center gap-1.5 ${isExpired ? 'text-destructive font-medium' : ''}`}>
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>
              {isExpired ? 'Expired on: ' : 'Ended on: '}
              <strong>{new Date(pack.expiresAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
