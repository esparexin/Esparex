import React, { useState } from 'react';
import type { CreditPackDTO } from '@esparex/contracts';

interface CreditPackListCardProps {
  creditPacks: CreditPackDTO[];
}

export const CreditPackListCard: React.FC<CreditPackListCardProps> = ({ creditPacks }) => {
  const [showAll, setShowAll] = useState(false);

  if (!creditPacks || creditPacks.length === 0) {
    return (
      <div className="bg-surface rounded-xl p-5 border border-border/60 shadow-sm text-center">
        <h4 className="text-sm font-bold text-foreground mb-1">No Active Credit Packs</h4>
        <p className="text-xs text-muted-foreground">
          Purchased ad credit packs and promotional top-ups will appear here with individual expiry dates.
        </p>
      </div>
    );
  }

  const displayedPacks = showAll ? creditPacks : creditPacks.slice(0, 3);
  const hasMore = creditPacks.length > 3;

  return (
    <div className="bg-surface rounded-xl p-5 border border-border/60 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">
          Itemized Credit Packs ({creditPacks.length})
        </h4>
      </div>

      <div className="space-y-2.5">
        {displayedPacks.map((pack) => {
          const isExpiringSoon = pack.expiresAt
            ? new Date(pack.expiresAt).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000
            : false;

          return (
            <div
              key={pack.packId}
              className="flex items-center justify-between p-3 rounded-lg bg-background border border-border/40 text-sm"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-foreground">{pack.entitlementType.replace('_', ' ')}</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground uppercase">
                    {pack.sourceType.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Granted: {pack.totalGranted} | Used: {pack.consumed}
                </div>
              </div>

              <div className="text-right">
                <div className="font-black text-primary text-base">{pack.remaining} left</div>
                <div className="text-[11px] text-muted-foreground">
                  {pack.expiresAt ? (
                    <span className={isExpiringSoon ? 'text-amber-500 font-medium' : ''}>
                      Expires {new Date(pack.expiresAt).toLocaleDateString()}
                    </span>
                  ) : (
                    <span className="text-emerald-500 font-medium">Never expires</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full mt-3 py-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors text-center"
        >
          {showAll ? 'Show Fewer Packs' : `Show All ${creditPacks.length} Credit Packs`}
        </button>
      )}
    </div>
  );
};
