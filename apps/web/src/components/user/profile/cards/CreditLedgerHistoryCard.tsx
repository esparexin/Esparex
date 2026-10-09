import React, { useState, useMemo } from 'react';
import type { CreditLedgerDTO, CreditPackDTO } from '@esparex/contracts';
import {
  Pagination,
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@esparex/ui';
import { useCreditLedgerHistory } from '@/hooks/useCreditLedgerHistory';
import {
  matchesLedgerFilter,
  type LedgerFilterType,
} from './CreditLedgerFormatters';
import { CreditLedgerTable } from './CreditLedgerTable';
import { CreditLedgerDetailPopup } from './CreditLedgerDetailPopup';

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

  const filteredItems = useMemo(() => {
    const items = data?.items || [];
    return items.filter((tx) => matchesLedgerFilter(activeFilter, tx.entitlementType, tx.reason));
  }, [data?.items, activeFilter]);

  return (
    <div className="space-y-3">
      {/* Header: title + compact filter dropdown with balanced typography */}
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-body-lg sm:text-h4 font-semibold text-foreground">My Usage</h4>
        <Select
          value={activeFilter}
          onValueChange={(v) => handleFilterChange(v as LedgerFilterType)}
        >
          <SelectTrigger
            size="sm"
            className="h-9 w-auto min-w-[130px] max-w-[180px] font-medium border-border/60 bg-muted/30 px-3 rounded-lg focus:ring-primary"
            aria-label="Filter activities"
          >
            <SelectValue placeholder="All Activities" />
          </SelectTrigger>
          <SelectContent className="text-body">
            {filterOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-body">
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
        <div className="p-3.5 bg-destructive/10 text-destructive rounded-xl text-caption flex justify-between items-center border border-destructive/20">
          <span>Failed to load transaction history.</span>
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={() => void refetch()}
            className="font-bold underline cursor-pointer hover:opacity-80 p-0 h-auto text-caption text-destructive"
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
          <CreditLedgerTable items={filteredItems} onRowClick={setSelectedTx} />

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
