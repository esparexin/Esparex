import React from 'react';
import type { CreditPackDTO } from '@esparex/contracts';
import { formatPlanName } from '@esparex/shared';
import { Calendar, Clock } from "@esparex/ui";

interface CreditPoolBatchListProps {
  batches: CreditPackDTO[];
}

export const CreditPoolBatchList: React.FC<CreditPoolBatchListProps> = ({ batches }) => {
  return (
    <div className="mt-2.5 space-y-2 bg-muted/20 p-2.5 rounded-xl border border-border/30">
      {batches.map((batch, idx) => {
        const isBatchExpired =
          batch.status === 'EXPIRED' ||
          Boolean(batch.expiresAt && new Date(batch.expiresAt).getTime() < Date.now());
        const isBatchExhausted = batch.status === 'EXHAUSTED' || batch.remaining === 0;
        const daysLeft = batch.expiresAt
          ? Math.max(0, Math.ceil((new Date(batch.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
          : null;

        return (
          <div
            key={batch.packId || idx}
            className="p-2.5 rounded-xl bg-card border border-border/40 space-y-1.5 shadow-2xs"
          >
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-bold text-foreground text-caption truncate">
                  {batch.planName ? formatPlanName(batch.planName) : `Purchase Batch #${idx + 1}`}
                </span>
                {isBatchExpired ? (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-tiny font-bold bg-destructive/10 text-destructive border border-destructive/20">
                    Expired
                  </span>
                ) : isBatchExhausted ? (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-tiny font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    Used
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-tiny font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Active
                  </span>
                )}
              </div>

              <span className="font-bold text-caption text-primary shrink-0">
                {batch.remaining} / {batch.totalGranted} available
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-tiny text-muted-foreground pt-1 border-t border-border/20">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-muted-foreground/70 shrink-0" />
                Purchased: <strong className="text-foreground-secondary">{new Date(batch.purchaseDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
              </span>

              {batch.expiresAt && (
                <span className={`flex items-center gap-1 ${isBatchExpired ? 'text-destructive font-semibold' : daysLeft !== null && daysLeft <= 7 ? 'text-amber-600 dark:text-amber-400 font-semibold' : ''}`}>
                  <Clock className="w-3 h-3 shrink-0" />
                  {isBatchExpired ? (
                    `Expired on ${new Date(batch.expiresAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`
                  ) : (
                    `Valid until ${new Date(batch.expiresAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} (${daysLeft}d left)`
                  )}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
