import React, { useState } from 'react';
import { useCreditLedgerHistory } from '@/hooks/useCreditLedgerHistory';

const formatReason = (reason?: string) => {
  if (!reason) return 'Credit Activity';
  // Strip raw 24-character MongoDB ObjectIDs
  const clean = reason.replace(/[0-9a-fA-F]{24}/g, '').replace(/\s+to\s+ad\s*/i, ' ').trim();
  if (clean.toLowerCase().includes('spotlight')) return 'Spotlight Boost Applied';
  if (clean.toLowerCase().includes('top_ad') || clean.toLowerCase().includes('top ad')) return 'Top Ad Boost Applied';
  if (clean.toLowerCase().includes('smart_alert') || clean.toLowerCase().includes('alert')) return 'Smart Alert Channel Activated';
  if (clean.toLowerCase().includes('post') || clean.toLowerCase().includes('ad_posting')) return 'Ad Posting Credit Used';
  return clean || 'Credit Activity';
};

export const CreditLedgerHistoryCard: React.FC = () => {
  const [page, setPage] = useState(1);
  const limit = 10;
  const { data, isLoading, isError, refetch } = useCreditLedgerHistory(page, limit);

  const items = data?.items || [];
  const pagination = data?.pagination;

  return (
    <div className="bg-surface rounded-xl p-3.5 sm:p-4 border border-border/60 shadow-2xs space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-caption sm:text-body font-bold text-foreground uppercase tracking-wider">
          Credit History
        </h4>
        {pagination && (
          <span className="text-2xs text-muted-foreground">
            Total Activities: {pagination.total}
          </span>
        )}
      </div>

      {isLoading && (
        <div className="space-y-2 animate-pulse">
          <div className="h-9 bg-muted rounded-lg" />
          <div className="h-9 bg-muted rounded-lg" />
        </div>
      )}

      {isError && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-2xs flex justify-between items-center">
          <span>Failed to load transaction history.</span>
          <button onClick={() => void refetch()} className="font-bold underline cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <div className="text-center py-5 text-2xs text-muted-foreground">
          No credit transactions recorded yet.
        </div>
      )}

      {!isLoading && items.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-caption">
            <thead>
              <tr className="border-b border-border/40 text-muted-foreground font-semibold">
                <th className="py-2 px-3">Date</th>
                <th className="py-2 px-3">Type</th>
                <th className="py-2 px-3">Credit Pool</th>
                <th className="py-2 px-3">Amount</th>
                <th className="py-2 px-3">Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {items.map((tx) => {
                const isDebit = tx.type === 'DEBIT';

                return (
                  <tr key={tx.transactionId} className="hover:bg-muted/40 transition-colors">
                    <td className="py-2.5 px-3 whitespace-nowrap text-muted-foreground">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-tiny font-bold ${
                          isDebit
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {isDebit ? 'USED' : 'ADDED'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-foreground">
                      {tx.creditPool.replace('_', ' ')}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-foreground">
                      {isDebit ? `-${tx.amount}` : `+${tx.amount}`}
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground max-w-xs truncate">
                      {formatReason(tx.reason)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 border-t border-border/40 text-2xs">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-2.5 py-1 rounded border border-border bg-background hover:bg-muted disabled:opacity-50 font-medium cursor-pointer"
          >
            Previous
          </button>
          <span className="text-muted-foreground font-medium">
            Page {page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className="px-2.5 py-1 rounded border border-border bg-background hover:bg-muted disabled:opacity-50 font-medium cursor-pointer"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
