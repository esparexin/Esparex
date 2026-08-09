import React, { useState } from 'react';
import { usePlansWalletDashboard } from '@/hooks/usePlansWalletDashboard';
import { ActiveSubscriptionCard } from '../cards/ActiveSubscriptionCard';
import { WalletOverviewCard } from '../cards/WalletOverviewCard';
import { CreditPackListCard } from '../cards/CreditPackListCard';
import { ActivePromotionsCard } from '../cards/ActivePromotionsCard';
import { CreditLedgerHistoryCard } from '../cards/CreditLedgerHistoryCard';
import { RecentPaymentsCard } from '../cards/RecentPaymentsCard';
import { PlanPurchaseDialog } from '../dialogs/PlanPurchaseDialog';
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
      {/* Header Navigation: 3-Tab Navigation for Wallet view, Standalone Title for Buy Plans view */}
      {initialTab !== 'BUY_PLANS' ? (
        <div className="bg-muted/50 p-1.5 rounded-2xl border border-border/50 shadow-2xs mb-4">
          <nav className="flex space-x-1 overflow-x-auto scrollbar-none" aria-label="Wallet Navigation" role="tablist">
            <button
              id="tab-overview"
              role="tab"
              aria-selected={activeTab === 'OVERVIEW'}
              aria-controls="panel-overview"
              onClick={() => handleTabSwitch('OVERVIEW')}
              className={`min-h-[40px] px-5 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer ${
                activeTab === 'OVERVIEW'
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/60'
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
              className={`min-h-[40px] px-5 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer ${
                activeTab === 'CREDIT_PACKS'
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/60'
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
              className={`min-h-[40px] px-5 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer ${
                activeTab === 'INVOICES'
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/60'
              }`}
            >
              Invoices
            </button>
          </nav>
        </div>
      ) : (
        <div className="border-b border-border/60 pb-3 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-foreground tracking-tight">Buy Plans & Packages</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Select an ad posting pack, spotlight promotion, or alert slot package for your account.
            </p>
          </div>
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
        <div id="panel-buy-plans" role="tabpanel" aria-labelledby="tab-buy-plans" className="flex flex-col gap-4">
          {/* Mobile-First Category Filter Pills Bar */}
          <div className="bg-surface rounded-xl p-1.5 sm:p-2 border border-border/60 shadow-2xs">
            <div
              className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none"
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
                    className={`min-h-[36px] px-3 py-1.5 rounded-lg text-2xs sm:text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      isSelected
                        ? 'bg-primary text-primary-foreground shadow-2xs'
                        : 'bg-background text-muted-foreground hover:text-foreground hover:bg-muted/60 border border-border/40'
                    }`}
                  >
                    <span>{catType}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-extrabold ${
                        isSelected
                          ? 'bg-primary-foreground/20 text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredPlans.map((plan) => {
                const isCurrent = currentPlan === plan.id;

                return (
                  <div
                    key={plan.id}
                    className={`bg-surface rounded-xl p-3.5 sm:p-4 border shadow-2xs transition-all flex flex-col justify-between relative overflow-hidden ${
                      isCurrent ? 'border-primary ring-1 ring-primary/40' : 'border-border/60 hover:border-border hover:shadow-xs'
                    }`}
                  >
                    {plan.popular && !isCurrent && (
                      <div className="absolute top-0 right-0 bg-amber-500 text-amber-950 font-extrabold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-bl-md shadow-2xs">
                        Popular
                      </div>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          {plan.type}
                        </span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 rounded-full text-2xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            Active
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm sm:text-base font-bold text-foreground tracking-tight">{plan.name}</h4>
                      <div className="mt-1.5 flex items-baseline gap-1">
                        <span className="text-xl sm:text-2xl font-black text-foreground">₹{plan.price.toLocaleString()}</span>
                        <span className="text-2xs font-medium text-muted-foreground">/ {plan.duration}</span>
                      </div>

                      {plan.features && plan.features.length > 0 && (
                        <ul className="mt-3 space-y-1.5 text-2xs sm:text-xs text-muted-foreground border-t border-border/40 pt-2.5">
                          {plan.features.map((feat, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-emerald-500 font-bold shrink-0">✓</span>
                              <span className="leading-snug">{feat}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <button
                      onClick={() => {
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
                      className={`w-full h-9 mt-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        isCurrent
                          ? 'bg-muted text-muted-foreground cursor-default'
                          : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs active:scale-[0.99]'
                      }`}
                      disabled={isCurrent}
                    >
                      {isCurrent ? 'Current Plan' : 'Purchase Package'}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-surface rounded-xl p-8 border border-border/60 text-center space-y-2">
              <h4 className="text-sm font-bold text-foreground">No Packages Available</h4>
              <p className="text-xs text-muted-foreground">
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

