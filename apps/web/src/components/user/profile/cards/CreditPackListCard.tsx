import React, { useState, useMemo } from 'react';
import type { CreditPackDTO, EntitlementType } from '@esparex/contracts';
import { Package, Bell, Zap, CheckCircle2, ChevronDown, Calendar, Clock } from "@esparex/ui";
import { CreditPoolBatchList } from './CreditPoolBatchList';
import { HistoryPackCard } from './HistoryPackCard';

export interface CreditPackListCardProps {
  creditPacks: CreditPackDTO[];
  onBrowsePlans?: () => void;
  onViewHistory?: () => void;
}

export type PackCategoryFilter = 'ALL' | 'SMART_ALERTS' | 'AD_POSTING' | 'BOOSTS' | 'HISTORY';

export interface CreditPoolGroup {
  poolKey: 'SMART_ALERTS' | 'AD_POSTING' | 'BOOSTS';
  title: string;
  entitlementType: EntitlementType;
  icon: typeof Bell;
  iconBgClass: string;
  totalGranted: number;
  consumed: number;
  remaining: number;
  earliestExpiry: string | null;
  batches: CreditPackDTO[];
}

export const CreditPackListCard: React.FC<CreditPackListCardProps> = ({
  creditPacks,
  onBrowsePlans,
  onViewHistory,
}) => {
  const [selectedTab, setSelectedTab] = useState<PackCategoryFilter>(() => {
    const hasActive = (creditPacks || []).some((p) => p.status === 'ACTIVE' && p.remaining > 0);
    return hasActive ? 'ALL' : 'HISTORY';
  });
  const [expandedPools, setExpandedPools] = useState<Record<string, boolean>>({});

  const togglePoolExpand = (poolKey: string) => {
    setExpandedPools((prev) => ({
      ...prev,
      [poolKey]: !prev[poolKey],
    }));
  };

  const isPackExpired = (p: CreditPackDTO): boolean =>
    p.status === 'EXPIRED' ||
    Boolean(p.expiresAt && new Date(p.expiresAt).getTime() <= Date.now());

  // Categorize active vs history packs: strictly exclude expired packs from active pool
  const activePacks = useMemo(
    () =>
      (creditPacks || []).filter(
        (p) =>
          (p.status === 'ACTIVE' || (p.status as string) === 'active') &&
          p.remaining > 0 &&
          !isPackExpired(p)
      ),
    [creditPacks]
  );
  const historyPacks = useMemo(
    () =>
      (creditPacks || []).filter(
        (p) =>
          p.status !== 'ACTIVE' ||
          p.remaining === 0 ||
          isPackExpired(p)
      ),
    [creditPacks]
  );

  // Executive balance summary totals
  const totalSmartAlerts = useMemo(
    () =>
      activePacks
        .filter((p) => p.entitlementType === 'SMART_ALERT_SLOT' || (p.planName && p.planName.toLowerCase().includes('alert')))
        .reduce((acc, p) => acc + (p.remaining || 0), 0),
    [activePacks]
  );

  const totalAdCredits = useMemo(
    () =>
      activePacks
        .filter((p) => p.entitlementType === 'AD_POSTING' || (p.planName && p.planName.toLowerCase().includes('ad')))
        .reduce((acc, p) => acc + (p.remaining || 0), 0),
    [activePacks]
  );

  const totalBoostCredits = useMemo(
    () =>
      activePacks
        .filter((p) =>
          p.entitlementType === 'SPOTLIGHT_HP' ||
          p.entitlementType === 'SPOTLIGHT_CAT' ||
          p.entitlementType === 'PUSH_TO_TOP' ||
          (p.planName && (p.planName.toLowerCase().includes('boost') || p.planName.toLowerCase().includes('spotlight')))
        )
        .reduce((acc, p) => acc + (p.remaining || 0), 0),
    [activePacks]
  );

  // Group active packs into unified Credit Pools to avoid repeated cards
  const creditPools = useMemo<CreditPoolGroup[]>(() => {
    const pools: CreditPoolGroup[] = [];

    // 1. Smart Alerts Pool
    const alertBatches = activePacks.filter(
      (p) => p.entitlementType === 'SMART_ALERT_SLOT' || (p.planName && p.planName.toLowerCase().includes('alert'))
    );
    if (alertBatches.length > 0) {
      const totalGranted = alertBatches.reduce((acc, p) => acc + (p.totalGranted || 1), 0);
      const consumed = alertBatches.reduce((acc, p) => acc + (p.consumed || 0), 0);
      const remaining = alertBatches.reduce((acc, p) => acc + (p.remaining || 0), 0);

      // Find earliest expiry date
      const validDates = alertBatches
        .map((p) => p.expiresAt)
        .filter((d): d is string => Boolean(d))
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

      pools.push({
        poolKey: 'SMART_ALERTS',
        title: 'Smart Alerts',
        entitlementType: 'SMART_ALERT_SLOT',
        icon: Bell,
        iconBgClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        totalGranted,
        consumed,
        remaining,
        earliestExpiry: validDates[0] || null,
        batches: alertBatches,
      });
    }

    // 2. Ad Postings Pool
    const adBatches = activePacks.filter(
      (p) => p.entitlementType === 'AD_POSTING' || (p.planName && p.planName.toLowerCase().includes('ad'))
    );
    if (adBatches.length > 0) {
      const totalGranted = adBatches.reduce((acc, p) => acc + (p.totalGranted || 1), 0);
      const consumed = adBatches.reduce((acc, p) => acc + (p.consumed || 0), 0);
      const remaining = adBatches.reduce((acc, p) => acc + (p.remaining || 0), 0);

      const validDates = adBatches
        .map((p) => p.expiresAt)
        .filter((d): d is string => Boolean(d))
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

      pools.push({
        poolKey: 'AD_POSTING',
        title: 'Ad Postings',
        entitlementType: 'AD_POSTING',
        icon: Package,
        iconBgClass: 'bg-primary/10 text-primary',
        totalGranted,
        consumed,
        remaining,
        earliestExpiry: validDates[0] || null,
        batches: adBatches,
      });
    }

    // 3. Featured Boosts Pool
    const boostBatches = activePacks.filter(
      (p) =>
        p.entitlementType === 'SPOTLIGHT_HP' ||
        p.entitlementType === 'SPOTLIGHT_CAT' ||
        p.entitlementType === 'PUSH_TO_TOP' ||
        (p.planName && (p.planName.toLowerCase().includes('boost') || p.planName.toLowerCase().includes('spotlight')))
    );
    if (boostBatches.length > 0) {
      const totalGranted = boostBatches.reduce((acc, p) => acc + (p.totalGranted || 1), 0);
      const consumed = boostBatches.reduce((acc, p) => acc + (p.consumed || 0), 0);
      const remaining = boostBatches.reduce((acc, p) => acc + (p.remaining || 0), 0);

      const validDates = boostBatches
        .map((p) => p.expiresAt)
        .filter((d): d is string => Boolean(d))
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

      pools.push({
        poolKey: 'BOOSTS',
        title: 'Featured Boosts',
        entitlementType: 'SPOTLIGHT_HP',
        icon: Zap,
        iconBgClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        totalGranted,
        consumed,
        remaining,
        earliestExpiry: validDates[0] || null,
        batches: boostBatches,
      });
    }

    return pools;
  }, [activePacks]);

  // Filtered active pools based on sub-tab
  const displayedPools = useMemo(() => {
    if (selectedTab === 'ALL' || selectedTab === 'HISTORY') return creditPools;
    return creditPools.filter((p) => p.poolKey === selectedTab);
  }, [selectedTab, creditPools]);

  // Number of active categories
  const activeCategoryCount = creditPools.length;

  if (!creditPacks || creditPacks.length === 0) {
    return (
      <div className="bg-surface rounded-2xl p-5 border border-border/60 shadow-2xs text-center space-y-3">
        <div className="w-10 h-10 rounded-xl bg-muted/70 flex items-center justify-center text-muted-foreground mx-auto">
          <Package className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-body font-bold text-foreground">No Credit Packs Purchased Yet</h4>
          <p className="text-tiny text-muted-foreground max-w-md mx-auto">
            Extra ad postings, spotlight boosts, or alert slots will appear here once acquired.
          </p>
        </div>
        {onBrowsePlans && (
          <button
            type="button"
            onClick={onBrowsePlans}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-caption font-semibold hover:bg-primary/90 transition-colors shadow-xs cursor-pointer"
          >
            Explore Plans & Credits
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-2xl p-4 sm:p-5 border border-border/60 shadow-2xs space-y-4">
      {/* 1. Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
            <Package className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-body font-bold text-foreground">My Credit Packs</h4>
            <p className="text-tiny text-muted-foreground">Manage active entitlements and balances</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          {onViewHistory && (
            <button
              type="button"
              onClick={onViewHistory}
              className="text-tiny font-semibold text-primary hover:underline cursor-pointer"
            >
              View Credit History →
            </button>
          )}
          {activePacks.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-tiny font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
              {activePacks.length} Active Pack{activePacks.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* 2. Executive Balance Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div
          onClick={() => {
            if (totalSmartAlerts > 0) setSelectedTab('SMART_ALERTS');
          }}
          className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
            selectedTab === 'SMART_ALERTS'
              ? 'border-emerald-500/60 bg-emerald-500/5 shadow-xs'
              : 'border-border/40 bg-card/60 hover:bg-card hover:border-border/60'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Bell className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-tiny text-muted-foreground truncate">Smart Alerts</div>
              <div className="text-body font-bold text-foreground">{totalSmartAlerts} Available</div>
            </div>
          </div>
        </div>

        <div
          onClick={() => {
            if (totalAdCredits > 0) setSelectedTab('AD_POSTING');
          }}
          className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
            selectedTab === 'AD_POSTING'
              ? 'border-primary/60 bg-primary/5 shadow-xs'
              : 'border-border/40 bg-card/60 hover:bg-card hover:border-border/60'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Package className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-tiny text-muted-foreground truncate">Ad Postings</div>
              <div className="text-body font-bold text-foreground">{totalAdCredits} Available</div>
            </div>
          </div>
        </div>

        <div
          onClick={() => {
            if (totalBoostCredits > 0) setSelectedTab('BOOSTS');
          }}
          className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
            selectedTab === 'BOOSTS'
              ? 'border-amber-500/60 bg-amber-500/5 shadow-xs'
              : 'border-border/40 bg-card/60 hover:bg-card hover:border-border/60'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="text-tiny text-muted-foreground truncate">Featured Boosts</div>
              <div className="text-body font-bold text-foreground">{totalBoostCredits} Available</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Filter Navigation (Eliminates redundant identical tabs) */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pt-1 pb-0.5 border-b border-border/40" role="tablist" aria-label="Pack categories">
        {/* If only 1 category exists among active packs, avoid redundant "All Packs" vs "Category" duplicate tabs */}
        {activeCategoryCount > 1 && (
          <button
            type="button"
            role="tab"
            aria-selected={selectedTab === 'ALL'}
            onClick={() => setSelectedTab('ALL')}
            className={`px-3 py-1.5 text-caption font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              selectedTab === 'ALL'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-foreground-secondary hover:text-foreground hover:bg-muted/50'
            }`}
          >
            All Active ({activePacks.length})
          </button>
        )}

        {/* When only 1 category exists, show a single clear "Active Credits" tab */}
        {activeCategoryCount <= 1 && (
          <button
            type="button"
            role="tab"
            aria-selected={selectedTab !== 'HISTORY'}
            onClick={() => setSelectedTab('ALL')}
            className={`px-3 py-1.5 text-caption font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              selectedTab !== 'HISTORY'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-foreground-secondary hover:text-foreground hover:bg-muted/50'
            }`}
          >
            Active Credits ({activePacks.length})
          </button>
        )}

        {/* Category-specific tabs only shown when multiple distinct active categories exist */}
        {activeCategoryCount > 1 && totalSmartAlerts > 0 && (
          <button
            type="button"
            role="tab"
            aria-selected={selectedTab === 'SMART_ALERTS'}
            onClick={() => setSelectedTab('SMART_ALERTS')}
            className={`px-3 py-1.5 text-caption font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              selectedTab === 'SMART_ALERTS'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-foreground-secondary hover:text-foreground hover:bg-muted/50'
            }`}
          >
            Smart Alerts ({totalSmartAlerts})
          </button>
        )}

        {activeCategoryCount > 1 && totalAdCredits > 0 && (
          <button
            type="button"
            role="tab"
            aria-selected={selectedTab === 'AD_POSTING'}
            onClick={() => setSelectedTab('AD_POSTING')}
            className={`px-3 py-1.5 text-caption font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              selectedTab === 'AD_POSTING'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-foreground-secondary hover:text-foreground hover:bg-muted/50'
            }`}
          >
            Ad Postings ({totalAdCredits})
          </button>
        )}

        {activeCategoryCount > 1 && totalBoostCredits > 0 && (
          <button
            type="button"
            role="tab"
            aria-selected={selectedTab === 'BOOSTS'}
            onClick={() => setSelectedTab('BOOSTS')}
            className={`px-3 py-1.5 text-caption font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              selectedTab === 'BOOSTS'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-foreground-secondary hover:text-foreground hover:bg-muted/50'
            }`}
          >
            Boosts ({totalBoostCredits})
          </button>
        )}

        {/* Past / History Tab */}
        {historyPacks.length > 0 && (
          <button
            type="button"
            role="tab"
            aria-selected={selectedTab === 'HISTORY'}
            onClick={() => setSelectedTab('HISTORY')}
            className={`px-3 py-1.5 text-caption font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
              selectedTab === 'HISTORY'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-foreground-secondary hover:text-foreground hover:bg-muted/50'
            }`}
          >
            Past / Used ({historyPacks.length})
          </button>
        )}
      </div>

      {/* 4. ACTIVE CREDIT POOLS (Unified Pool Cards without Repetition) */}
      {selectedTab !== 'HISTORY' && (
        <div className="flex flex-col gap-3">
          {displayedPools.length === 0 ? (
            <div className="text-center py-6 text-tiny text-muted-foreground">
              No active credits found in this category.
            </div>
          ) : (
            displayedPools.map((pool) => {
              const IconComponent = pool.icon;
              const isExpanded = !!expandedPools[pool.poolKey];
              const pct = pool.totalGranted > 0 ? Math.min(100, Math.round((pool.consumed / pool.totalGranted) * 100)) : 0;

              const isExpiringSoon = pool.earliestExpiry
                ? new Date(pool.earliestExpiry).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000
                : false;

              return (
                <div
                  key={pool.poolKey}
                  className="p-4 rounded-2xl border border-border/50 bg-card shadow-2xs hover:border-border transition-all space-y-3"
                >
                  {/* Pool Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${pool.iconBgClass}`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-foreground text-caption sm:text-body">{pool.title}</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-tiny font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" /> Active
                      </span>
                    </div>

                    <div className="font-black text-primary text-body sm:text-body-lg sm:text-right shrink-0">
                      {pool.remaining} Available
                    </div>
                  </div>

                  {/* Utilization Progress Bar */}
                  <div className="w-full bg-muted/60 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-1.5 rounded-full bg-gradient-to-r from-primary via-emerald-500 to-teal-400 transition-all duration-300"
                      style={{ width: `${pct}%` }} /* design-token-ignore: dynamic utilization progress bar */
                    />
                  </div>

                  {/* Pool Metrics Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-tiny text-muted-foreground">
                    <span>
                      Granted: <strong className="text-foreground">{pool.totalGranted}</strong> • Used: <strong className="text-foreground">{pool.consumed}</strong>
                    </span>
                    <span className="font-medium text-foreground-secondary">
                      {pool.earliestExpiry ? (
                        (() => {
                          const expiryDate = new Date(pool.earliestExpiry);
                          const isExpired = expiryDate.getTime() < Date.now();
                          const daysLeft = Math.max(0, Math.ceil((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
                          const dateStr = expiryDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

                          return (
                            <span className={`inline-flex items-center gap-1 ${
                              isExpired
                                ? 'text-destructive font-semibold'
                                : isExpiringSoon
                                ? 'text-amber-600 dark:text-amber-400 font-semibold'
                                : ''
                            }`}>
                              <Clock className="w-3 h-3 shrink-0" />
                              {isExpired
                                ? `Expired on ${dateStr}`
                                : isExpiringSoon
                                ? `Expires soon: ${dateStr} (${daysLeft}d left)`
                                : `Earliest expiry: ${dateStr}`}
                            </span>
                          );
                        })()
                      ) : (
                        <span>Standard Validity</span>
                      )}
                    </span>
                  </div>

                  {/* Single Batch Detail: show purchase date & validity directly */}
                  {pool.batches.length === 1 && pool.batches[0] && (() => {
                    const singleBatch = pool.batches[0];
                    const isBatchExpired = singleBatch.expiresAt ? new Date(singleBatch.expiresAt).getTime() < Date.now() : false;
                    return (
                      <div className="pt-2 border-t border-border/30 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-tiny text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
                          Purchased on: <strong className="text-foreground-secondary">{new Date(singleBatch.purchaseDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</strong>
                        </span>
                        {singleBatch.expiresAt && (
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0" />
                            <span>
                              {isBatchExpired ? 'Expired on: ' : 'Valid until: '}
                              <strong className={isBatchExpired ? 'text-destructive font-semibold' : 'text-foreground-secondary'}>
                                {new Date(singleBatch.expiresAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                              </strong>
                            </span>
                          </span>
                        )}
                      </div>
                    );
                  })()}

                  {/* Expandable Purchase Batches Drawer for multi-purchase accounts */}
                  {pool.batches.length > 1 && (
                    <div className="pt-2 border-t border-border/30">
                      <button
                        type="button"
                        onClick={() => togglePoolExpand(pool.poolKey)}
                        className="inline-flex items-center gap-1.5 text-tiny font-semibold text-foreground-secondary hover:text-foreground transition-colors cursor-pointer"
                        aria-expanded={isExpanded}
                      >
                        <span>{isExpanded ? 'Hide' : 'View'} {pool.batches.length} Purchase Batches</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>

                      {isExpanded && <CreditPoolBatchList batches={pool.batches} />}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 5. PAST / USED PACKS LIST */}
      {selectedTab === 'HISTORY' && (
        <div className="flex flex-col gap-2.5">
          {historyPacks.length === 0 ? (
            <div className="text-center py-6 text-tiny text-muted-foreground">
              No historical or expired credit packs found.
            </div>
          ) : (
            historyPacks.map((pack) => (
              <HistoryPackCard key={pack.packId} pack={pack} />
            ))
          )}
        </div>
      )}
    </div>
  );
};
