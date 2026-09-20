import React, { useState } from 'react';
import { Pagination, ArrowUp, ArrowDown } from '@esparex/ui';
import { useCreditLedgerHistory } from '@/hooks/useCreditLedgerHistory';

const formatReason = (reason?: string) => {
  if (!reason) return 'Credit Activity';
  // Strip raw 24-character MongoDB ObjectIDs
  const clean = reason.replace(/[0-9a-fA-F]{24}/g, '').replace(/\s+to\s+ad\s*/i, ' ').trim();
  const lower = clean.toLowerCase();
  if (lower.includes('spotlight')) return 'Spotlight Boost Applied';
  if (lower.includes('top_ad') || lower.includes('top ad')) return 'Top Ad Boost Applied';
  if (lower.includes('smart_alert') || lower.includes('smart alert')) return 'Smart Alert Slot Consumed';
  if (lower.includes('alert')) return 'Smart Alert Activity';
  if (lower.includes('post') || lower.includes('ad_posting')) return 'Ad Posting Credit Used';
  if (lower.includes('pack') || lower.includes('purchase')) return 'Credit Pack Purchased';
  if (lower.includes('plan')) return 'Plan Entitlement Applied';
  if (lower.includes('credit transaction')) return 'Credit Adjustment';
  return clean || 'Credit Activity';
};

export const CreditLedgerHistoryCard: React.FC = () => {
  const [page, setPage] = useState(1);
  const limit = 10;
  const { data, isLoading, isError, refetch } = useCreditLedgerHistory(page, limit);

  const items = data?.items || [];
  const pagination = data?.pagination;

  return (
    <div className="bg-surface rounded-2xl p-4 sm:p-5 border border-border/60 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-caption sm:text-body font-bold text-foreground uppercase tracking-wider">
          Credit History
        </h4>
        {pagination && (
          <span className="text-tiny text-muted-foreground font-medium">
            Total Activities: {pagination.total}
          </span>
        )}
      </div>

      {isLoading && (
        <div className="space-y-2.5 animate-pulse">
          <div className="h-12 bg-muted/60 rounded-xl" />
          <div className="h-12 bg-muted/60 rounded-xl" />
          <div className="h-12 bg-muted/60 rounded-xl" />
        </div>
      )}

      {isError && (
        <div className="p-3.5 bg-destructive/10 text-destructive rounded-xl text-tiny flex justify-between items-center border border-destructive/20">
          <span>Failed to load transaction history.</span>
          <button onClick={() => void refetch()} className="font-bold underline cursor-pointer hover:opacity-80">
            Retry
          </button>
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <div className="text-center py-8 text-tiny text-muted-foreground">
          No credit transactions recorded yet.
        </div>
      )}

      {!isLoading && items.length > 0 && (
        <>
          {/* DESKTOP TABLE VIEW (md: and up) */}
          <div className="hidden md:block max-h-[360px] overflow-y-auto overflow-x-auto relative rounded-xl border border-border/40">
            <table className="w-full text-left text-caption">
              <thead className="sticky top-0 z-10 bg-surface border-b border-border/40 shadow-2xs">
                <tr className="text-muted-foreground font-semibold">
                  <th className="py-2.5 px-3.5">Date</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Credit Pool</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3.5">Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {items.map((tx) => {
                  const isDebit = tx.type === 'DEBIT';

                  return (
                    <tr key={tx.transactionId} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-3.5 whitespace-nowrap text-muted-foreground text-tiny">
                        {new Date(tx.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-tiny font-bold ${
                            isDebit
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {isDebit ? 'USED' : 'ADDED'}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-foreground capitalize text-tiny">
                        {tx.creditPool.toLowerCase().replace('_', ' ')}
                      </td>
                      <td className="py-3 px-3 font-bold text-caption text-foreground">
                        {isDebit ? `-${Math.abs(tx.amount)}` : `+${Math.abs(tx.amount)}`}
                      </td>
                      <td className="py-3 px-3.5 text-foreground-secondary text-caption max-w-xs truncate">
                        {formatReason(tx.reason)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* MOBILE TOUCH-FRIENDLY ACTIVITY CARDS (< md:) */}
          <div className="md:hidden flex flex-col gap-2.5">
            {items.map((tx) => {
              const isDebit = tx.type === 'DEBIT';
              const cleanReason = formatReason(tx.reason);
              const absAmount = Math.abs(tx.amount);

              return (
                <div
                  key={tx.transactionId}
                  className="p-3 rounded-xl border border-border/40 bg-card space-y-2 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-tiny text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-tiny font-bold ${
                        isDebit
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {isDebit ? (
                        <>
                          <ArrowDown className="w-3 h-3" /> -{absAmount} USED
                        </>
                      ) : (
                        <>
                          <ArrowUp className="w-3 h-3" /> +{absAmount} ADDED
                        </>
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-caption">
                    <span className="font-semibold text-foreground truncate">
                      {cleanReason}
                    </span>
                    <span className="text-tiny font-medium text-muted-foreground capitalize shrink-0">
                      {tx.creditPool.toLowerCase().replace('_', ' ')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Pagination Controls */}
      {pagination && (
        <Pagination
          currentPage={page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          pageSize={limit}
          onPageChange={setPage}
          itemLabel="activities"
          className="pt-2 border-t border-border/40"
        />
      )}
    </div>
  );
};

