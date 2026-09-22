import React, { useState, useMemo } from 'react';
import type { CreditLedgerDTO, CreditPackDTO } from '@esparex/contracts';
import {
  Pagination,
  ArrowUp,
  ArrowDown,
  Info,
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@esparex/ui';
import Link from 'next/link';
import { useCreditLedgerHistory } from '@/hooks/useCreditLedgerHistory';
import {
  formatActivityCategory,
  formatAppliedDateTime,
  renderTransactionStatus,
  matchesLedgerFilter,
  getListingDetailHref,
  type LedgerFilterType,
} from './CreditLedgerFormatters';
import { CreditLedgerDesktopTable } from './CreditLedgerDesktopTable';
import { CreditLedgerDetailPopup } from './CreditLedgerDetailPopup';

export { type LedgerFilterType };

export interface CreditLedgerHistoryCardProps {
  creditPacks?: CreditPackDTO[];
  initialFilter?: LedgerFilterType;
}

export const CreditLedgerHistoryCard: React.FC<CreditLedgerHistoryCardProps> = ({
  creditPacks: _creditPacks = [],
  initialFilter = 'ALL',
}) => {
  const [activeFilter, setActiveFilter] = useState<LedgerFilterType>(initialFilter);
  const [page, setPage] = useState(1);
  const [selectedTx, setSelectedTx] = useState<CreditLedgerDTO | null>(null);
  const limit = 4;
  const { data, isLoading, isError, refetch } = useCreditLedgerHistory(page, limit);

  const handleFilterChange = (filter: LedgerFilterType) => {
    setActiveFilter(filter);
    setPage(1);
  };

  const items: CreditLedgerDTO[] = data?.items || [];
  const pagination = data?.pagination;

  // Complete plan filters: All plans are always available in the filter dropdown
  // to prevent conditional omission or missing plan filters.
  const filterOptions: { value: LedgerFilterType; label: string }[] = useMemo(
    () => [
      { value: 'ALL', label: 'All Activities' },
      { value: 'MORE_ADS', label: 'Ad Posting' },
      { value: 'SPOTLIGHT', label: 'Spotlight' },
      { value: 'TOP_AD', label: 'Top Ads' },
      { value: 'SMART_ALERT', label: 'Smart Alerts' },
    ],
    [],
  );

  const filteredItems = useMemo(
    () => items.filter((tx) => matchesLedgerFilter(activeFilter, tx.entitlementType, tx.reason)),
    [items, activeFilter],
  );

  return (
    <div className="space-y-3">
      {/* Header: title + compact filter dropdown with balanced typography */}
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-body-lg sm:text-h4 font-bold text-foreground">My Usage</h4>
        <Select
          value={activeFilter}
          onValueChange={(v) => handleFilterChange(v as LedgerFilterType)}
        >
          <SelectTrigger
            size="sm"
            className="h-8 w-auto min-w-[120px] max-w-[160px] text-caption font-medium border-border/60 bg-muted/30 px-2.5 rounded-lg focus:ring-primary [&_[data-slot=select-value]]:text-caption"
            aria-label="Filter activities"
          >
            <SelectValue placeholder="All Activities" />
          </SelectTrigger>
          <SelectContent className="text-caption">
            {filterOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-caption">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-2.5 animate-pulse">
          <div className="h-14 bg-muted/60 rounded-xl" />
          <div className="h-14 bg-muted/60 rounded-xl" />
        </div>
      )}

      {/* Error */}
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

      {/* Empty */}
      {!isLoading && filteredItems.length === 0 && (
        <div className="text-center py-8 text-caption text-muted-foreground border border-dashed border-border rounded-xl">
          No activity found.
        </div>
      )}

      {/* Transactions */}
      {!isLoading && filteredItems.length > 0 && (
        <>
          <CreditLedgerDesktopTable items={filteredItems} onRowClick={setSelectedTx} />

          {/* Mobile Cards: Clean, non-redundant hierarchy */}
          <div className="md:hidden flex flex-col gap-2.5">
            {filteredItems.map((tx) => {
              const isDebit = tx.type === 'DEBIT';
              const absAmount = Math.abs(tx.amount);
              const adHref = getListingDetailHref(tx);

              return (
                <div
                  key={tx.transactionId}
                  onClick={() => setSelectedTx(tx)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedTx(tx);
                    }
                  }}
                  className="p-3.5 rounded-xl border border-border/50 bg-card hover:bg-muted/20 active:scale-[0.99] transition-[background-color,transform] space-y-2 shadow-2xs cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label="View activity details"
                >
                  {/* Row 1: Plan Title + Amount Badge (Zero duplicate words) */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-foreground text-body leading-snug">
                      {formatActivityCategory(tx)}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-tiny font-bold shrink-0 ${
                        isDebit
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {isDebit ? (
                        <>
                          <ArrowDown className="w-3 h-3" />-{absAmount} USED
                        </>
                      ) : (
                        <>
                          <ArrowUp className="w-3 h-3" />+{absAmount} ADDED
                        </>
                      )}
                    </span>
                  </div>

                  {/* Row 2: Listing link (dedicated line with full width) */}
                  {adHref && tx.adTitle && (
                    <div className="text-caption">
                      <Link
                        href={adHref}
                        onClick={(e) => e.stopPropagation()}
                        className="font-medium text-primary hover:underline line-clamp-1"
                      >
                        {tx.adTitle}
                      </Link>
                    </div>
                  )}

                  {/* Row 3: Date on left, Validity & Status on right */}
                  <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-border/30 text-tiny text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      {formatAppliedDateTime(tx.createdAt)}
                      <Info className="w-3 h-3 opacity-60 shrink-0" />
                    </span>

                    <div className="flex items-center gap-2 shrink-0">
                      {tx.validityText && (
                        <span>{tx.validityText}</span>
                      )}
                      {renderTransactionStatus(tx)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination positioned at bottom */}
          {pagination && pagination.totalPages > 1 && (
            <div className="pt-2">
              <Pagination
                currentPage={page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                pageSize={limit}
                itemLabel="activities"
                onPageChange={setPage}
                className="border border-border/40 rounded-xl px-3 py-2 bg-muted/30"
              />
            </div>
          )}
        </>
      )}

      {/* Detail Popup */}
      <CreditLedgerDetailPopup
        tx={selectedTx}
        open={!!selectedTx}
        onClose={() => setSelectedTx(null)}
      />
    </div>
  );
};
