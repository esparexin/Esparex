import type { IInvoice } from '../../../models/Invoice';
import { uploadToS3 } from '../../../utils/s3';
import logger from '../../../utils/logger';

export type InvoiceUserLike = {
    name?: string;
    email?: string;
    mobile?: string;
};

export type InvoicePdfInput = Pick<
    IInvoice,
    'invoiceNumber' | 'amount' | 'currency' | 'issuedAt' | 'subtotal' | 'cgst' | 'sgst' | 'igst' | 'total' | 'gstin' | 'sacCode' | 'items' | 'billingAddress' | 'transactionId'
> & {
    user?: InvoiceUserLike | null;
};

const escapePdfText = (value: string): string =>
    value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

/**
 * Builds a clean, professional vector PDF 1.4 document buffer with brand header,
 * order details breakdown, customer billing address, itemized purchase table,
 * and 18% GST tax summary.
 */
export const buildCleanPdfBuffer = (invoice: InvoicePdfInput): Buffer => {
    const currency = invoice.currency || 'INR';
    const subtotal = (invoice.subtotal ?? invoice.amount).toFixed(2);
    const cgst = (invoice.cgst ?? 0).toFixed(2);
    const sgst = (invoice.sgst ?? 0).toFixed(2);
    const igst = (invoice.igst ?? 0).toFixed(2);
    const total = (invoice.total ?? invoice.amount).toFixed(2);
    const issuedDateStr = invoice.issuedAt
        ? new Date(invoice.issuedAt).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10);
    const transactionIdStr = invoice.transactionId ? String(invoice.transactionId) : '-';

    const customerName = invoice.user?.name || invoice.billingAddress?.line1 || 'Customer';
    const customerEmail = invoice.user?.email || '-';
    const customerMobile = invoice.user?.mobile || '-';
    const addressCity = invoice.billingAddress?.city || '';
    const addressCountry = invoice.billingAddress?.country || 'India';
    const addressStr = [invoice.billingAddress?.line1, invoice.billingAddress?.line2, addressCity, addressCountry]
        .filter(Boolean)
        .join(', ');

    const items = invoice.items && invoice.items.length > 0
        ? invoice.items
        : [{ description: 'Esparex Service / Subscription Package', quantity: 1, unitPrice: Number(subtotal), total: Number(subtotal) }];

    const contentStream: string[] = [
        'BT',
        // Brand Header (Bold 18pt)
        '/F2 18 Tf',
        '40 800 Td',
        '(ESPAREX MARKETPLACE PRIVATE LIMITED) Tj',
        '0 -24 Td',
        '/F2 14 Tf',
        '(TAX INVOICE) Tj',
        '0 -16 Td',
        '/F1 10 Tf',
        '(GSTIN: ' + escapePdfText(invoice.gstin || '33AAAAA0000A1Z5') + ' | SAC: ' + escapePdfText(invoice.sacCode || '998599') + ') Tj',
        '0 -25 Td',

        // Divider Line (Header Section)
        '/F2 11 Tf',
        '(=================================================================================) Tj',
        '0 -18 Td',

        // Invoice & Order Metadata
        '/F2 11 Tf',
        '(INVOICE DETAILS) Tj',
        '0 -15 Td',
        '/F1 10 Tf',
        '(' + escapePdfText(`Invoice No: ${invoice.invoiceNumber}  |  Issue Date: ${issuedDateStr}`) + ') Tj',
        '0 -14 Td',
        '(' + escapePdfText(`Transaction ID: ${transactionIdStr}`) + ') Tj',
        '0 -22 Td',

        // Billed To / Customer Section
        '/F2 11 Tf',
        '(BILLED TO) Tj',
        '0 -15 Td',
        '/F1 10 Tf',
        '(' + escapePdfText(`Name: ${customerName}`) + ') Tj',
        '0 -14 Td',
        '(' + escapePdfText(`Email: ${customerEmail}  |  Phone: ${customerMobile}`) + ') Tj',
        '0 -14 Td',
        '(' + escapePdfText(`Address: ${addressStr || '-'}`) + ') Tj',
        '0 -25 Td',

        // Divider Line (Itemized Table)
        '/F2 11 Tf',
        '(=================================================================================) Tj',
        '0 -18 Td',
        '/F2 11 Tf',
        '(ORDER ITEMS & CHARGES) Tj',
        '0 -18 Td',
        '/F2 10 Tf',
        '(Description                                           Qty    Unit Price       Total) Tj',
        '0 -14 Td',
        '/F1 10 Tf',
        ...items.map((item) => {
            const desc = escapePdfText(item.description.slice(0, 48).padEnd(48, ' '));
            const qty = String(item.quantity).padStart(5, ' ');
            const price = `${currency} ${item.unitPrice.toFixed(2)}`.padStart(12, ' ');
            const tot = `${currency} ${item.total.toFixed(2)}`.padStart(12, ' ');
            return `(${desc} ${qty} ${price} ${tot}) Tj\n0 -14 Td`;
        }),

        // Divider Line (Summary & Tax)
        '0 -10 Td',
        '/F2 11 Tf',
        '(=================================================================================) Tj',
        '0 -18 Td',
        '/F2 11 Tf',
        '(TAX BREAKDOWN & TOTALS) Tj',
        '0 -16 Td',
        '/F1 10 Tf',
        '(' + escapePdfText(`Subtotal (Taxable Value):          ${currency} ${subtotal}`) + ') Tj',
        '0 -14 Td',
        '(' + escapePdfText(`CGST (9%):                         ${currency} ${cgst}`) + ') Tj',
        '0 -14 Td',
        '(' + escapePdfText(`SGST (9%):                         ${currency} ${sgst}`) + ') Tj',
        '0 -14 Td',
        '(' + escapePdfText(`IGST (0%):                         ${currency} ${igst}`) + ') Tj',
        '0 -18 Td',
        '/F2 12 Tf',
        '(' + escapePdfText(`GRAND TOTAL PAID:                 ${currency} ${total}`) + ') Tj',
        '0 -30 Td',

        // Footer
        '/F1 9 Tf',
        '(Thank you for choosing Esparex. This is a computer-generated tax invoice.) Tj',
        'ET'
    ];

    const stream = contentStream.join('\n');
    const objects = [
        '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj',
        '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj',
        '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj',
        '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj',
        '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj',
        `6 0 obj\n<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream\nendobj`
    ];

    let body = '%PDF-1.4\n';
    const offsets = [0];
    for (const object of objects) {
        offsets.push(Buffer.byteLength(body, 'utf8'));
        body += `${object}\n`;
    }

    const xrefOffset = Buffer.byteLength(body, 'utf8');
    body += `xref\n0 ${objects.length + 1}\n`;
    body += '0000000000 65535 f \n';
    for (let i = 1; i <= objects.length; i += 1) {
        body += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    }
    body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    return Buffer.from(body, 'utf8');
};

export const generateInvoicePdf = async (
    invoice: InvoicePdfInput
): Promise<string | undefined> => {
    try {
        const pdfBuffer = buildCleanPdfBuffer(invoice);
        const key = `invoices/${new Date(invoice.issuedAt).getFullYear()}/${invoice.invoiceNumber}.pdf`;
        return await uploadToS3(pdfBuffer, key, 'application/pdf');
    } catch (error) {
        logger.warn('Invoice PDF generation/upload skipped', {
            invoiceNumber: invoice.invoiceNumber,
            error: error instanceof Error ? error.message : String(error)
        });
        return undefined;
    }
};
