import React, { useState, useMemo } from 'react';
import type { PaymentSummaryDTO } from '@esparex/contracts';
import { downloadInvoiceFile } from '@/lib/api/user/payments';
import { Eye, Download, FileText, Button, Card, EmptyState } from "@esparex/ui";
import { InvoicePreviewDialog } from '../dialogs/InvoicePreviewDialog';
import { formatStableDate, formatStableNumber } from '@/lib/formatters';

interface RecentPaymentsCardProps {
  payments: PaymentSummaryDTO[];
  onBrowsePlans?: () => void;
}

const formatOrderDescription = (desc?: string): string => {
  if (!desc) return 'Plan & Credit Purchase';
  // Strip internal pipe metadata like "| Credit: smartAlertSlots=+1" or "| Debit: smartAlertSlots=-1"
  const cleaned = (desc.split('|')[0] ?? '').trim();

  if (!cleaned) return 'Plan & Credit Purchase';
  if (cleaned.includes('New_user_Plan_10')) return 'Smart Alert 5-Pack';
  if (cleaned.includes('New_user_Plan')) return 'Plan & Credit Top-up';

  return cleaned.replace(/_/g, ' ');
};

const formatInvoiceDate = (dateStr?: string): string => {
  if (!dateStr) return '—';
  try {
    return formatStableDate(dateStr);
  } catch {
    return String(dateStr);
  }
};

export const RecentPaymentsCard: React.FC<RecentPaymentsCardProps> = ({ payments, onBrowsePlans }) => {
  const [selectedInvoice, setSelectedInvoice] = useState<PaymentSummaryDTO | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

  const validPayments = useMemo(() => {
    return (payments || []).filter((pay) => {
      // Invoices & Receipts represent actual financial transactions.
      // Free plan top-ups (₹0) and internal quota adjustments belong in My Usage.
      return pay.amount > 0;
    });
  }, [payments]);

  const handleOpenPreview = (pay: PaymentSummaryDTO) => {
    setSelectedInvoice(pay);
    setIsPreviewOpen(true);
  };

  const renderStatusBadge = (status: string) => {
    const isPaid = status === 'SUCCESS';
    const isFailed = status === 'FAILED';
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-tiny font-bold ${
          isPaid
            ? 'bg-success/10 text-success'
            : isFailed
            ? 'bg-destructive/10 text-destructive'
            : 'bg-warning/10 text-warning'
        }`}
      >
        {isPaid ? 'PAID' : status}
      </span>
    );
  };

  if (validPayments.length === 0) {
    return (
      <Card className="rounded-2xl border border-border/80 bg-card shadow-sm">
        <EmptyState
          icon={FileText}
          title="No Payment Receipts Yet"
          description="Receipts for plan purchases and spotlight promotions will appear here."
          action={
            onBrowsePlans ? (
              <Button
                type="button"
                onClick={onBrowsePlans}
                className="h-10 rounded-xl px-6 font-semibold text-body shadow-sm cursor-pointer"
              >
                Browse Plans
              </Button>
            ) : undefined
          }
        />
      </Card>
    );
  }

  return (
    <>
      <div className="bg-transparent sm:bg-surface rounded-none sm:rounded-xl p-0 sm:p-4 border-0 sm:border border-border/60 shadow-none sm:shadow-sm space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between pb-1 sm:pb-0">
          <h4 className="text-body-lg font-semibold text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary shrink-0" />
            Invoices & Receipts
            <span className="text-tiny px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold">
              {validPayments.length}
            </span>
          </h4>
          <span className="text-tiny text-muted-foreground hidden sm:inline">
            Showing last {validPayments.length} {validPayments.length === 1 ? 'order' : 'orders'}
          </span>
        </div>

        {/* Single-Instance Responsive Table */}
        <div className="overflow-x-auto relative rounded-xl border border-border/40 bg-card shadow-sm">
          <table className="w-full text-left text-caption">
            <thead className="sticky top-0 z-10 bg-surface shadow-sm">
              <tr className="border-b border-border/40 text-muted-foreground font-semibold text-tiny">
                <th scope="col" className="py-2.5 px-3">Date</th>
                <th scope="col" className="py-2.5 px-3">Order Description</th>
                <th scope="col" className="py-2.5 px-3">Amount</th>
                <th scope="col" className="py-2.5 px-3">Status</th>
                <th scope="col" className="py-2.5 px-3 text-right">Invoice Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {validPayments.map((pay) => (
                <tr key={pay.orderId} className="hover:bg-muted/30 transition-colors">
                  {/* Date */}
                  <td className="py-2.5 px-3 whitespace-nowrap text-muted-foreground align-middle">
                    <div>{formatInvoiceDate(pay.createdAt)}</div>
                  </td>

                  {/* Description & Order ID */}
                  <td className="py-2.5 px-3 font-medium text-foreground max-w-xs align-middle">
                    <div className="truncate">{formatOrderDescription(pay.description)}</div>
                    <div className="text-tiny text-muted-foreground font-mono mt-0.5">
                      #{pay.orderId.slice(-8).toUpperCase()}
                    </div>
                  </td>

                  {/* Amount */}
                  <td className="py-2.5 px-3 font-bold text-foreground tabular-nums whitespace-nowrap align-middle">
                    ₹{formatStableNumber(pay.amount)}
                  </td>

                  {/* Status */}
                  <td className="py-2.5 px-3 align-middle">
                    {renderStatusBadge(pay.status)}
                  </td>

                  {/* Actions */}
                  <td className="py-2.5 px-3 text-right align-middle">
                    {pay.status === 'SUCCESS' ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenPreview(pay)}
                          className="p-1.5 sm:px-2 sm:py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary flex items-center gap-1 text-tiny font-semibold"
                          aria-label={`Preview invoice for order ${pay.orderId}`}
                          title="Preview Invoice"
                        >
                          <Eye className="w-3.5 h-3.5 shrink-0" />
                          <span className="hidden sm:inline">Preview</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => void downloadInvoiceFile(pay.orderId)}
                          className="p-1.5 sm:px-2 sm:py-1 rounded-md bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary flex items-center gap-1 text-tiny font-semibold"
                          aria-label={`Download invoice file for order ${pay.orderId}`}
                          title="Download Invoice PDF"
                        >
                          <Download className="w-3.5 h-3.5 shrink-0" />
                          <span>PDF</span>
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
