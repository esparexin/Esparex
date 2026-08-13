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

export interface TaxCalculationResult {
    invoiceType: InvoiceType;
    subtotalAmount: number;
    taxAmount: number;
    totalAmount: number;
    taxBreakup?: TaxBreakup;
}

export function computeInvoiceTax(
    subtotalAmount: number,
    buyerGstin?: string,
    sellerStateCode: string = '27', // Default Esparex Platform State Code: Maharashtra (27)
    hsnSacCode: string = '998371'
): TaxCalculationResult {
    const isGstApplicable = Boolean(buyerGstin && buyerGstin.trim().length === 15);

    if (!isGstApplicable) {
        return {
            invoiceType: 'BILL_OF_SUPPLY',
            subtotalAmount,
            taxAmount: 0,
            totalAmount: subtotalAmount
        };
    }

    // Standard GST Rate for Platform Services = 18%
    const buyerStateCode = buyerGstin!.slice(0, 2);
    const isIntraState = buyerStateCode === sellerStateCode;
    const taxRate = 0.18;
    const totalTax = Math.round(subtotalAmount * taxRate * 100) / 100;
    const totalAmount = Math.round((subtotalAmount + totalTax) * 100) / 100;

    let taxBreakup: TaxBreakup;

    if (isIntraState) {
        const halfTax = Math.round((totalTax / 2) * 100) / 100;
        taxBreakup = {
            cgstRate: 9,
            cgstAmount: halfTax,
            sgstRate: 9,
            sgstAmount: halfTax,
            hsnSacCode
        };
    } else {
        taxBreakup = {
            igstRate: 18,
            igstAmount: totalTax,
            hsnSacCode
        };
    }

    return {
        invoiceType: 'TAX_INVOICE',
        subtotalAmount,
        taxAmount: totalTax,
        totalAmount,
        taxBreakup
    };
}
