import React from 'react';
import type { WalletSummaryDTO } from '@esparex/contracts';

interface WalletOverviewCardProps {
  wallet: WalletSummaryDTO;
}

export const WalletOverviewCard: React.FC<WalletOverviewCardProps> = ({ wallet }) => {
  return (
    <div className="bg-surface rounded-xl p-3.5 sm:p-4 border border-border/60 shadow-2xs">
      <h4 className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-wider mb-2.5 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
        Available Benefits & Balances
      </h4>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {/* Tile 1: Free Ads */}
        <div className="bg-background rounded-lg p-2.5 border border-border/40 flex flex-col justify-between">
          <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground">Monthly Free Ads</span>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-black text-foreground">{wallet.monthlyFreeAdsRemaining}</span>
            <span className="text-2xs text-muted-foreground">/ {wallet.monthlyFreeAdsTotal}</span>
          </div>
          {wallet.nextMonthlyResetDate && (
            <span className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5">
              Resets {new Date(wallet.nextMonthlyResetDate).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Tile 2: More Ads Pack */}
        <div className="bg-background rounded-lg p-2.5 border border-border/40 flex flex-col justify-between">
          <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground">More Ads Pack</span>
          <div className="mt-1">
            <span className="text-xl sm:text-2xl font-black text-primary">{wallet.paidAdCredits}</span>
          </div>
          <span className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5">Never expire</span>
        </div>

        {/* Tile 3: Spotlight Credits */}
        <div className="bg-background rounded-lg p-2.5 border border-border/40 flex flex-col justify-between">
          <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground">Spotlight Credits</span>
          <div className="mt-1">
            <span className="text-xl sm:text-2xl font-black text-amber-500">{wallet.spotlightCredits}</span>
          </div>
          <span className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5">Featured Spotlight Boost</span>
        </div>

        {/* Tile 4: Top Ad Credits */}
        <div className="bg-background rounded-lg p-2.5 border border-border/40 flex flex-col justify-between">
          <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground">Top Ad Credits</span>
          <div className="mt-1">
            <span className="text-xl sm:text-2xl font-black text-blue-500">{wallet.topAdCredits}</span>
          </div>
          <span className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5">Instant Push To Top</span>
        </div>
      </div>
    </div>
  );
};
