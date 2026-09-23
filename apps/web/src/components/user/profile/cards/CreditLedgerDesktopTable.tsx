import React from 'react';
import Link from 'next/link';
import type { CreditLedgerDTO } from '@esparex/contracts';
import {
  formatActivityCategory,
  formatAppliedDateTime,
  renderTransactionStatus,
  getListingDetailHref,
} from './CreditLedgerFormatters';
import { Info } from '@esparex/ui';

interface CreditLedgerDesktopTableProps {
  items: CreditLedgerDTO[];
  onRowClick: (tx: CreditLedgerDTO) => void;
}

export const CreditLedgerDesktopTable: React.FC<CreditLedgerDesktopTableProps> = ({ items, onRowClick }) => {
  return (
    <div className="hidden md:block overflow-x-auto rounded-xl border border-border/50 bg-card shadow-2xs">
      <table className="w-full text-left text-caption">
        <thead className="bg-muted/40 border-b border-border/40 text-muted-foreground font-semibold text-tiny">
          <tr>
            <th scope="col" className="py-2 px-3.5 whitespace-nowrap">Date</th>
            <th scope="col" className="py-2 px-3">Plan</th>
            <th scope="col" className="py-2 px-3">Listing</th>
            <th scope="col" className="py-2 px-3">Validity</th>
            <th scope="col" className="py-2 px-3.5">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/20">
          {items.map((tx) => {
            const isDebit = tx.type === 'DEBIT';
            const absAmount = Math.abs(tx.amount);
            const adHref = getListingDetailHref(tx);

            return (
              <tr key={tx.transactionId} className="hover:bg-muted/20 transition-colors group">
                {/* Date — clickable info trigger */}
                <td className="py-2 px-3.5 whitespace-nowrap text-muted-foreground text-tiny">
                  <button
                    type="button"
                    onClick={() => onRowClick(tx)}
                    title="View activity details"
                    className="inline-flex items-center gap-1.5 text-left hover:text-primary transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
                  >
                    {formatAppliedDateTime(tx.createdAt)}
                    <Info className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
                  </button>
                </td>

                {/* Plan — clickable info trigger */}
                <td className="py-2 px-3">
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
                      className={`inline-flex items-center px-1.5 rounded text-tiny font-bold ${
                        isDebit
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {isDebit ? `-${absAmount} USED` : `+${absAmount} ADDED`}
                    </span>
                  </button>
                </td>

                {/* Listing */}
                <td className="py-2 px-3">
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

                <td className="py-2 px-3 text-tiny text-foreground-secondary whitespace-nowrap">
                  {tx.validityText || '—'}
                </td>

                <td className="py-2 px-3.5 whitespace-nowrap">{renderTransactionStatus(tx)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

