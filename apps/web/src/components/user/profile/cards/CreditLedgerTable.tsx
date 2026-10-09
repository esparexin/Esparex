import React from 'react';
import Link from 'next/link';
import type { CreditLedgerDTO } from '@esparex/contracts';
import {
  formatActivityCategory,
  formatAppliedDateTime,
  renderTransactionStatus,
  getListingDetailHref,
} from './CreditLedgerFormatters';
import { ArrowDown, ArrowUp, Info } from '@esparex/ui';

export interface CreditLedgerTableProps {
  items: CreditLedgerDTO[];
  onRowClick: (tx: CreditLedgerDTO) => void;
}

/**
 * Single-Instance Responsive Credit Ledger Table
 *
 * Renders a unified responsive table adapting from mobile (stacked metadata)
 * to desktop (expanded 5-column layout) without DOM duplication.
 */
export const CreditLedgerTable: React.FC<CreditLedgerTableProps> = ({ items, onRowClick }) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/50 bg-card shadow-sm">
      <table className="w-full text-left text-caption">
        <thead className="bg-muted/40 border-b border-border/40 text-muted-foreground font-semibold text-tiny">
          <tr>
            <th scope="col" className="py-2.5 px-3 sm:px-3.5 whitespace-nowrap">Date</th>
            <th scope="col" className="py-2.5 px-3">Plan</th>
            <th scope="col" className="py-2.5 px-3 hidden sm:table-cell">Listing</th>
            <th scope="col" className="py-2.5 px-3 hidden md:table-cell">Validity</th>
            <th scope="col" className="py-2.5 px-3 sm:px-3.5">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/20">
          {items.map((tx) => {
            const isDebit = tx.type === 'DEBIT';
            const absAmount = Math.abs(tx.amount);
            const adHref = getListingDetailHref(tx);

            return (
              <tr key={tx.transactionId} className="hover:bg-muted/20 transition-colors group">
                {/* Date */}
                <td className="py-2.5 px-3 sm:px-3.5 whitespace-nowrap text-muted-foreground text-tiny align-top">
                  <button
                    type="button"
                    onClick={() => onRowClick(tx)}
                    title="View activity details"
                    aria-label={`View details for ${formatActivityCategory(tx)}`}
                    className="inline-flex items-center gap-1.5 text-left hover:text-primary transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                  >
                    {formatAppliedDateTime(tx.createdAt)}
                    <Info className="w-3.5 h-3.5 opacity-60 sm:opacity-0 sm:group-hover:opacity-60 transition-opacity shrink-0" />
                  </button>
                  {tx.validityText && (
                    <div className="text-tiny text-muted-foreground md:hidden mt-0.5">
                      {tx.validityText}
                    </div>
                  )}
                </td>

                {/* Plan & Amount */}
                <td className="py-2.5 px-3 align-top">
                  <button
                    type="button"
                    onClick={() => onRowClick(tx)}
                    title="View activity details"
                    className="text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                  >
                    <div className="font-semibold text-foreground text-caption hover:text-primary transition-colors">
                      {formatActivityCategory(tx)}
                    </div>
                    <span
                      className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-tiny font-bold tabular-nums mt-0.5 ${
                        isDebit
                          ? 'bg-warning/10 text-warning'
                          : 'bg-success/10 text-success'
                      }`}
                    >
                      {isDebit ? (
                        <><ArrowDown className="w-3 h-3" />-{absAmount} USED</>
                      ) : (
                        <><ArrowUp className="w-3 h-3" />+{absAmount} ADDED</>
                      )}
                    </span>
                  </button>
                  {adHref && tx.adTitle && (
                    <div className="text-caption mt-1 sm:hidden">
                      <Link
                        href={adHref}
                        className="font-medium text-primary hover:underline line-clamp-1"
                      >
                        {tx.adTitle}
                      </Link>
                    </div>
                  )}
                </td>

                {/* Listing (sm+) */}
                <td className="py-2.5 px-3 hidden sm:table-cell align-top">
                  {adHref ? (
                    <Link
                      href={adHref}
                      className="font-medium text-primary hover:underline line-clamp-1 max-w-xs"
                    >
                      {tx.adTitle || 'View Ad'}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>

                {/* Validity (md+) */}
                <td className="py-2.5 px-3 text-tiny text-foreground-secondary whitespace-nowrap hidden md:table-cell align-top">
                  {tx.validityText || '—'}
                </td>

                {/* Status */}
                <td className="py-2.5 px-3 sm:px-3.5 whitespace-nowrap align-top">
                  {renderTransactionStatus(tx)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
