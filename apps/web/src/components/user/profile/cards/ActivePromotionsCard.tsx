import React from 'react';
import type { PromotionDTO } from '@esparex/contracts';
import { Zap } from '@/icons/IconRegistry';
import { Card, CardContent } from '@esparex/ui';

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
      <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-xs text-center">
        <CardContent className="p-6 sm:p-8 space-y-2">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto text-amber-600 mb-1">
            <Zap className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">No Boosted Ads Right Now</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            When you boost an ad with Spotlight or Top Ad credits, your boosted listings and active dates will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-xs">
      <CardContent className="p-3.5 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-caption font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Boosted Ads ({uniquePromotions.length})</span>
          </h4>
        </div>

        <div className="space-y-2">
          {uniquePromotions.map((promo) => {
            const daysLeft = promo.daysRemaining ?? 0;
            const isExpired = daysLeft <= 0;

            return (
              <div
                key={promo.promotionId}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-50/80 border border-slate-200/70 text-caption"
              >
                <div>
                  <div className="font-bold text-foreground">{promo.entityTitle || 'Boosted Listing'}</div>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded text-tiny font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wide">
                      {promo.type.replace('_', ' ')} BOOST
                    </span>
                    <span className="text-tiny text-muted-foreground">
                      Applied {new Date(promo.startsAt).toLocaleDateString()} • Valid until {new Date(promo.endsAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="self-start sm:self-auto text-right">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-tiny font-semibold ${
                      isExpired
                        ? 'bg-slate-100 text-muted-foreground'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {isExpired ? 'EXPIRED' : `ACTIVE • ${daysLeft} days left`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
