import React, { useState } from 'react';
import { Button } from '@esparex/ui';
import { usePlansWalletDashboard } from '@/hooks/usePlansWalletDashboard';
import { ActiveSubscriptionCard } from '../cards/ActiveSubscriptionCard';
import { WalletOverviewCard } from '../cards/WalletOverviewCard';
import { CreditLedgerHistoryCard } from '../cards/CreditLedgerHistoryCard';
import { RecentPaymentsCard } from '../cards/RecentPaymentsCard';
import { PlanPurchaseDialog } from '../dialogs/PlanPurchaseDialog';
import { BuyPlansSection, type PlanCard } from './BuyPlansSection';
import { formatPrice } from '@/lib/formatters';
import { trackPlansWalletEvent } from '@/lib/analytics/plansWalletTelemetry';
import type { ProfilePlan } from '../types';

import type { LedgerFilterType } from '../cards/CreditLedgerFormatters';

interface PlansTabProps {
  dynamicPlans: PlanCard[];
  currentPlan: string;
  isError?: boolean;
  setSelectedPlan?: (id: string) => void;
  onPlanSelected?: (plan: ProfilePlan) => void;
  setShowPlanDialog?: (show: boolean) => void;
  formatCurrency?: (price: number) => string;
  initialTab?: DashboardHubTab;
}

type DashboardHubTab = 'OVERVIEW' | 'CREDIT_HISTORY' | 'INVOICES' | 'BUY_PLANS';

export const PlansTab: React.FC<PlansTabProps> = ({
  dynamicPlans,
  currentPlan,
  setSelectedPlan,
  onPlanSelected,
  setShowPlanDialog,
  formatCurrency,
  initialTab = 'OVERVIEW',
}) => {
  const [activeTab, setActiveTab] = useState<DashboardHubTab>(initialTab);
  const [historyFilter, setHistoryFilter] = useState<LedgerFilterType>('ALL');
  const [dialogSelectedPlan, setDialogSelectedPlan] = useState<string | null>(null);
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState<boolean>(false);
  const { dashboardData, isLoading, isError, refetch } = usePlansWalletDashboard();

  const handleTabSwitch = (tab: DashboardHubTab) => {
    setActiveTab(tab);
    trackPlansWalletEvent('plans_tab_switched', { tabName: tab });
  };

  const handleNavigateToHistory = (filterType?: string) => {
    let mapped: LedgerFilterType = 'ALL';
    if (filterType) {
      const lower = filterType.toLowerCase();
      if (lower.includes('more ads') || lower.includes('ad_posting')) mapped = 'MORE_ADS';
      else if (lower.includes('spotlight')) mapped = 'SPOTLIGHT';
      else if (lower.includes('top ad') || lower.includes('boost')) mapped = 'TOP_AD';
      else if (lower.includes('alert')) mapped = 'SMART_ALERT';
    }
    setHistoryFilter(mapped);
    setActiveTab('CREDIT_HISTORY');
    trackPlansWalletEvent('plans_tab_switched', { tabName: 'CREDIT_HISTORY', metadata: { filter: mapped } });
  };

  return (
    <div className="w-full max-w-4xl space-y-6">
      {/* Header Navigation: Simplified 3-Tab Hub for Wallet view */}
      {initialTab !== 'BUY_PLANS' && (
        <div className="bg-muted/80 p-1.5 rounded-2xl border border-border inline-flex space-x-1 mb-2 max-w-full overflow-x-auto">
          <nav className="flex space-x-1 overflow-x-auto scrollbar-none" aria-label="Wallet Navigation" role="tablist">
            <button
              id="tab-overview"
              role="tab"
              aria-selected={activeTab === 'OVERVIEW'}
              aria-controls="panel-overview"
              onClick={() => handleTabSwitch('OVERVIEW')}
              className={`min-h-[44px] h-11 px-4 text-body font-semibold rounded-xl transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer ${
                activeTab === 'OVERVIEW'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-foreground-secondary hover:text-foreground hover:bg-card/50'
              }`}
            >
              Wallet & Balances
            </button>

            <button
              id="tab-credit-history"
              role="tab"
              aria-selected={activeTab === 'CREDIT_HISTORY'}
              aria-controls="panel-credit-history"
              onClick={() => handleTabSwitch('CREDIT_HISTORY')}
              className={`min-h-[44px] h-11 px-4 text-body font-semibold rounded-xl transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer ${
                activeTab === 'CREDIT_HISTORY'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-foreground-secondary hover:text-foreground hover:bg-card/50'
              }`}
            >
              My Usage
            </button>

            <button
              id="tab-invoices"
              role="tab"
              aria-selected={activeTab === 'INVOICES'}
              aria-controls="panel-invoices"
              onClick={() => handleTabSwitch('INVOICES')}
              className={`min-h-[44px] h-11 px-4 text-body font-semibold rounded-xl transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer ${
                activeTab === 'INVOICES'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-foreground-secondary hover:text-foreground hover:bg-card/50'
              }`}
            >
              Invoices
            </button>
          </nav>
        </div>
      )}

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="space-y-4 animate-pulse">
          <div className="h-32 bg-muted rounded-xl" />
          <div className="h-40 bg-muted rounded-xl" />
        </div>
      )}

      {/* Error Boundary Banner */}
      {isError && (
        <div role="alert" className="bg-destructive/10 text-destructive p-4 rounded-xl text-body flex items-center justify-between border border-destructive/20">
          <span>Unable to load live plans and wallet data. Please refresh or try again later.</span>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => void refetch()}
            className="h-8 px-3 rounded-lg text-caption font-semibold cursor-pointer"
          >
            Retry
          </Button>
        </div>
      )}

      {/* TAB 1: CONSOLIDATED PLAN & ALLOWANCES OVERVIEW */}
      {activeTab === 'OVERVIEW' && !isLoading && (
        <div id="panel-overview" role="tabpanel" aria-labelledby="tab-overview" className="flex flex-col gap-3 sm:gap-4">
          <ActiveSubscriptionCard
            subscription={dashboardData?.subscription ?? null}
            nextMonthlyResetDate={dashboardData?.wallet?.nextMonthlyResetDate}
            onBrowsePlans={() => handleTabSwitch('BUY_PLANS')}
          />
          {dashboardData?.wallet && (
            <WalletOverviewCard
              wallet={dashboardData.wallet}
              creditPacks={dashboardData.creditPacks ?? []}
              onNavigateToHistory={handleNavigateToHistory}
            />
          )}
        </div>
      )}

      {/* TAB 2: DE-BOXED CREDIT HISTORY WITH DYNAMIC FILTERS */}
      {activeTab === 'CREDIT_HISTORY' && !isLoading && (
        <div id="panel-credit-history" role="tabpanel" aria-labelledby="tab-credit-history" className="flex flex-col gap-3 sm:gap-4">
          <CreditLedgerHistoryCard
            creditPacks={dashboardData?.creditPacks || []}
            initialFilter={historyFilter}
          />
        </div>
      )}

      {/* TAB 3: INVOICES & PAYMENT HISTORY */}
      {activeTab === 'INVOICES' && !isLoading && (
        <div id="panel-invoices" role="tabpanel" aria-labelledby="tab-invoices" className="flex flex-col gap-3 sm:gap-4">
          <RecentPaymentsCard
            payments={dashboardData?.recentPayments || []}
            onBrowsePlans={() => handleTabSwitch('BUY_PLANS')}
          />
        </div>
      )}

      {/* TAB 3: BUY PLANS & TOP-UPS (Mobile-First Category Pills Navigation) */}
      {activeTab === 'BUY_PLANS' && (
        <BuyPlansSection
          dynamicPlans={dynamicPlans}
          currentPlan={currentPlan}
          onSelectPlan={(plan) => {
            setDialogSelectedPlan(plan.id);
            setIsPurchaseDialogOpen(true);
            if (setSelectedPlan) {
              setSelectedPlan(plan.id);
            }
            if (onPlanSelected) {
              onPlanSelected(plan as ProfilePlan);
            }
            if (setShowPlanDialog) {
              setShowPlanDialog(true);
            }
          }}
        />
      )}

      {/* Plan Purchase Confirmation Dialog */}
      <PlanPurchaseDialog
        open={isPurchaseDialogOpen}
        onOpenChange={setIsPurchaseDialogOpen}
        selectedPlan={dialogSelectedPlan}
        plans={dynamicPlans.map((p) => ({
          id: p.id,
          name: p.name,
          type: p.type,
          features: p.features || [],
          price: p.price,
        }))}
        formatCurrency={formatCurrency || formatPrice}
      />
    </div>
  );
};

