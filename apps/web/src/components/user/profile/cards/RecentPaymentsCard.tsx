import React, { useState, useMemo } from 'react';
import type { PaymentSummaryDTO } from '@esparex/contracts';
import { downloadInvoiceFile } from '@/lib/api/user/payments';
import { Eye, Download, FileText, Button } from "@esparex/ui";
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
      <div className="bg-surface rounded-xl p-6 sm:p-8 border border-border/60 shadow-2xs text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
          <FileText className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="text-body-lg font-semibold text-foreground">No Payment Receipts Yet</h4>
          <p className="text-caption text-muted-foreground max-w-sm mx-auto">
            When you upgrade your plan or purchase credit packs, your official tax invoices and receipts will appear here.
          </p>
        </div>
        {onBrowsePlans && (
          <div className="pt-2">
            <Button
              type="button"
              onClick={onBrowsePlans}
              className="h-9 px-4 text-body font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
            >
              Browse Plans
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="bg-surface rounded-xl p-4 border border-border/60 shadow-2xs space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
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
                  <td className="py-2.5 px-3 font-bold text-foreground">
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

        {/* Mobile View: Responsive Cards (hidden on desktop) */}
        <div className="md:hidden flex flex-col gap-2.5">
          {validPayments.map((pay) => (
            <div
              key={pay.orderId}
              className="p-3.5 rounded-xl border border-border/50 bg-card space-y-2.5 shadow-2xs"
            >
              {/* Top Row: Date & Status Badge */}
              <div className="flex items-center justify-between gap-2 text-caption">
                <span className="text-muted-foreground font-medium">
                  {formatInvoiceDate(pay.createdAt)}
                </span>
                {renderStatusBadge(pay.status)}
              </div>

              {/* Middle Row: Plan Name & Amount */}
              <div className="flex items-start justify-between gap-2">
                <div className="font-semibold text-foreground text-small sm:text-body leading-snug">
                  {formatOrderDescription(pay.description)}
                </div>
                <div className="font-bold text-foreground text-small sm:text-body shrink-0">
                  ₹{pay.amount.toLocaleString()}
                </div>
              </div>

              {/* Bottom Row: Order ID & Actions */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/30 text-caption">
                <span className="text-tiny text-muted-foreground font-mono">
                  #{pay.orderId.slice(-8).toUpperCase()}
                </span>

                {pay.status === 'SUCCESS' ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenPreview(pay)}
                      className="h-7.5 px-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary flex items-center gap-1 text-tiny sm:text-caption font-semibold"
                      aria-label={`Preview invoice for order ${pay.orderId}`}
                    >
                      <Eye className="w-3.5 h-3.5 shrink-0" />
                      <span>Preview</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void downloadInvoiceFile(pay.orderId)}
                      className="h-7.5 px-2 rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary flex items-center gap-1 text-tiny sm:text-caption font-semibold"
                      aria-label={`Download invoice file for order ${pay.orderId}`}
                    >
                      <Download className="w-3.5 h-3.5 shrink-0" />
                      <span>PDF</span>
                    </button>
                  </div>
                ) : (
                  <span className="text-tiny text-muted-foreground/60">No Invoice</span>
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
