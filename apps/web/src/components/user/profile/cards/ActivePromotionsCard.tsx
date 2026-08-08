import React from 'react';
import type { PromotionDTO } from '@esparex/contracts';

interface ActivePromotionsCardProps {
  promotions: PromotionDTO[];
}

export const ActivePromotionsCard: React.FC<ActivePromotionsCardProps> = ({ promotions }) => {
  if (!promotions || promotions.length === 0) {
    return (
      <div className="bg-surface rounded-xl p-5 border border-border/60 shadow-sm text-center">
        <h4 className="text-sm font-bold text-foreground mb-1">No Active Promotions</h4>
        <p className="text-xs text-muted-foreground">
          Listings boosted with Spotlight or Push To Top will display live countdown timers here.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl p-5 border border-border/60 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">
          Active Listing Promotions ({promotions.length})
        </h4>
      </div>

      <div className="space-y-2.5">
        {promotions.map((promo) => (
          <div
            key={promo.promotionId}
            className="flex items-center justify-between p-3 rounded-lg bg-background border border-border/40 text-sm"
          >
            <div>
              <div className="font-bold text-foreground">{promo.entityTitle || 'Promoted Listing'}</div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 uppercase tracking-wide">
                  {promo.type.replace('_', ' ')}
                </span>
                <span className="text-xs text-muted-foreground">
                  Ends {new Date(promo.endsAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                {promo.daysRemaining ?? 0} days remaining
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
