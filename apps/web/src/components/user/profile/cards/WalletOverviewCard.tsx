import React from 'react';
import type { WalletSummaryDTO } from '@esparex/contracts';

interface WalletOverviewCardProps {
  wallet: WalletSummaryDTO;
}

export const WalletOverviewCard: React.FC<WalletOverviewCardProps> = ({ wallet }) => {
  return (
    <div className="bg-surface rounded-xl p-5 border border-border/60 shadow-sm">
      <h4 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-primary" />
        Available Benefits & Balances
      </h4>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Tile 1: Free Ads */}
        <div className="bg-background rounded-lg p-3 border border-border/40 flex flex-col justify-between">
          <span className="text-xs font-medium text-muted-foreground">Monthly Free Ads</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-foreground">{wallet.monthlyFreeAdsRemaining}</span>
            <span className="text-xs text-muted-foreground">/ {wallet.monthlyFreeAdsTotal}</span>
          </div>
          {wallet.nextMonthlyResetDate && (
            <span className="text-[10px] text-muted-foreground mt-1">
              Resets {new Date(wallet.nextMonthlyResetDate).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Tile 2: Paid Ad Credits */}
        <div className="bg-background rounded-lg p-3 border border-border/40 flex flex-col justify-between">
          <span className="text-xs font-medium text-muted-foreground">Paid Ad Credits</span>
          <div className="mt-2">
            <span className="text-2xl font-black text-primary">{wallet.paidAdCredits}</span>
          </div>
          <span className="text-[10px] text-muted-foreground mt-1">Never expire</span>
        </div>

        {/* Tile 3: Spotlight Credits */}
        <div className="bg-background rounded-lg p-3 border border-border/40 flex flex-col justify-between">
          <span className="text-xs font-medium text-muted-foreground">Spotlight Credits</span>
          <div className="mt-2">
            <span className="text-2xl font-black text-amber-500">{wallet.spotlightCredits}</span>
          </div>
          <span className="text-[10px] text-muted-foreground mt-1">7-Day Top Spotlight</span>
        </div>

        {/* Tile 4: Top Ad Bumps */}
        <div className="bg-background rounded-lg p-3 border border-border/40 flex flex-col justify-between">
          <span className="text-xs font-medium text-muted-foreground">Top Ad Bumps</span>
          <div className="mt-2">
            <span className="text-2xl font-black text-blue-500">{wallet.topAdCredits}</span>
          </div>
          <span className="text-[10px] text-muted-foreground mt-1">Instant Push To Top</span>
        </div>
      </div>
    </div>
  );
};
