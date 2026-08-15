import React from 'react';
import type { WalletSummaryDTO } from '@esparex/contracts';
import { Package, Bell, Zap } from '@/icons/IconRegistry';
import { Card, CardContent } from '@esparex/ui';

interface WalletOverviewCardProps {
  wallet: WalletSummaryDTO;
}

export const WalletOverviewCard: React.FC<WalletOverviewCardProps> = ({ wallet }) => {
  return (
    <Card className="rounded-2xl border border-slate-200/80 bg-white shadow-xs">
      <CardContent className="p-3.5 sm:p-5 space-y-3.5 sm:space-y-4">
        <h4 className="text-caption font-bold text-muted-foreground uppercase tracking-wider">
          Ad Credits & Allowances
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {/* Group 1: Ad Postings */}
          <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/70 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                  <Package className="w-4 h-4 shrink-0" />
                </div>
                <span className="text-small font-bold text-foreground">Ad Postings</span>
              </div>
              <span className="text-tiny font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {wallet.monthlyFreeAdsRemaining + wallet.paidAdCredits} Available
              </span>
            </div>
            <div className="flex items-baseline justify-between text-tiny text-muted-foreground pt-2 border-t border-slate-200/60">
              <span>Free Monthly: <strong className="text-foreground">{wallet.monthlyFreeAdsRemaining}</strong> / {wallet.monthlyFreeAdsTotal}</span>
              <span>Extra Paid: <strong className="text-foreground">{wallet.paidAdCredits}</strong></span>
            </div>
          </div>

          {/* Group 2: Smart Alerts */}
          <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/70 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <Bell className="w-4 h-4 shrink-0" />
                </div>
                <span className="text-small font-bold text-foreground">Smart Alerts</span>
              </div>
              <span className="text-tiny font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                {wallet.smartAlertSlots ?? 0} Active
              </span>
            </div>
            <div className="text-tiny text-muted-foreground pt-2 border-t border-slate-200/60">
              Instant match notifications for buyer requests
            </div>
          </div>

          {/* Group 3: Listing Boosts */}
          <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/70 flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
                  <Zap className="w-4 h-4 shrink-0" />
                </div>
                <span className="text-small font-bold text-foreground">Listing Boosts</span>
              </div>
              <span className="text-tiny font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                {wallet.spotlightCredits + wallet.topAdCredits} Credits
              </span>
            </div>
            <div className="flex items-baseline justify-between text-tiny text-muted-foreground pt-2 border-t border-slate-200/60">
              <span>Spotlight: <strong className="text-foreground">{wallet.spotlightCredits}</strong></span>
              <span>Top Ad: <strong className="text-foreground">{wallet.topAdCredits}</strong></span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
