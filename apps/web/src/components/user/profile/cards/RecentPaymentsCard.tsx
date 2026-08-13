import React, { useState } from 'react';
import type { PaymentSummaryDTO } from '@esparex/contracts';
import { downloadInvoiceFile } from '@/lib/api/user/payments';
import { Eye, Download, FileText } from '@/icons/IconRegistry';
import { InvoicePreviewDialog } from '../dialogs/InvoicePreviewDialog';

interface RecentPaymentsCardProps {
  payments: PaymentSummaryDTO[];
}

const formatOrderDescription = (desc?: string) => {
  if (!desc) return 'Plan & Credit Purchase';
  if (desc.includes('New_user_Plan_10')) return 'Smart Alert 5-Pack';
  if (desc.includes('New_user_Plan')) return 'Plan & Credit Top-up';
  return desc.replace(/_/g, ' ');
};

export const RecentPaymentsCard: React.FC<RecentPaymentsCardProps> = ({ payments }) => {
  const [selectedInvoice, setSelectedInvoice] = useState<PaymentSummaryDTO | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

  const handleOpenPreview = (pay: PaymentSummaryDTO) => {
    setSelectedInvoice(pay);
    setIsPreviewOpen(true);
  };

  if (!payments || payments.length === 0) {
    return (
      <div className="bg-surface rounded-xl p-4 sm:p-5 border border-border/60 shadow-2xs text-center space-y-1.5">
        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground mb-1">
          <FileText className="w-4 h-4" />
        </div>
        <h4 className="text-xs sm:text-sm font-bold text-foreground">No Payment Receipts Yet</h4>
        <p className="text-2xs sm:text-xs text-muted-foreground max-w-sm mx-auto">
          When you upgrade your plan or buy credit packs, your tax invoices and download receipts will appear here.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-surface rounded-xl p-3.5 sm:p-4 border border-border/60 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs sm:text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary shrink-0" />
            My Invoices & Receipts ({payments.length})
          </h4>
          <span className="text-2xs text-muted-foreground">
            Showing last {payments.length} orders
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border/40 text-muted-foreground font-semibold">
                <th className="py-2 px-3">Date</th>
                <th className="py-2 px-3">Order Description</th>
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
                    {formatOrderDescription(pay.description)}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-foreground">
                    ₹{pay.amount.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-tiny font-bold ${
                        pay.status === 'SUCCESS'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : pay.status === 'FAILED'
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {pay.status === 'SUCCESS' ? 'PAID' : pay.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {pay.status === 'SUCCESS' ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenPreview(pay)}
                          className="p-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary flex items-center gap-1"
                          aria-label={`Preview invoice for order ${pay.orderId}`}
                          title="Preview Invoice"
                        >
                          <Eye className="w-4 h-4 shrink-0" />
                          <span className="text-tiny font-semibold hidden sm:inline">Preview</span>
                        </button>
                        <button
                          onClick={() => void downloadInvoiceFile(pay.orderId)}
                          className="p-1.5 rounded-md bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary flex items-center gap-1 px-2 py-1"
                          aria-label={`Download invoice file for order ${pay.orderId}`}
                          title="Download Invoice PDF"
                        >
                          <Download className="w-3.5 h-3.5 shrink-0" />
                          <span className="text-tiny font-semibold">PDF</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-tiny text-muted-foreground/60 font-medium select-none">
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

      {selectedInvoice && (
        <InvoicePreviewDialog
          open={isPreviewOpen}
          onOpenChange={setIsPreviewOpen}
          orderId={selectedInvoice.orderId}
          amount={selectedInvoice.amount}
          description={formatOrderDescription(selectedInvoice.description)}
        />
      )}
    </>
  );
};
