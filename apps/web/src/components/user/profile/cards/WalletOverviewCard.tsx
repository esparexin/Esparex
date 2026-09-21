import React from 'react';
import type { WalletSummaryDTO } from '@esparex/contracts';
import { Package, Bell, Zap, Card, CardContent, ArrowRight } from '@esparex/ui';
import type { PlanCard } from '../tabs/BuyPlansSection';

export interface WalletOverviewCardProps {
  wallet: WalletSummaryDTO;
  plans?: PlanCard[];
  onNavigateToHistory?: (filterType?: string) => void;
  onBrowsePlans?: () => void;
}

export const WalletOverviewCard: React.FC<WalletOverviewCardProps> = ({
  wallet,
  plans = [],
  onNavigateToHistory,
  onBrowsePlans,
}) => {
  const totalAdCredits = (wallet.monthlyFreeAdsRemaining ?? 0) + (wallet.paidAdCredits ?? 0);
  const totalBoostCredits = (wallet.spotlightCredits ?? 0) + (wallet.topAdCredits ?? 0);
  const totalAlertSlots = wallet.smartAlertSlots ?? 0;

  const getAvailableCreditsForPlan = (plan: PlanCard): number => {
    const typeLower = plan.type.toLowerCase();
    if (typeLower.includes('more ads') || typeLower.includes('ad_pack') || typeLower.includes('free')) {
      return totalAdCredits;
    }
    if (typeLower.includes('spotlight')) {
      return wallet.spotlightCredits ?? 0;
    }
    if (typeLower.includes('top ad') || typeLower.includes('boost')) {
      return wallet.topAdCredits ?? 0;
    }
    if (typeLower.includes('alert')) {
      return totalAlertSlots;
    }
    return 0;
  };

  return (
    <Card className="rounded-2xl border border-border bg-card shadow-xs">
      <CardContent className="p-3.5 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h4 className="text-caption font-bold text-muted-foreground uppercase tracking-wider">
              Ad Credits & Allowances
            </h4>
            <p className="text-tiny text-muted-foreground">Active posting quotas, alert monitors, and boost credits</p>
          </div>
          {onNavigateToHistory && (
            <button
              type="button"
              onClick={() => onNavigateToHistory()}
              className="text-tiny font-semibold text-primary hover:underline cursor-pointer flex items-center gap-1 self-start sm:self-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-1"
            >
              View Credit History <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* 3 Main Allowance Summary Cards */}
        <div className="flex flex-col md:flex-row gap-3.5 *:flex-1">
          {/* Card 1: Ad Postings */}
          <div className="bg-muted/50 rounded-xl p-3.5 border border-border flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                  <Package className="w-4 h-4 shrink-0" />
                </div>
                <span className="text-small font-bold text-foreground">Ad Postings</span>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToHistory?.('MORE_ADS')}
                className="text-tiny font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                title="View Ad Posting Credit History"
              >
                {totalAdCredits} Available
              </button>
            </div>
            <div className="flex items-baseline justify-between text-tiny text-muted-foreground pt-2 border-t border-border">
              <span>Free Monthly: <strong className="text-foreground">{wallet.monthlyFreeAdsRemaining ?? 0}</strong> / {wallet.monthlyFreeAdsTotal ?? 0}</span>
              <span>Extra Paid: <strong className="text-foreground">{wallet.paidAdCredits ?? 0}</strong></span>
            </div>
            {wallet.nextMonthlyResetDate && (
              <div className="text-tiny text-muted-foreground flex items-center justify-between pt-0.5">
                <span>Monthly reset:</span>
                <span className="font-semibold text-foreground">
                  {new Date(wallet.nextMonthlyResetDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            )}
          </div>

          {/* Card 2: Smart Alerts */}
          <div className="bg-muted/50 rounded-xl p-3.5 border border-border flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Bell className="w-4 h-4 shrink-0" />
                </div>
                <span className="text-small font-bold text-foreground">Smart Alerts</span>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToHistory?.('SMART_ALERTS')}
                className="text-tiny font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                title="View Smart Alert Activity"
              >
                {totalAlertSlots} Active
              </button>
            </div>
            <div className="text-tiny text-muted-foreground pt-2 border-t border-border">
              Instant match notifications for buyer requests
            </div>
          </div>

          {/* Card 3: Listing Boosts */}
          <div className="bg-muted/50 rounded-xl p-3.5 border border-border flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Zap className="w-4 h-4 shrink-0" />
                </div>
                <span className="text-small font-bold text-foreground">Listing Boosts</span>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToHistory?.('BOOSTS')}
                className="text-tiny font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                title="View Listing Boost History"
              >
                {totalBoostCredits} Credits
              </button>
            </div>
            <div className="flex items-baseline justify-between text-tiny text-muted-foreground pt-2 border-t border-border">
              <span>Spotlight: <strong className="text-foreground">{wallet.spotlightCredits ?? 0}</strong></span>
              <span>Top Ad: <strong className="text-foreground">{wallet.topAdCredits ?? 0}</strong></span>
            </div>
          </div>
        </div>

        {/* Plan Credit Inventory: All Available Plans with Included Credits & User Balance */}
        {plans.length > 0 && (
          <div className="pt-2 space-y-2 border-t border-border/60">
            <div className="flex items-center justify-between">
              <span className="text-tiny font-bold text-muted-foreground uppercase tracking-wider">
                Platform Plans & Included Credits
              </span>
              {onBrowsePlans && (
                <button
                  type="button"
                  onClick={onBrowsePlans}
                  className="text-tiny font-medium text-primary hover:underline cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-1"
                >
                  Explore All Plans →
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {plans.map((plan) => {
                const available = getAvailableCreditsForPlan(plan);
                return (
                  <div
                    key={plan.id}
                    className="p-3 rounded-xl border border-border/60 bg-muted/30 flex flex-col justify-between gap-2"
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="min-w-0">
                        <div className="text-caption font-bold text-foreground truncate" title={plan.name}>
                          {plan.name}
                        </div>
                        <div className="text-tiny text-muted-foreground">
                          {plan.type} • {plan.duration}
                        </div>
                      </div>
                      <span className="text-tiny font-bold text-foreground shrink-0">
                        ₹{plan.price}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1.5 border-t border-border/40">
                      <span className="text-tiny text-muted-foreground">Your Balance:</span>
                      <button
                        type="button"
                        onClick={() => onNavigateToHistory?.(plan.type)}
                        className={`text-tiny font-bold px-1.5 py-0.5 rounded cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                          available > 0
                            ? 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20'
                            : 'bg-muted text-muted-foreground border border-border/40 hover:bg-muted/80'
                        }`}
                        title="Click to view history"
                      >
                        {available} Available
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
