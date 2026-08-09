import React, { useState } from 'react';
import type { CreditPackDTO } from '@esparex/contracts';
import { Package } from '@/icons/IconRegistry';

interface CreditPackListCardProps {
  creditPacks: CreditPackDTO[];
}

export const CreditPackListCard: React.FC<CreditPackListCardProps> = ({ creditPacks }) => {
  const [showAll, setShowAll] = useState(false);

  if (!creditPacks || creditPacks.length === 0) {
    return (
      <div className="bg-surface rounded-xl p-4 sm:p-5 border border-border/60 shadow-2xs text-center space-y-1.5">
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

  const displayedPacks = showAll ? creditPacks : creditPacks.slice(0, 3);
  const hasMore = creditPacks.length > 3;

  return (
    <div className="bg-surface rounded-xl p-3.5 sm:p-4 border border-border/60 shadow-2xs">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
          <Package className="w-4 h-4 text-primary shrink-0" />
          My Credit Packs ({creditPacks.length})
        </h4>
      </div>

      <div className="space-y-2.5">
        {displayedPacks.map((pack) => {
          const isExpiringSoon = pack.expiresAt
            ? new Date(pack.expiresAt).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000
            : false;

          const total = pack.totalGranted || 1;
          const used = pack.consumed || 0;
          const pct = Math.min(100, Math.round((used / total) * 100));

          return (
            <div
              key={pack.packId}
              className="p-3 rounded-xl bg-background border border-border/40 text-xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">{pack.entitlementType.replace('_', ' ')}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground uppercase">
                    {pack.sourceType.replace('_', ' ')}
                  </span>
                </div>

                <div className="text-right font-black text-primary text-xs sm:text-sm">
                  {pack.remaining} Available
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>

              <div className="flex items-center justify-between text-2xs text-muted-foreground">
                <span>Granted: <strong className="text-foreground">{pack.totalGranted}</strong> • Used: <strong className="text-foreground">{pack.consumed}</strong></span>
                <span>
                  {pack.expiresAt ? (
                    <span className={isExpiringSoon ? 'text-amber-500 font-medium' : ''}>
                      Expires {new Date(pack.expiresAt).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-emerald-500 font-medium">Never expires</span>
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
          {showAll ? 'Show Fewer Packs' : `Show All ${creditPacks.length} Credit Packs`}
        </button>
      )}
    </div>
  );
};
