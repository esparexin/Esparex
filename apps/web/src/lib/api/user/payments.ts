import { resolveRuntimeApiBaseUrl } from "@/lib/api/runtimeApiBase";

export const downloadInvoice = async (transactionId: string): Promise<void> => {
    const invoiceUrl = `${resolveRuntimeApiBaseUrl()}/payment/invoice/${transactionId}`;
    window.open(invoiceUrl, "_blank", "noopener,noreferrer");
};

export const downloadInvoiceFile = async (transactionId: string): Promise<void> => {
    try {
        const invoiceUrl = `${resolveRuntimeApiBaseUrl()}/payment/invoice/${transactionId}?download=true`;
        const response = await fetch(invoiceUrl, { credentials: 'include' });
        if (!response.ok) {
            window.open(invoiceUrl, "_blank", "noopener,noreferrer");
            return;
        }
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = `Invoice-${transactionId.slice(-8).toUpperCase()}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
    } catch {
        const invoiceUrl = `${resolveRuntimeApiBaseUrl()}/payment/invoice/${transactionId}?download=true`;
        window.open(invoiceUrl, "_blank", "noopener,noreferrer");
    }
};
