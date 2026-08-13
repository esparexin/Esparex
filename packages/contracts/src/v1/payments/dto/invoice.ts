export type InvoiceType = 'TAX_INVOICE' | 'BILL_OF_SUPPLY';

export interface TaxBreakup {
    cgstRate?: number;
    cgstAmount?: number;
    sgstRate?: number;
    sgstAmount?: number;
    igstRate?: number;
    igstAmount?: number;
    hsnSacCode?: string;
}

export interface InvoiceGstDetails {
    sellerGstin?: string;
    buyerGstin?: string;
    legalName?: string;
    tradeName?: string;
    placeOfSupply?: string;
}

export interface InvoiceDTO {
    id: string;
    invoiceNumber: string;
    orderId: string;
    userId: string;
    sellerId?: string;
    invoiceType: InvoiceType;
    
    // Canonical pre-computed money fields
    subtotalAmount: number;
    taxAmount: number;
    totalAmount: number;
    formattedTotal: string;
    
    gstDetails?: InvoiceGstDetails;
    taxBreakup?: TaxBreakup;
    
    pdfUrl?: string;
    issuedAt: string;
    status: 'GENERATED' | 'CANCELLED';
    emailDeliveryStatus?: 'DELIVERED' | 'SKIPPED_UNCONFIGURED' | 'PENDING' | 'FAILED';
}

export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
