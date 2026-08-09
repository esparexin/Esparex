import { API_V1_BASE_PATH, DEFAULT_LOCAL_API_ORIGIN } from "../routes";

const resolveApiBaseUrl = () => {
    let baseUrl =
        process.env.NEXT_PUBLIC_API_URL || `${DEFAULT_LOCAL_API_ORIGIN}${API_V1_BASE_PATH}`;

    if (process.env.NODE_ENV === "development" && typeof window !== "undefined") {
        const hostname = window.location.hostname;
        if ((hostname === "127.0.0.1" || hostname === "localhost") && baseUrl.includes("localhost")) {
            if (hostname === "127.0.0.1") {
                baseUrl = baseUrl.replace("localhost", "127.0.0.1");
            }
        } else if ((hostname === "127.0.0.1" || hostname === "localhost") && baseUrl.includes("127.0.0.1")) {
            if (hostname === "localhost") {
                baseUrl = baseUrl.replace("127.0.0.1", "localhost");
            }
        }
    }

    return baseUrl.replace(/\/$/, "");
};

export const downloadInvoice = async (transactionId: string): Promise<void> => {
    const invoiceUrl = `${resolveApiBaseUrl()}/payment/invoice/${transactionId}`;
    window.open(invoiceUrl, "_blank", "noopener,noreferrer");
};

export const downloadInvoiceFile = async (transactionId: string): Promise<void> => {
    try {
        const invoiceUrl = `${resolveApiBaseUrl()}/payment/invoice/${transactionId}?download=true`;
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
        const invoiceUrl = `${resolveApiBaseUrl()}/payment/invoice/${transactionId}?download=true`;
        window.open(invoiceUrl, "_blank", "noopener,noreferrer");
    }
};
