import type { IInvoice } from '../models/Invoice';
import { uploadToS3 } from '../utils/s3';
import logger from '../utils/logger';

type InvoiceUserLike = {
    name?: string;
    email?: string;
    mobile?: string;
};

const escapePdfText = (value: string) =>
    value.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

const buildMinimalPdfBuffer = (lines: string[]): Buffer => {
    const contentLines = [
        'BT',
        '/F1 12 Tf',
        '50 780 Td',
        ...lines.flatMap((line, index) => {
            if (index === 0) return [`(${escapePdfText(line)}) Tj`];
            return ['0 -18 Td', `(${escapePdfText(line)}) Tj`];
        }),
        'ET'
    ];

    const stream = contentLines.join('\n');
    const objects = [
        '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj',
        '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj',
        '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj',
        '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj',
        `5 0 obj\n<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream\nendobj`
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
    invoice: Pick<IInvoice, 'invoiceNumber' | 'amount' | 'currency' | 'issuedAt' | 'subtotal' | 'cgst' | 'sgst' | 'igst' | 'total' | 'gstin' | 'sacCode'> & {
        user?: InvoiceUserLike | null;
    }
): Promise<string | undefined> => {
    try {
        const lines = [
            `Esparex Invoice ${invoice.invoiceNumber}`,
            `Date: ${new Date(invoice.issuedAt).toISOString().slice(0, 10)}`,
            `Customer: ${invoice.user?.name || 'Customer'}`,
            `Email: ${invoice.user?.email || '-'}`,
            `Phone: ${invoice.user?.mobile || '-'}`,
            `Subtotal: ${invoice.currency} ${(invoice.subtotal ?? invoice.amount).toFixed(2)}`,
            `CGST: ${invoice.currency} ${(invoice.cgst ?? 0).toFixed(2)}`,
            `SGST: ${invoice.currency} ${(invoice.sgst ?? 0).toFixed(2)}`,
            `IGST: ${invoice.currency} ${(invoice.igst ?? 0).toFixed(2)}`,
            `Total: ${invoice.currency} ${(invoice.total ?? invoice.amount).toFixed(2)}`,
            `GSTIN: ${invoice.gstin || '-'}`,
            `SAC: ${invoice.sacCode || '998599'}`
        ];

        const pdfBuffer = buildMinimalPdfBuffer(lines);
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
