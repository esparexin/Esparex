import { buildCleanPdfBuffer, generateInvoicePdf } from '../application/InvoicePdfService';

describe('InvoicePdfService', () => {
    it('generates a clean vector PDF buffer with brand header, order details, and tax breakdown', () => {
        const sampleInvoice = {
            invoiceNumber: 'INV-2026-00001',
            transactionId: 'TXN-987654321',
            amount: 1180,
            currency: 'INR',
            issuedAt: new Date('2026-08-13T10:00:00Z'),
            subtotal: 1000,
            cgst: 90,
            sgst: 90,
            igst: 0,
            total: 1180,
            gstin: '33AAAAA0000A1Z5',
            sacCode: '998599',
            items: [
                {
                    description: 'Pro Seller Quarterly Subscription Plan',
                    quantity: 1,
                    unitPrice: 1000,
                    total: 1000
                }
            ],
            billingAddress: {
                line1: 'Suite 404, Tech Park',
                line2: 'MG Road',
                city: 'Bengaluru',
                country: 'India'
            },
            user: {
                name: 'Rajesh Kumar',
                email: 'rajesh@example.com',
                mobile: '+91 9876543210'
            }
        };

        const buffer = buildCleanPdfBuffer(sampleInvoice);

        expect(Buffer.isBuffer(buffer)).toBe(true);
        const pdfString = buffer.toString('utf8');

        expect(pdfString).toContain('%PDF-1.4');
        expect(pdfString).toContain('ESPAREX MARKETPLACE PRIVATE LIMITED');
        expect(pdfString).toContain('TAX INVOICE');
        expect(pdfString).toContain('INV-2026-00001');
        expect(pdfString).toContain('TXN-987654321');
        expect(pdfString).toContain('Rajesh Kumar');
        expect(pdfString).toContain('Pro Seller Quarterly Subscription Plan');
        expect(pdfString).toContain('INR 1180.00');
        expect(pdfString).toContain('%%EOF');
    });

    it('handles skipped S3 upload gracefully when S3 fails or is unconfigured', async () => {
        const sampleInvoice = {
            invoiceNumber: 'INV-2026-00002',
            transactionId: 'TXN-11111',
            amount: 500,
            currency: 'INR',
            issuedAt: new Date(),
            subtotal: 500,
            total: 500
        };

        const result = await generateInvoicePdf(sampleInvoice);
        expect(result === undefined || typeof result === 'string').toBe(true);
    }, 30_000);
});
