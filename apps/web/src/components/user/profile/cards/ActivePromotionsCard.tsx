import React from 'react';
import type { PromotionDTO } from '@esparex/contracts';
import { Zap } from '@/icons/IconRegistry';

interface ActivePromotionsCardProps {
  promotions: PromotionDTO[];
}

export const ActivePromotionsCard: React.FC<ActivePromotionsCardProps> = ({ promotions }) => {
  const uniquePromotions = React.useMemo(() => {
    const seen = new Set<string>();
    return (promotions || []).filter((promo) => {
      const key = promo.entityId || promo.entityTitle || promo.promotionId;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [promotions]);

  if (!uniquePromotions || uniquePromotions.length === 0) {
    return (
      <div className="bg-surface rounded-xl p-4 sm:p-5 border border-border/60 shadow-2xs text-center space-y-1.5">
        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground mb-1">
          <Zap className="w-4 h-4" />
        </div>
        <h4 className="text-xs sm:text-sm font-bold text-foreground">No Boosted Ads Right Now</h4>
        <p className="text-2xs sm:text-xs text-muted-foreground max-w-sm mx-auto">
          When you boost an ad with Spotlight or Top Ad credits, your boosted listings and valid dates will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl p-3.5 sm:p-4 border border-border/60 shadow-2xs">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500 shrink-0" />
          Boosted Ads ({uniquePromotions.length})
        </h4>
      </div>

      <div className="space-y-2">
        {uniquePromotions.map((promo) => {
          const daysLeft = promo.daysRemaining ?? 0;
          const isExpired = daysLeft <= 0;

          return (
            <div
              key={promo.promotionId}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-background border border-border/40 text-xs"
            >
              <div>
                <div className="font-bold text-foreground">{promo.entityTitle || 'Boosted Listing'}</div>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                    {promo.type.replace('_', ' ')} BOOST
                  </span>
                  <span className="text-2xs text-muted-foreground">
                    Applied {new Date(promo.startsAt).toLocaleDateString()} • 7-Day Boost Duration • Valid until {new Date(promo.endsAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="self-start sm:self-auto text-right">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-2xs font-extrabold ${
                    isExpired
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {isExpired ? 'EXPIRED' : `ACTIVE • ${daysLeft} days left`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
