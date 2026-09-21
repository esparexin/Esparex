import React, { useState, useMemo } from 'react';
import type { CreditPackDTO } from '@esparex/contracts';
import { getEntitlementPresentationMeta, formatPlanName } from '@esparex/shared';
import { Package, Calendar, Clock, Button } from '@esparex/ui';
import { isPackExpired, getCreditPackStatusBadge, getValidityDisplay } from './CreditPackFormatters';

export interface CreditPackListCardProps {
  creditPacks: CreditPackDTO[];
  onBrowsePlans?: () => void;
  onViewHistory?: () => void;
}

type PurchaseFilter = 'ALL' | 'ACTIVE' | 'HISTORY';

export const CreditPackListCard: React.FC<CreditPackListCardProps> = ({
  creditPacks,
  onBrowsePlans,
  onViewHistory,
}) => {
  const [filter, setFilter] = useState<PurchaseFilter>('ALL');

  const activePacks = useMemo(
    () => (creditPacks || []).filter((p) => (p.status === 'ACTIVE' || (p.status as string) === 'active') && p.remaining > 0 && !isPackExpired(p)),
    [creditPacks]
  );
  const historyPacks = useMemo(
    () => (creditPacks || []).filter((p) => p.status !== 'ACTIVE' || p.remaining === 0 || isPackExpired(p)),
    [creditPacks]
  );

  const filteredPacks = useMemo(() => {
    if (filter === 'ACTIVE') return activePacks;
    if (filter === 'HISTORY') return historyPacks;
    return creditPacks || [];
  }, [filter, creditPacks, activePacks, historyPacks]);

  if (!creditPacks || creditPacks.length === 0) {
    return (
      <div className="bg-surface rounded-2xl p-5 border border-border/60 shadow-2xs text-center space-y-3">
        <div className="w-10 h-10 rounded-xl bg-muted/70 flex items-center justify-center text-muted-foreground mx-auto">
          <Package className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-body font-bold text-foreground">No Credit Packs Purchased Yet</h4>
          <p className="text-tiny text-muted-foreground max-w-md mx-auto">Purchased ad postings, spotlight boosts, and alert packs will be tracked individually here.</p>
        </div>
        {onBrowsePlans && (
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onBrowsePlans}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-caption font-semibold cursor-pointer"
          >
            Explore Plans & Credits
          </Button>
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
            <h4 className="text-body font-bold text-foreground">Purchased Plans & Credits</h4>
            <p className="text-tiny text-muted-foreground">Trace individual purchases, credit usage, and validities</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          {onViewHistory && (
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={onViewHistory}
              className="p-0 h-auto text-tiny font-semibold text-primary hover:underline cursor-pointer"
            >
              View Credit History →
            </Button>
          )}
          {activePacks.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-tiny font-semibold bg-success/10 text-success border border-success/20 shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              {activePacks.length} Active Purchase{activePacks.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* 2. Filter Navigation */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pt-1 pb-0.5 border-b border-border/40" role="tablist" aria-label="Purchase filters">
        {[
          { key: 'ALL', label: `All Purchases (${creditPacks.length})` },
          { key: 'ACTIVE', label: `Active Credits (${activePacks.length})` },
          ...(historyPacks.length > 0 ? [{ key: 'HISTORY', label: `Past / Used (${historyPacks.length})` }] : []),
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={filter === tab.key}
            onClick={() => setFilter(tab.key as PurchaseFilter)}
            className={`px-3 py-1.5 text-caption font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
              filter === tab.key ? 'bg-primary text-primary-foreground shadow-xs' : 'text-foreground-secondary hover:text-foreground hover:bg-muted/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 5. Non-merged Individual Purchases List */}
      {filteredPacks.length === 0 ? (
        <div className="text-center py-6 text-tiny text-muted-foreground">
          {filter === 'ACTIVE' ? 'No active credit purchases found.' : filter === 'HISTORY' ? 'No past or expired credit purchases found.' : 'No credit purchases found.'}
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-border/40">
            <table className="w-full text-left text-caption" aria-label="Active credit purchases">
              <thead className="bg-muted/40 border-b border-border/40">
                <tr className="text-muted-foreground font-semibold text-tiny">
                  <th scope="col" className="py-2.5 px-3.5">Plan Name</th>
                  <th scope="col" className="py-2.5 px-3">Purchase Date</th>
                  <th scope="col" className="py-2.5 px-3">Total Credits</th>
                  <th scope="col" className="py-2.5 px-3">Used</th>
                  <th scope="col" className="py-2.5 px-3">Available</th>
                  <th scope="col" className="py-2.5 px-3">Validity</th>
                  <th scope="col" className="py-2.5 px-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {filteredPacks.map((pack) => {
                  const meta = getEntitlementPresentationMeta(pack.entitlementType);
                  const displayName = pack.planName ? formatPlanName(pack.planName) : meta.label;
                  const purchaseDateStr = new Date(pack.purchaseDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

                  return (
                    <tr key={pack.packId} className="hover:bg-muted/20 transition-colors">
                      <td className="py-3 px-3.5 font-bold text-foreground">
                        <div>{displayName}</div>
                        <div className="text-tiny text-muted-foreground font-normal">{meta.label}</div>
                      </td>
                      <td className="py-3 px-3 text-muted-foreground text-tiny whitespace-nowrap">
                        <span className="inline-flex items-center gap-1"><Calendar className="w-3 h-3 text-muted-foreground/70 shrink-0" />{purchaseDateStr}</span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-foreground">{pack.totalGranted} total</td>
                      <td className="py-3 px-3 text-foreground-secondary">{pack.consumed} used</td>
                      <td className="py-3 px-3 font-bold text-primary">{pack.remaining}</td>
                      <td className="py-3 px-3 text-tiny text-foreground-secondary whitespace-nowrap">{getValidityDisplay(pack)}</td>
                      <td className="py-3 px-3.5 whitespace-nowrap">{getCreditPackStatusBadge(pack)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden flex flex-col gap-2.5">
            {filteredPacks.map((pack) => {
              const meta = getEntitlementPresentationMeta(pack.entitlementType);
              const displayName = pack.planName ? formatPlanName(pack.planName) : meta.label;
              const purchaseDateStr = new Date(pack.purchaseDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

              return (
                <div key={pack.packId} className="p-3 rounded-xl border border-border/40 bg-card space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-caption text-foreground truncate">{displayName}</div>
                      <div className="text-tiny text-muted-foreground">{meta.label}</div>
                    </div>
                    {getCreditPackStatusBadge(pack)}
                  </div>
                  <div className="flex items-center justify-between gap-2 text-caption pt-1 border-t border-border/20">
                    <span className="text-muted-foreground text-tiny">Credits: <strong className="text-foreground">{pack.consumed} used / {pack.totalGranted} total</strong></span>
                    <span className="font-bold text-primary text-caption">Available: {pack.remaining}</span>
                  </div>
                  <div className="flex flex-col gap-1 text-tiny text-muted-foreground pt-1 border-t border-border/20">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-muted-foreground/70 shrink-0" />Purchased: <strong className="text-foreground-secondary">{purchaseDateStr}</strong></span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-muted-foreground/70 shrink-0" /><span>{getValidityDisplay(pack)}</span></span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
