import React, { useState } from 'react';
import type { CreditPackDTO } from '@esparex/contracts';
import { getEntitlementPresentationMeta, formatPlanName } from '@esparex/shared';
import { Package } from '@/icons/IconRegistry';

interface CreditPackListCardProps {
  creditPacks: CreditPackDTO[];
}

export const CreditPackListCard: React.FC<CreditPackListCardProps> = ({ creditPacks }) => {
  const [showAll, setShowAll] = useState(false);

  if (!creditPacks || creditPacks.length === 0) {
    return (
      <div className="bg-surface rounded-xl p-4 sm:p-5 border border-border/60 shadow-2xs text-center flex flex-col gap-1.5">
        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground mb-1">
          <Package className="w-4 h-4" />
        </div>
        <h4 className="text-xs sm:text-sm font-bold text-foreground">No Credit Packs Purchased Yet</h4>
        <p className="text-2xs sm:text-xs text-muted-foreground max-w-sm mx-auto">
          When you buy extra ad posting packs or alert slots, your itemized packs and usage progress will display here.
        </p>
      </div>
    );
  }

  // Separate active usable packs vs exhausted/expired history
  const activePacks = creditPacks.filter((p) => p.status === 'ACTIVE' && p.remaining > 0);
  const historyPacks = creditPacks.filter((p) => p.status !== 'ACTIVE' || p.remaining === 0);

  const displayedPacks = showAll ? creditPacks : activePacks.length > 0 ? activePacks : creditPacks.slice(0, 3);
  const hasMore = creditPacks.length > displayedPacks.length;

  return (
    <div className="bg-surface rounded-xl p-3.5 sm:p-4 border border-border/60 shadow-2xs">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
          <Package className="w-4 h-4 text-primary shrink-0" />
          My Credit Packs ({creditPacks.length})
        </h4>
        {historyPacks.length > 0 && !showAll && (
          <span className="text-2xs font-semibold text-muted-foreground">
            {activePacks.length} Active • {historyPacks.length} Past
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        {displayedPacks.map((pack) => {
          const meta = getEntitlementPresentationMeta(pack.entitlementType);
          const displayName = pack.planName ? formatPlanName(pack.planName) : meta.label;
          const isExhausted = pack.status === 'EXHAUSTED' || pack.remaining === 0;
          const isExpired = pack.status === 'EXPIRED';

          const isExpiringSoon = pack.expiresAt
            ? new Date(pack.expiresAt).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000
            : false;

          const total = pack.totalGranted || 1;
          const used = pack.consumed || 0;
          const pct = Math.min(100, Math.round((used / total) * 100));

          return (
            <div
              key={pack.packId}
              className={`p-3 rounded-xl border text-xs space-y-2 transition-all ${
                isExhausted || isExpired
                  ? 'bg-muted/30 border-border/30 opacity-80'
                  : 'bg-background border-border/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">{displayName}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground">
                    {meta.label}
                  </span>
                  {isExhausted ? (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      Used Up
                    </span>
                  ) : isExpired ? (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-destructive/10 text-destructive">
                      Expired
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      Active
                    </span>
                  )}
                </div>

                <div className="text-right font-black text-primary text-xs sm:text-sm">
                  {pack.remaining} Available
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-muted/60 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    isExhausted
                      ? 'bg-amber-500/60'
                      : isExpired
                      ? 'bg-destructive/60'
                      : 'bg-gradient-to-r from-primary via-emerald-500 to-teal-400'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-2xs text-muted-foreground">
                <span>Granted: <strong className="text-foreground">{pack.totalGranted}</strong> • Used: <strong className="text-foreground">{pack.consumed}</strong></span>
                <span className="font-semibold text-primary">
                  {pack.expiresAt ? (
                    <span className={isExpiringSoon ? 'text-amber-500' : ''}>
                      Valid until {new Date(pack.expiresAt).toLocaleDateString()}
                    </span>
                  ) : (
                    <span>
                      30-Day Plan Validity
                    </span>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full mt-3 py-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors text-center cursor-pointer"
        >
          {showAll ? 'Show Only Active Credit Packs' : `Show All ${creditPacks.length} Credit Packs & History`}
        </button>
      )}
    </div>
  );
};
