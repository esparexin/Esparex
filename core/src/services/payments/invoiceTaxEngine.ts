import type { InvoiceType, TaxBreakup } from '@esparex/contracts';

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
