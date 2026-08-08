import React, { useState } from 'react';
import { usePlansWalletDashboard } from '@/hooks/usePlansWalletDashboard';
import { ActiveSubscriptionCard } from '../cards/ActiveSubscriptionCard';
import { WalletOverviewCard } from '../cards/WalletOverviewCard';
import { CreditPackListCard } from '../cards/CreditPackListCard';
import { ActivePromotionsCard } from '../cards/ActivePromotionsCard';
import { CreditLedgerHistoryCard } from '../cards/CreditLedgerHistoryCard';
import { trackPlansWalletEvent } from '@/lib/analytics/plansWalletTelemetry';
import type { ProfilePlan } from '../types';

type PlanCard = Omit<ProfilePlan, 'type'> & { type: string };

interface PlansTabProps {
  dynamicPlans: PlanCard[];
  currentPlan: string;
  isError?: boolean;
  setSelectedPlan: (id: string) => void;
  onPlanSelected?: (plan: ProfilePlan) => void;
  setShowPlanDialog?: (show: boolean) => void;
  formatCurrency?: (price: number) => string;
}

type DashboardHubTab = 'OVERVIEW' | 'CREDIT_PACKS' | 'BUY_PLANS';

export const PlansTab: React.FC<PlansTabProps> = ({
  dynamicPlans,
  currentPlan,
  setSelectedPlan,
  onPlanSelected,
  setShowPlanDialog: _setShowPlanDialog,
  formatCurrency: _formatCurrency,
}) => {
  const [activeTab, setActiveTab] = useState<DashboardHubTab>('OVERVIEW');
  const { dashboardData, isLoading, isError, refetch } = usePlansWalletDashboard();

  const handleTabSwitch = (tab: DashboardHubTab) => {
    setActiveTab(tab);
    trackPlansWalletEvent('plans_tab_switched', { tabName: tab });
  };

  return (
    <div className="space-y-6">
      {/* 3-Tab Hub Navigation Header */}
      <div className="border-b border-border/60 pb-3">
        <nav className="flex space-x-2 sm:space-x-4" aria-label="Plans and Wallet Navigation">
          <button
            onClick={() => handleTabSwitch('OVERVIEW')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              activeTab === 'OVERVIEW'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            Subscription & Balances
          </button>

          <button
            onClick={() => handleTabSwitch('CREDIT_PACKS')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              activeTab === 'CREDIT_PACKS'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            Itemized Credit Packs
            {dashboardData?.creditPacks && dashboardData.creditPacks.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-background/20 text-current">
                {dashboardData.creditPacks.length}
              </span>
            )}
          </button>

          <button
            onClick={() => handleTabSwitch('BUY_PLANS')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              activeTab === 'BUY_PLANS'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            Buy Plans & Top-ups
          </button>
        </nav>
      </div>

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="space-y-4 animate-pulse">
          <div className="h-32 bg-muted rounded-xl" />
          <div className="h-40 bg-muted rounded-xl" />
        </div>
      )}

      {/* Error Boundary Banner */}
      {isError && (
        <div role="alert" className="bg-destructive/10 text-destructive p-4 rounded-xl text-sm flex items-center justify-between border border-destructive/20">
          <span>Unable to load live plans and wallet data. Please refresh or try again later.</span>
          <button
            onClick={() => void refetch()}
            className="px-3 py-1 bg-destructive text-destructive-foreground rounded-lg text-xs font-semibold hover:bg-destructive/90 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* TAB 1: OVERVIEW & BALANCES */}
      {activeTab === 'OVERVIEW' && !isLoading && (
        <div className="space-y-6">
          <ActiveSubscriptionCard
            subscription={dashboardData?.subscription || null}
            onBrowsePlans={() => setActiveTab('BUY_PLANS')}
          />

          {dashboardData?.wallet && (
            <WalletOverviewCard wallet={dashboardData.wallet} />
          )}

          <ActivePromotionsCard promotions={dashboardData?.activePromotions || []} />
        </div>
      )}

      {/* TAB 2: ITEMIZED CREDIT PACKS & AUDIT HISTORY */}
      {activeTab === 'CREDIT_PACKS' && !isLoading && (
        <div className="space-y-6">
          <CreditPackListCard creditPacks={dashboardData?.creditPacks || []} />
          <CreditLedgerHistoryCard />
        </div>
      )}

      {/* TAB 3: BUY PLANS & TOP-UPS */}
      {activeTab === 'BUY_PLANS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dynamicPlans.map((plan) => {
              const isCurrent = currentPlan === plan.id;

              return (
                <div
                  key={plan.id}
                  className={`bg-surface rounded-xl p-5 border shadow-sm transition-all flex flex-col justify-between ${
                    isCurrent ? 'border-primary ring-1 ring-primary' : 'border-border/60 hover:border-border'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {plan.type}
                      </span>
                      {isCurrent && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
                          Active
                        </span>
                      )}
                    </div>

                    <h4 className="text-lg font-bold text-foreground">{plan.name}</h4>
                    <div className="mt-2 text-2xl font-black text-foreground">
                      ₹{plan.price.toLocaleString()}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedPlan(plan.id);
                      if (onPlanSelected) {
                        onPlanSelected(plan as ProfilePlan);
                      }
                    }}
                    className={`w-full mt-5 py-2.5 rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      isCurrent
                        ? 'bg-muted text-muted-foreground cursor-default'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                    }`}
                    disabled={isCurrent}
                  >
                    {isCurrent ? 'Current Plan' : 'Purchase Package'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
