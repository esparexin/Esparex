import React from 'react';
import type { WalletSummaryDTO } from '@esparex/contracts';
import { Package, Bell, Zap } from '@/icons/IconRegistry';

interface WalletOverviewCardProps {
  wallet: WalletSummaryDTO;
}

export const WalletOverviewCard: React.FC<WalletOverviewCardProps> = ({ wallet }) => {
  return (
    <div className="bg-surface rounded-2xl p-4 sm:p-5 border border-border/60 shadow-2xs">
      <h4 className="text-xs sm:text-sm font-black text-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        AD CREDITS
      </h4>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {/* Group 1: Ad Postings */}
        <div className="bg-background rounded-xl p-3.5 border border-border/40 border-t-2 border-t-primary flex flex-col justify-between space-y-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                <Package className="w-4 h-4 shrink-0" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-foreground">Ad Postings</span>
            </div>
            <span className="text-2xs font-extrabold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              {wallet.monthlyFreeAdsRemaining + wallet.paidAdCredits} Available
            </span>
          </div>
          <div className="flex items-baseline justify-between text-2xs text-muted-foreground pt-2 border-t border-border/20">
            <span>Free Monthly: <strong className="text-foreground">{wallet.monthlyFreeAdsRemaining}</strong> / {wallet.monthlyFreeAdsTotal}</span>
            <span>Extra Paid: <strong className="text-foreground">{wallet.paidAdCredits}</strong></span>
          </div>
        </div>

        {/* Group 2: Smart Alerts */}
        <div className="bg-background rounded-xl p-3.5 border border-border/40 border-t-2 border-t-emerald-500 flex flex-col justify-between space-y-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Bell className="w-4 h-4 shrink-0" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-foreground">Smart Alerts</span>
            </div>
            <span className="text-2xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {wallet.smartAlertSlots ?? 0} Active
            </span>
          </div>
          <div className="text-2xs text-muted-foreground pt-2 border-t border-border/20">
            Instant match notifications for buyer requests
          </div>
        </div>

        {/* Group 3: Listing Boosts */}
        <div className="bg-background rounded-xl p-3.5 border border-border/40 border-t-2 border-t-amber-500 flex flex-col justify-between space-y-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Zap className="w-4 h-4 shrink-0" />
              </div>
              <span className="text-xs sm:text-sm font-bold text-foreground">Listing Boosts</span>
            </div>
            <span className="text-2xs font-extrabold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              {wallet.spotlightCredits + wallet.topAdCredits} Credits
            </span>
          </div>
          <div className="flex items-baseline justify-between text-2xs text-muted-foreground pt-2 border-t border-border/20">
            <span>Spotlight: <strong className="text-foreground">{wallet.spotlightCredits}</strong></span>
            <span>Top Ad: <strong className="text-foreground">{wallet.topAdCredits}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
