import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import type { CreditLedgerDTO, CreditPackDTO } from '@esparex/contracts';
import { Pagination, ArrowUp, ArrowDown, Button } from '@esparex/ui';
import { useCreditLedgerHistory } from '@/hooks/useCreditLedgerHistory';
import {
  formatActivityName,
  formatAppliedDateTime,
  renderTransactionStatus,
  matchesLedgerFilter,
  type LedgerFilterType,
} from './CreditLedgerFormatters';
import { CreditLedgerDesktopTable } from './CreditLedgerDesktopTable';

export { type LedgerFilterType };

export interface CreditLedgerHistoryCardProps {
  creditPacks?: CreditPackDTO[];
  initialFilter?: LedgerFilterType;
}

export const CreditLedgerHistoryCard: React.FC<CreditLedgerHistoryCardProps> = ({
  creditPacks = [],
  initialFilter = 'ALL',
}) => {
  const [activeFilter, setActiveFilter] = useState<LedgerFilterType>(initialFilter);
  const [page, setPage] = useState(1);
  const limit = 4;
  const { data, isLoading, isError, refetch } = useCreditLedgerHistory(page, limit);

  const handleFilterChange = (filter: LedgerFilterType) => {
    setActiveFilter(filter);
    setPage(1); // always reset to page 1 when filter changes
  };

  const items: CreditLedgerDTO[] = data?.items || [];
  const pagination = data?.pagination;

  // Filter chips: always show at minimum 'All Activities'.
  // Visibility of extra chips is seeded from creditPacks (covers ALL pages / credit types)
  // so chips remain stable as the user pages through the ledger.
  const availableFilterChips = useMemo(() => {
    const chips: { key: LedgerFilterType; label: string }[] = [{ key: 'ALL', label: 'All Activities' }];

    const hasMoreAds = creditPacks.some(
      (p) => p.entitlementType === 'AD_POSTING' || p.planName?.toLowerCase().includes('ad'),
    );
    if (hasMoreAds) chips.push({ key: 'MORE_ADS', label: 'More Ads' });

    const hasSpotlight = creditPacks.some(
      (p) => p.entitlementType?.startsWith('SPOTLIGHT') || p.planName?.toLowerCase().includes('spotlight'),
    );
    if (hasSpotlight) chips.push({ key: 'SPOTLIGHT', label: 'Spotlight' });

    const hasTopAd = creditPacks.some(
      (p) =>
        p.entitlementType === 'PUSH_TO_TOP' ||
        p.planName?.toLowerCase().includes('top ad') ||
        p.planName?.toLowerCase().includes('boost'),
    );
    if (hasTopAd) chips.push({ key: 'TOP_AD', label: 'Top Ads' });

    const hasSmartAlert = creditPacks.some(
      (p) => p.entitlementType === 'SMART_ALERT_SLOT' || p.planName?.toLowerCase().includes('alert'),
    );
    if (hasSmartAlert) chips.push({ key: 'SMART_ALERT', label: 'Smart Alerts' });

    return chips;
  }, [creditPacks]);

  const filteredItems = useMemo(
    () => items.filter((tx) => matchesLedgerFilter(activeFilter, tx.entitlementType, tx.reason)),
    [items, activeFilter]
  );

  return (
    <div className="space-y-4">
      {/* 1. Clean De-Boxed Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h4 className="text-body sm:text-body-lg font-bold text-foreground">My Usage</h4>
          <p className="text-tiny text-muted-foreground">Your credit deductions and activity history</p>
        </div>
        {pagination && (
          <span className="text-tiny text-muted-foreground font-medium self-start sm:self-auto">
            Total Activities: {pagination.total}
          </span>
        )}
      </div>

      {/* 2. Filter chips — always visible; seeded from creditPacks so stable across pages */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none" role="tablist" aria-label="Activity Filter">
        {availableFilterChips.map((chip) => {
          const isSelected = activeFilter === chip.key;
          return (
            <button
              key={chip.key}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => handleFilterChange(chip.key)}
              className={`h-7 px-3 rounded-full text-tiny font-semibold transition-all whitespace-nowrap cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isSelected
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-muted/70 text-foreground-secondary hover:text-foreground hover:bg-muted border border-border/40'
              }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* 3. Pagination — above the table so user never scrolls to page */}
      {pagination && pagination.totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          pageSize={limit}
          onPageChange={setPage}
          itemLabel="activities"
          className="border border-border/40 rounded-xl px-3 py-2 bg-muted/30"
        />
      )}

      {/* 4. Loading State */}
      {isLoading && (
        <div className="space-y-2.5 animate-pulse">
          <div className="h-12 bg-muted/60 rounded-xl" />
          <div className="h-12 bg-muted/60 rounded-xl" />
        </div>
      )}

      {/* 5. Error State */}
      {isError && (
        <div className="p-3.5 bg-destructive/10 text-destructive rounded-xl text-tiny flex justify-between items-center border border-destructive/20">
          <span>Failed to load transaction history.</span>
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={() => void refetch()}
            className="font-bold underline cursor-pointer hover:opacity-80 p-0 h-auto text-tiny text-destructive"
          >
            Retry
          </Button>
        </div>
      )}

      {/* 6. Empty State */}
      {!isLoading && filteredItems.length === 0 && (
        <div className="text-center py-8 text-tiny text-muted-foreground border border-dashed border-border rounded-xl">
          No credit activity found for this category.
        </div>
      )}

      {/* 7. Transactions List */}
      {!isLoading && filteredItems.length > 0 && (
        <>
          <CreditLedgerDesktopTable items={filteredItems} />

          {/* Mobile Cards View (< md:) */}
          <div className="md:hidden flex flex-col gap-2.5">
            {filteredItems.map((tx) => {
              const isDebit = tx.type === 'DEBIT';
              const absAmount = Math.abs(tx.amount);
              const adTarget = tx.adSlug || tx.listingId;

              return (
                <div key={tx.transactionId} className="p-3 rounded-xl border border-border/40 bg-card space-y-2 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-tiny text-muted-foreground">{formatAppliedDateTime(tx.createdAt)}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-tiny font-bold ${
                      isDebit ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {isDebit ? <><ArrowDown className="w-3 h-3" />-{absAmount} USED</> : <><ArrowUp className="w-3 h-3" />+{absAmount} ADDED</>}
                    </span>
                  </div>
                  <div className="font-semibold text-foreground text-caption">{formatActivityName(tx)}</div>
                  {adTarget && (
                    <div className="text-caption pt-1 border-t border-border/20 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-tiny text-muted-foreground">
                        <span>Listing:</span>
                        <Link href={`/ads/${adTarget}`} className="font-semibold text-primary hover:underline truncate">
                          {tx.adTitle || 'View Ad'}
                        </Link>
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-tiny text-muted-foreground">Status:</span>
                        {renderTransactionStatus(tx)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
