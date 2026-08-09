import React from 'react';
import type { PaymentSummaryDTO } from '@esparex/contracts';
import { downloadInvoice, downloadInvoiceFile } from '@/lib/api/user/payments';
import { Eye, Download } from '@/icons/IconRegistry';

interface RecentPaymentsCardProps {
  payments: PaymentSummaryDTO[];
}

export const RecentPaymentsCard: React.FC<RecentPaymentsCardProps> = ({ payments }) => {
  if (!payments || payments.length === 0) {
    return (
      <div className="bg-surface rounded-xl p-5 border border-border/60 shadow-2xs space-y-3">
        <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">
          Payment History & Invoices
        </h4>
        <div className="text-center py-4 text-xs text-muted-foreground">
          No payment transactions found.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl p-5 border border-border/60 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">
          Payment History & Invoices
        </h4>
        <span className="text-xs text-muted-foreground">
          Showing last {payments.length} orders
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-border/40 text-muted-foreground font-semibold">
              <th className="py-2 px-3">Date</th>
              <th className="py-2 px-3">Description</th>
              <th className="py-2 px-3">Amount</th>
              <th className="py-2 px-3">Status</th>
              <th className="py-2 px-3 text-right">Invoice Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/20">
            {payments.map((pay) => (
              <tr key={pay.orderId} className="hover:bg-muted/40 transition-colors">
                <td className="py-2.5 px-3 whitespace-nowrap text-muted-foreground">
                  {new Date(pay.createdAt).toLocaleDateString()}
                </td>
                <td className="py-2.5 px-3 font-medium text-foreground max-w-xs truncate">
                  {pay.description}
                </td>
                <td className="py-2.5 px-3 font-bold text-foreground">
                  ₹{pay.amount.toLocaleString()}
                </td>
                <td className="py-2.5 px-3">
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      pay.status === 'SUCCESS'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : pay.status === 'FAILED'
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {pay.status}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-right">
                  {pay.status === 'SUCCESS' ? (
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => void downloadInvoice(pay.orderId)}
                        className="p-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        aria-label={`View invoice for order ${pay.orderId}`}
                        title="View Invoice"
                      >
                        <Eye className="w-4 h-4 shrink-0" />
                      </button>
                      <button
                        onClick={() => void downloadInvoiceFile(pay.orderId)}
                        className="p-1.5 rounded-md bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        aria-label={`Download invoice file for order ${pay.orderId}`}
                        title="Download Invoice"
                      >
                        <Download className="w-4 h-4 shrink-0" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] text-muted-foreground/60 font-medium select-none">
                      No Invoice
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
