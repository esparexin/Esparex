import { apiClient } from '@/lib/api/client';
import { API_ROUTES } from '../routes';
import logger from "@/lib/logger";


export interface PaymentMethod {
    id: string;
    cardLast4: string;
    brand: string;
    expiryMonth: number;
    expiryYear: number;
}

export const downloadInvoice = async (transactionId: string): Promise<void> => {
    try {
        const response = await apiClient.get<Blob | ArrayBuffer>(API_ROUTES.USER.INVOICE_DETAIL(transactionId), {
            responseType: 'blob'
        });

        const blob = response instanceof Blob
            ? response
            : new Blob([response], { type: 'application/octet-stream' });
        const url = window.URL.createObjectURL(blob);

        // Open in new tab
        window.open(url, '_blank');

        // Cleanup after delay
        setTimeout(() => window.URL.revokeObjectURL(url), 100);

    } catch (e) {
        logger.error('Failed to download invoice', e);
        throw e;
    }
};
