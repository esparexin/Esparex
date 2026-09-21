import React from 'react';
import Link from 'next/link';
import type { CreditLedgerDTO } from '@esparex/contracts';
import {
  formatActivityName,
  formatAppliedDateTime,
  renderTransactionStatus,
} from './CreditLedgerFormatters';

interface CreditLedgerDesktopTableProps {
  items: CreditLedgerDTO[];
}

export const CreditLedgerDesktopTable: React.FC<CreditLedgerDesktopTableProps> = ({ items }) => {
  return (
    <div className="hidden md:block overflow-x-auto rounded-xl border border-border/50 bg-card shadow-2xs">
      <table className="w-full text-left text-caption">
        <thead className="bg-muted/40 border-b border-border/40 text-muted-foreground font-semibold text-tiny">
          <tr>
            <th scope="col" className="py-2.5 px-3.5 whitespace-nowrap">Date</th>
            <th scope="col" className="py-2.5 px-3">Credit Activity</th>
            <th scope="col" className="py-2.5 px-3">Applied to Listing</th>
            <th scope="col" className="py-2.5 px-3">Validity</th>
            <th scope="col" className="py-2.5 px-3.5">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/20">
          {items.map((tx) => {
            const isDebit = tx.type === 'DEBIT';
            const absAmount = Math.abs(tx.amount);
            const adTarget = tx.adSlug || tx.listingId;

            return (
              <tr key={tx.transactionId} className="hover:bg-muted/20 transition-colors">
                <td className="py-3 px-3.5 whitespace-nowrap text-muted-foreground text-tiny">
                  {formatAppliedDateTime(tx.createdAt)}
                </td>
                <td className="py-3 px-3">
                  <div className="font-semibold text-foreground text-caption">
                    {formatActivityName(tx)}
                  </div>
                  <span
                    className={`inline-flex items-center px-1.5 py-0.2 rounded text-tiny font-bold ${
                      isDebit
                        ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {isDebit ? `-${absAmount} USED` : `+${absAmount} ADDED`}
                  </span>
                </td>
                <td className="py-3 px-3">
                  {adTarget ? (
                    <Link
                      href={`/ads/${adTarget}`}
                      className="font-medium text-primary hover:underline line-clamp-1 max-w-xs"
                    >
                      {tx.adTitle || 'View Ad'}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="py-3 px-3 text-tiny text-foreground-secondary whitespace-nowrap">
                  {tx.validityText || (isDebit ? '1 day' : '—')}
                </td>
                <td className="py-3 px-3.5 whitespace-nowrap">{renderTransactionStatus(tx)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
