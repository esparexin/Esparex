import React, { useState } from 'react';
import { useCreditLedgerHistory } from '@/hooks/useCreditLedgerHistory';

export const CreditLedgerHistoryCard: React.FC = () => {
  const [page, setPage] = useState(1);
  const limit = 10;
  const { data, isLoading, isError, refetch } = useCreditLedgerHistory(page, limit);

  const items = data?.items || [];
  const pagination = data?.pagination;

  return (
    <div className="bg-surface rounded-xl p-5 border border-border/60 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">
          Credit Ledger & Audit History
        </h4>
        {pagination && (
          <span className="text-xs text-muted-foreground">
            Total Transactions: {pagination.total}
          </span>
        )}
      </div>

      {isLoading && (
        <div className="space-y-2 animate-pulse">
          <div className="h-10 bg-muted rounded-lg" />
          <div className="h-10 bg-muted rounded-lg" />
          <div className="h-10 bg-muted rounded-lg" />
        </div>
      )}

      {isError && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-xs flex justify-between items-center">
          <span>Failed to load transaction history.</span>
          <button onClick={() => void refetch()} className="font-bold underline">
            Retry
          </button>
        </div>
      )}

      {!isLoading && items.length === 0 && (
        <div className="text-center py-6 text-xs text-muted-foreground">
          No credit transactions recorded yet.
        </div>
      )}

      {!isLoading && items.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border/40 text-muted-foreground font-semibold">
                <th className="py-2 px-3">Date</th>
                <th className="py-2 px-3">Type</th>
                <th className="py-2 px-3">Pool</th>
                <th className="py-2 px-3">Amount</th>
                <th className="py-2 px-3">Reason</th>
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
                        className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          isDebit
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-foreground">
                      {tx.creditPool.replace('_', ' ')}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-foreground">
                      {isDebit ? `-${tx.amount}` : `+${tx.amount}`}
                    </td>
                    <td className="py-2.5 px-3 text-muted-foreground max-w-xs truncate">
                      {tx.reason}
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
        <div className="flex items-center justify-between pt-2 border-t border-border/40 text-xs">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded border border-border bg-background hover:bg-muted disabled:opacity-50 font-medium"
          >
            Previous
          </button>
          <span className="text-muted-foreground font-medium">
            Page {page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page === pagination.totalPages}
            className="px-3 py-1.5 rounded border border-border bg-background hover:bg-muted disabled:opacity-50 font-medium"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
