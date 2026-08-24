import { computeInvoiceTax, GSTIN_REGEX } from '@esparex/contracts';

describe('GST Tax Calculation Engine & Invoice Metadata', () => {
    it('generates a BILL_OF_SUPPLY with 0 tax when buyer GSTIN is not provided', () => {
        const result = computeInvoiceTax(1000);

        expect(result.invoiceType).toBe('BILL_OF_SUPPLY');
        expect(result.subtotalAmount).toBe(1000);
        expect(result.taxAmount).toBe(0);
        expect(result.totalAmount).toBe(1000);
        expect(result.taxBreakup).toBeUndefined();
    });

    it('calculates Intra-State GST (9% CGST + 9% SGST) when buyer state matches seller state (27)', () => {
        const buyerGstin = '27AAAAA0000A1Z5'; // Maharashtra (27)
        const result = computeInvoiceTax(1000, buyerGstin, '27');

        expect(result.invoiceType).toBe('TAX_INVOICE');
        expect(result.subtotalAmount).toBe(1000);
        expect(result.taxAmount).toBe(180);
        expect(result.totalAmount).toBe(1180);
        expect(result.taxBreakup).toEqual({
            cgstRate: 9,
            cgstAmount: 90,
            sgstRate: 9,
            sgstAmount: 90,
            hsnSacCode: '998371',
        });
    });

    it('calculates Inter-State GST (18% IGST) when buyer state differs from seller state (27)', () => {
        const buyerGstin = '29AAAAA0000A1Z5'; // Karnataka (29)
        const result = computeInvoiceTax(1000, buyerGstin, '27');

        expect(result.invoiceType).toBe('TAX_INVOICE');
        expect(result.subtotalAmount).toBe(1000);
        expect(result.taxAmount).toBe(180);
        expect(result.totalAmount).toBe(1180);
        expect(result.taxBreakup).toEqual({
            igstRate: 18,
            igstAmount: 180,
            hsnSacCode: '998371',
        });
    });

    it('validates standard Indian GSTIN regex format', () => {
        expect(GSTIN_REGEX.test('27AAAAA0000A1Z5')).toBe(true);
        expect(GSTIN_REGEX.test('29ABCDE1234F2Z8')).toBe(true);
        expect(GSTIN_REGEX.test('INVALID_GSTIN')).toBe(false);
        expect(GSTIN_REGEX.test('27AAAAA0000A1')).toBe(false);
    });
});
