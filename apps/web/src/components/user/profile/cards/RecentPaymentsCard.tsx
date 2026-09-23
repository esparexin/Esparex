import React, { useState, useMemo } from 'react';
import type { PaymentSummaryDTO } from '@esparex/contracts';
import { downloadInvoiceFile } from '@/lib/api/user/payments';
import { Eye, Download, FileText, Button, Card } from "@esparex/ui";
import { InvoicePreviewDialog } from '../dialogs/InvoicePreviewDialog';

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
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
            : isFailed
            ? 'bg-destructive/10 text-destructive'
            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
        }`}
      >
        {isPaid ? 'PAID' : status}
      </span>
    );
  };

  if (validPayments.length === 0) {
    return (
      <Card className="rounded-2xl border border-border/80 bg-card shadow-xs p-8 sm:p-12 text-center flex flex-col items-center justify-center">
        <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground border border-border/60 mb-3.5">
          <FileText className="h-6 w-6 sm:h-7 sm:w-7" />
        </div>
        <h3 className="text-body-lg font-semibold text-foreground">No Payment Receipts Yet</h3>
        {onBrowsePlans && (
          <Button
            type="button"
            onClick={onBrowsePlans}
            className="mt-4 h-10 px-6 rounded-xl font-semibold text-body shadow-xs inline-flex items-center justify-center gap-2 cursor-pointer"
          >
            Browse Plans
          </Button>
        )}
      </Card>
    );
  }

  return (
    <>
      <div className="bg-transparent sm:bg-surface rounded-none sm:rounded-xl p-0 sm:p-4 border-0 sm:border border-border/60 shadow-none sm:shadow-2xs space-y-3">
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

        {/* Desktop View: Clean Table (hidden on mobile) */}
        <div className="hidden md:block max-h-[360px] overflow-y-auto relative rounded-lg border border-border/40">
          <table className="w-full text-left text-caption">
            <thead className="sticky top-0 z-10 bg-surface shadow-2xs">
              <tr className="border-b border-border/40 text-muted-foreground font-semibold">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Order Description</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Invoice Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              {validPayments.map((pay) => (
                <tr key={pay.orderId} className="hover:bg-muted/30 transition-colors">
                  <td className="py-2.5 px-3 whitespace-nowrap text-muted-foreground">
                    {formatInvoiceDate(pay.createdAt)}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-foreground max-w-xs truncate">
                    {formatOrderDescription(pay.description)}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-foreground tabular-nums">
                    ₹{pay.amount.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3">
                    {renderStatusBadge(pay.status)}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {pay.status === 'SUCCESS' ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenPreview(pay)}
                          className="p-1.5 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary flex items-center gap-1"
                          aria-label={`Preview invoice for order ${pay.orderId}`}
                          title="Preview Invoice"
                        >
                          <Eye className="w-4 h-4 shrink-0" />
                          <span className="text-tiny font-semibold hidden sm:inline">Preview</span>
                        </button>
                        <button
                          type="button"
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

        {/* Mobile View: Unified List with subtle dividers (hidden on desktop) */}
        <div className="md:hidden divide-y divide-border/40 rounded-2xl border border-border/60 bg-card overflow-hidden shadow-xs">
          {validPayments.map((pay) => (
            <div
              key={pay.orderId}
              className="p-3 sm:p-3.5 space-y-2 hover:bg-muted/10 transition-colors"
            >
              {/* Top Row: Date, Status Badge, and Amount */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-caption text-muted-foreground font-medium whitespace-nowrap">
                    {formatInvoiceDate(pay.createdAt)}
                  </span>
                  {renderStatusBadge(pay.status)}
                </div>
                <span className="text-body sm:text-body-lg font-bold text-foreground tabular-nums shrink-0">
                  ₹{pay.amount.toLocaleString()}
                </span>
              </div>

              {/* Bottom Row: Description, Order ID, and Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-border/30">
                <div className="min-w-0 flex items-center gap-1.5 truncate">
                  <span className="text-small font-semibold text-foreground truncate">
                    {formatOrderDescription(pay.description)}
                  </span>
                  <span className="text-tiny text-muted-foreground font-mono shrink-0">
                    #{pay.orderId.slice(-8).toUpperCase()}
                  </span>
                </div>

                {pay.status === 'SUCCESS' ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenPreview(pay)}
                      className="h-7 px-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary flex items-center gap-1 text-caption font-semibold"
                      aria-label={`Preview invoice for order ${pay.orderId}`}
                    >
                      <Eye className="w-3.5 h-3.5 shrink-0" />
                      <span>Preview</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void downloadInvoiceFile(pay.orderId)}
                      className="h-7 px-2 rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary flex items-center gap-1 text-caption font-semibold"
                      aria-label={`Download invoice file for order ${pay.orderId}`}
                    >
                      <Download className="w-3.5 h-3.5 shrink-0" />
                      <span>PDF</span>
                    </button>
                  </div>
                ) : (
                  <span className="text-tiny text-muted-foreground/60 font-medium">No Invoice</span>
                )}
              </div>
            </div>
          ))}
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
