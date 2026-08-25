"use client";

import { useEffect, useState, useRef } from "react";
import {
    Button,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@esparex/ui";
import { FileText, Download, Printer, Loader2, CheckCircle2 } from "@/icons/IconRegistry";
import { fetchInvoiceHtml, downloadInvoiceFile } from "@/lib/api/user/payments";
import { notify } from "@/lib/feedback";

interface InvoicePreviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    orderId: string;
    amount?: number;
    description?: string;
}

export function InvoicePreviewDialog({
    open,
    onOpenChange,
    orderId,
    amount,
    description,
}: InvoicePreviewDialogProps) {
    const [html, setHtml] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useEffect(() => {
        if (!open || !orderId) {
            setHtml("");
            return;
        }

        let isSubscribed = true;
        setLoading(true);

        fetchInvoiceHtml(orderId)
            .then((data) => {
                if (isSubscribed) {
                    setHtml(data);
                    setLoading(false);
                }
            })
            .catch(() => {
                if (isSubscribed) {
                    setLoading(false);
                    notify.error("Unable to load invoice preview. Please try downloading directly.");
                }
            });

        return () => {
            isSubscribed = false;
        };
    }, [open, orderId]);

    const handlePrint = () => {
        if (iframeRef.current && iframeRef.current.contentWindow) {
            iframeRef.current.contentWindow.print();
        } else {
            window.print();
        }
    };

    const handleDownload = () => {
        void downloadInvoiceFile(orderId);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-w-4xl w-[94vw] h-[88vh] max-h-[850px] p-0 flex flex-col rounded-2xl overflow-hidden bg-card border-border shadow-2xl"
                aria-labelledby="invoice-preview-title"
                aria-describedby="invoice-preview-desc"
            >
                {/* Header Bar */}
                <DialogHeader className="px-4 py-3 sm:px-6 sm:py-4 border-b border-border bg-muted/30 flex flex-row items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <DialogTitle id="invoice-preview-title" className="text-body sm:text-body-lg font-bold text-foreground flex items-center gap-2">
                                Invoice #{orderId.slice(-8).toUpperCase()}
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-tiny font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                    <CheckCircle2 className="w-3 h-3" /> PAID
                                </span>
                            </DialogTitle>
                            <DialogDescription id="invoice-preview-desc" className="text-caption text-foreground-subtle truncate max-w-xs sm:max-w-md">
                                {description || "Tax Invoice & Receipt"} {amount ? `• ₹${amount.toLocaleString()}` : ""}
                            </DialogDescription>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pr-6">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handlePrint}
                            disabled={loading || !html}
                            className="h-8 sm:h-9 px-2.5 sm:px-3 text-caption rounded-lg gap-1.5"
                            aria-label="Print Invoice"
                        >
                            <Printer className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Print</span>
                        </Button>
                        <Button
                            type="button"
                            size="sm"
                            onClick={handleDownload}
                            className="h-8 sm:h-9 px-3 sm:px-4 text-caption bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg gap-1.5 font-semibold"
                            aria-label="Download Invoice PDF"
                        >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                        </Button>
                    </div>
                </DialogHeader>

                {/* Content Frame */}
                <div className="flex-1 bg-muted/20 relative overflow-hidden flex items-center justify-center">
                    {loading && (
                        <div className="flex flex-col items-center gap-3 text-foreground-subtle">
                            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                            <p className="text-caption font-medium">Generating Invoice Preview...</p>
                        </div>
                    )}

                    {!loading && html && (
                        <iframe
                            ref={iframeRef}
                            srcDoc={html}
                            title={`Tax Invoice - ${orderId}`}
                            className="w-full h-full border-none bg-white"
                            sandbox="allow-same-origin allow-scripts allow-popups allow-modals"
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
