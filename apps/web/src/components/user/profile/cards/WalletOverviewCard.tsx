import React from 'react';
import type { WalletSummaryDTO } from '@esparex/contracts';
import { Package, Bell, Zap } from '@/icons/IconRegistry';

interface WalletOverviewCardProps {
  wallet: WalletSummaryDTO;
}

export const WalletOverviewCard: React.FC<WalletOverviewCardProps> = ({ wallet }) => {
  return (
    <div className="bg-surface rounded-xl p-3.5 sm:p-4 border border-border/60 shadow-2xs">
      <h4 className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-wider mb-2.5 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
        AD CREDITS
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3">
        {/* Group 1: Ad Postings */}
        <div className="bg-background rounded-xl p-3 border border-border/40 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs font-bold text-foreground">Ad Postings</span>
            </div>
            <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {wallet.monthlyFreeAdsRemaining + wallet.paidAdCredits} Available
            </span>
          </div>
          <div className="flex items-baseline justify-between text-2xs text-muted-foreground pt-1 border-t border-border/20">
            <span>Free Monthly: <strong className="text-foreground">{wallet.monthlyFreeAdsRemaining}</strong> / {wallet.monthlyFreeAdsTotal}</span>
            <span>Extra Paid: <strong className="text-foreground">{wallet.paidAdCredits}</strong></span>
          </div>
        </div>

        {/* Group 2: Smart Alerts */}
        <div className="bg-background rounded-xl p-3 border border-border/40 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="text-xs font-bold text-foreground">Smart Alerts</span>
            </div>
            <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              {wallet.smartAlertSlots ?? 0} Active
            </span>
          </div>
          <div className="text-2xs text-muted-foreground pt-1 border-t border-border/20">
            Instant match notifications for buyer requests
          </div>
        </div>

        {/* Group 3: Listing Boosts */}
        <div className="bg-background rounded-xl p-3 border border-border/40 flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="text-xs font-bold text-foreground">Listing Boosts</span>
            </div>
            <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
              {wallet.spotlightCredits + wallet.topAdCredits} Credits
            </span>
          </div>
          <div className="flex items-baseline justify-between text-2xs text-muted-foreground pt-1 border-t border-border/20">
            <span>Spotlight: <strong className="text-foreground">{wallet.spotlightCredits}</strong></span>
            <span>Top Ad: <strong className="text-foreground">{wallet.topAdCredits}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
