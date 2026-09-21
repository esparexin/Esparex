import React from 'react';
import type { WalletSummaryDTO } from '@esparex/contracts';
import { Package, Bell, Zap, Card, CardContent, ArrowRight } from '@esparex/ui';

export interface WalletOverviewCardProps {
  wallet: WalletSummaryDTO;
  onNavigateToHistory?: (filterType?: string) => void;
}

export const WalletOverviewCard: React.FC<WalletOverviewCardProps> = ({
  wallet,
  onNavigateToHistory,
}) => {
  const totalAdCredits = (wallet.monthlyFreeAdsRemaining ?? 0) + (wallet.paidAdCredits ?? 0);
  const totalBoostCredits = (wallet.spotlightCredits ?? 0) + (wallet.topAdCredits ?? 0);
  const totalAlertSlots = wallet.smartAlertSlots ?? 0;

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
            <div className="flex items-baseline justify-between text-tiny text-muted-foreground pt-2 border-t border-border">
              <span>Base Free: <strong className="text-foreground">2</strong></span>
              <span>Extra Purchased: <strong className="text-foreground">{Math.max(0, totalAlertSlots - 2)}</strong></span>
            </div>
            <div className="text-tiny text-muted-foreground flex items-center justify-between pt-0.5">
              <span>Delivery:</span>
              <span className="font-semibold text-foreground">Instant Push & Email</span>
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
            <div className="text-tiny text-muted-foreground flex items-center justify-between pt-0.5">
              <span>Visibility:</span>
              <span className="font-semibold text-foreground">Featured & Top Search</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
