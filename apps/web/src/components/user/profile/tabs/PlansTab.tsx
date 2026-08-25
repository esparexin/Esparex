import React, { useState } from 'react';
import { usePlansWalletDashboard } from '@/hooks/usePlansWalletDashboard';
import { ActiveSubscriptionCard } from '../cards/ActiveSubscriptionCard';
import { WalletOverviewCard } from '../cards/WalletOverviewCard';
import { CreditPackListCard } from '../cards/CreditPackListCard';
import { ActivePromotionsCard } from '../cards/ActivePromotionsCard';
import { CreditLedgerHistoryCard } from '../cards/CreditLedgerHistoryCard';
import { RecentPaymentsCard } from '../cards/RecentPaymentsCard';
import { PlanPurchaseDialog } from '../dialogs/PlanPurchaseDialog';
import { DynamicPlanCard } from '../cards/DynamicPlanCard';
import { formatPrice } from '@/lib/formatters';
import { trackPlansWalletEvent } from '@/lib/analytics/plansWalletTelemetry';
import type { ProfilePlan } from '../types';

type PlanCard = Omit<ProfilePlan, 'type'> & { type: string };

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

type DashboardHubTab = 'OVERVIEW' | 'CREDIT_PACKS' | 'INVOICES' | 'BUY_PLANS';

const DEFAULT_CATEGORIES: string[] = ['More Ads', 'Spotlight', 'Top Ad', 'Alert Slots'];

export const PlansTab: React.FC<PlansTabProps> = ({
  dynamicPlans,
  currentPlan,
  setSelectedPlan,
  onPlanSelected,
  setShowPlanDialog,
  formatCurrency: _formatCurrency,
  initialTab = 'OVERVIEW',
}) => {
  const [activeTab, setActiveTab] = useState<DashboardHubTab>(initialTab);
  const [selectedCategory, setSelectedCategory] = useState<string>('More Ads');
  const [dialogSelectedPlan, setDialogSelectedPlan] = useState<string | null>(null);
  const [isPurchaseDialogOpen, setIsPurchaseDialogOpen] = useState<boolean>(false);
  const { dashboardData, isLoading, isError, refetch } = usePlansWalletDashboard();

  const handleTabSwitch = (tab: DashboardHubTab) => {
    setActiveTab(tab);
    trackPlansWalletEvent('plans_tab_switched', { tabName: tab });
  };

  // Derive unique categories from dynamic plans, merging with defaults
  const availableCategories = Array.from(
    new Set([
      ...dynamicPlans.map((p) => p.type).filter(Boolean),
      ...DEFAULT_CATEGORIES,
    ])
  );

  // Ensure selected category is valid
  const currentCategory = availableCategories.includes(selectedCategory)
    ? selectedCategory
    : availableCategories[0] || 'More Ads';

  const filteredPlans = dynamicPlans.filter((plan) => plan.type === currentCategory);

  return (
    <div className="space-y-6">
      {/* Header Navigation: 3-Tab Navigation for Wallet view */}
      {initialTab !== 'BUY_PLANS' && (
        <div className="bg-muted/80 p-1 rounded-xl border border-border inline-flex space-x-1 mb-2">
          <nav className="flex space-x-1 overflow-x-auto scrollbar-none" aria-label="Wallet Navigation" role="tablist">
            <button
              id="tab-overview"
              role="tab"
              aria-selected={activeTab === 'OVERVIEW'}
              aria-controls="panel-overview"
              onClick={() => handleTabSwitch('OVERVIEW')}
              className={`h-8 px-4 text-caption font-semibold rounded-lg transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer ${
                activeTab === 'OVERVIEW'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-foreground-secondary hover:text-foreground hover:bg-card/50'
              }`}
            >
              My Plan
            </button>

            <button
              id="tab-credit-packs"
              role="tab"
              aria-selected={activeTab === 'CREDIT_PACKS'}
              aria-controls="panel-credit-packs"
              onClick={() => handleTabSwitch('CREDIT_PACKS')}
              className={`h-8 px-4 text-caption font-semibold rounded-lg transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer ${
                activeTab === 'CREDIT_PACKS'
                  ? 'bg-card text-foreground shadow-xs'
                  : 'text-foreground-secondary hover:text-foreground hover:bg-card/50'
              }`}
            >
              Ad Credits
            </button>

            <button
              id="tab-invoices"
              role="tab"
              aria-selected={activeTab === 'INVOICES'}
              aria-controls="panel-invoices"
              onClick={() => handleTabSwitch('INVOICES')}
              className={`h-8 px-4 text-caption font-semibold rounded-lg transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer ${
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
          <button
            onClick={() => void refetch()}
            className="px-3 py-1 bg-destructive text-destructive-foreground rounded-lg text-caption font-semibold hover:bg-destructive/90 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* TAB 1: OVERVIEW & BALANCES */}
      {activeTab === 'OVERVIEW' && !isLoading && (
        <div id="panel-overview" role="tabpanel" aria-labelledby="tab-overview" className="flex flex-col gap-3 sm:gap-4">
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
        <div id="panel-credit-packs" role="tabpanel" aria-labelledby="tab-credit-packs" className="flex flex-col gap-3 sm:gap-4">
          <CreditPackListCard creditPacks={dashboardData?.creditPacks || []} />
          <CreditLedgerHistoryCard />
        </div>
      )}

      {/* TAB 3: INVOICES & PAYMENT HISTORY */}
      {activeTab === 'INVOICES' && !isLoading && (
        <div id="panel-invoices" role="tabpanel" aria-labelledby="tab-invoices" className="flex flex-col gap-3 sm:gap-4">
          <RecentPaymentsCard payments={dashboardData?.recentPayments || []} />
        </div>
      )}

      {/* TAB 3: BUY PLANS & TOP-UPS (Mobile-First Category Pills Navigation) */}
      {activeTab === 'BUY_PLANS' && (
        <div id="panel-buy-plans" role="tabpanel" aria-labelledby="tab-buy-plans" className="flex flex-col gap-3 sm:gap-4">
          {/* Free-Flowing Category Filter Pills Bar */}
          <div className="overflow-x-auto no-scrollbar scrollbar-none py-1 -mx-1 px-1">
            <div
              className="flex items-center gap-2 overflow-x-auto no-scrollbar scrollbar-none w-max sm:w-auto"
              role="tablist"
              aria-label="Plan Categories"
            >
              {availableCategories.map((catType) => {
                const count = dynamicPlans.filter((p) => p.type === catType).length;
                const isSelected = currentCategory === catType;

                return (
                  <button
                    key={catType}
                    id={`cat-tab-${catType.replace(/\s+/g, '-').toLowerCase()}`}
                    role="tab"
                    aria-selected={isSelected}
                    onClick={() => setSelectedCategory(catType)}
                    className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-caption font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shrink-0 ${
                      isSelected
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'bg-card text-foreground-secondary hover:text-foreground hover:bg-muted border border-border shadow-2xs'
                    }`}
                  >
                    <span>{catType}</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-tiny font-extrabold ${
                        isSelected
                          ? 'bg-primary-foreground/20 text-primary-foreground'
                          : 'bg-muted text-foreground-secondary'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Standardized Compact Package Cards Grid */}
          {filteredPlans.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
              {filteredPlans.map((plan) => (
                <DynamicPlanCard
                  key={plan.id}
                  plan={plan}
                  isCurrent={currentPlan === plan.id}
                  onSelect={(p) => {
                    setDialogSelectedPlan(p.id);
                    setIsPurchaseDialogOpen(true);
                    if (setSelectedPlan) {
                      setSelectedPlan(p.id);
                    }
                    if (onPlanSelected) {
                      onPlanSelected(p as ProfilePlan);
                    }
                    if (setShowPlanDialog) {
                      setShowPlanDialog(true);
                    }
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-2xl p-8 border border-border text-center space-y-2 shadow-xs">
              <h4 className="text-body font-bold text-foreground">No Packages Available</h4>
              <p className="text-caption text-foreground-subtle">
                There are currently no active packages in the {currentCategory} category.
              </p>
            </div>
          )}
        </div>
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
        formatCurrency={_formatCurrency || formatPrice}
      />
    </div>
  );
};

