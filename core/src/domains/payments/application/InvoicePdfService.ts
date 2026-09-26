import type { IInvoice } from '../../../models/Invoice';
import { uploadToS3 } from '../../../utils/s3';
import logger from '../../../utils/logger';
import { ESPAREX_COMPANY_IDENTITY } from '@esparex/contracts';

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
        '(' + escapePdfText(ESPAREX_COMPANY_IDENTITY.legalName.toUpperCase()) + ') Tj',
        '0 -24 Td',
        '/F2 14 Tf',
        '(TAX INVOICE) Tj',
        '0 -16 Td',
        '/F1 10 Tf',
        '(GSTIN: ' + escapePdfText(invoice.gstin || ESPAREX_COMPANY_IDENTITY.gstin) + ' | SAC: ' + escapePdfText(invoice.sacCode || ESPAREX_COMPANY_IDENTITY.sacCode) + ') Tj',
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

export interface RenderInvoiceHtmlInput {
    invoiceNumber: string;
    date: string;
    orderId: string;
    planName: string;
    planType: string;
    subtotal: number;
    taxGst: number;
    totalAmount: number;
    currency?: string;
    gstin?: string;
    sacCode?: string;
    user?: {
        name?: string;
        email?: string;
        mobile?: string;
    } | null;
}

/**
 * Renders the authoritative, responsive HTML tax invoice with official embedded brand logo,
 * clean typography, print stylesheet, and statutory verification notes.
 */
export const renderInvoiceHtml = (input: RenderInvoiceHtmlInput): string => {
    const currency = input.currency || 'INR';
    const currencySymbol = currency === 'INR' ? '₹' : `${currency} `;
    const gstin = input.gstin || ESPAREX_COMPANY_IDENTITY.gstin;
    const sacCode = input.sacCode || ESPAREX_COMPANY_IDENTITY.sacCode;
    const user = input.user || {};
    const logoSrc = ESPAREX_COMPANY_IDENTITY.logo.dataUri;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Tax Invoice - ${input.invoiceNumber} | Esparex</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #f8fafc;
            color: #0f172a;
            line-height: 1.5;
            padding: 30px 15px;
        }
        .invoice-card {
            max-width: 800px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01);
            border: 1px solid #e2e8f0;
            overflow: hidden;
        }
        .invoice-header {
            padding: 32px 36px;
            background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .brand-container {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        .brand-logo {
            display: flex;
            align-items: center;
            gap: 10px;
            text-decoration: none;
        }
        .brand-text {
            font-size: 24px;
            font-weight: 900;
            color: #0f172a;
            letter-spacing: -0.5px;
        }
        .brand-tagline {
            font-size: 11px;
            color: #64748b;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .invoice-title-block {
            text-align: right;
        }
        .invoice-title {
            font-size: 20px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: 1px;
            text-transform: uppercase;
        }
        .invoice-num {
            font-size: 13px;
            font-weight: 700;
            color: #10b981;
            margin-top: 2px;
        }
        .status-badge {
            display: inline-block;
            margin-top: 6px;
            padding: 4px 10px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            background: #dcfce7;
            color: #15803d;
            border: 1px solid #bbf7d0;
        }
        .invoice-body {
            padding: 36px;
        }
        .grid-meta {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
            margin-bottom: 36px;
            padding: 20px;
            background: #f8fafc;
            border-radius: 12px;
            border: 1px solid #f1f5f9;
        }
        .meta-col h3 {
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            color: #64748b;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
        }
        .meta-col p {
            font-size: 13px;
            color: #334155;
            margin-bottom: 3px;
        }
        .meta-col strong {
            color: #0f172a;
            font-weight: 700;
        }
        table.invoice-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 28px;
        }
        table.invoice-table th {
            background: #f1f5f9;
            color: #475569;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 12px 16px;
            text-align: left;
            border-bottom: 1px solid #cbd5e1;
        }
        table.invoice-table td {
            padding: 16px;
            font-size: 13px;
            color: #334155;
            border-bottom: 1px solid #f1f5f9;
        }
        .text-right { text-align: right; }
        .summary-container {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 36px;
        }
        .summary-table {
            width: 300px;
            border-collapse: collapse;
        }
        .summary-table td {
            padding: 8px 12px;
            font-size: 13px;
            color: #475569;
        }
        .summary-table tr.total-row td {
            border-top: 2px solid #0f172a;
            font-size: 16px;
            font-weight: 900;
            color: #0f172a;
            padding-top: 12px;
        }
        .invoice-footer {
            padding: 24px 36px;
            background: #f8fafc;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 12px;
            color: #64748b;
        }
        .print-actions {
            text-align: center;
            margin-top: 24px;
        }
        .btn-print {
            background: #10b981;
            color: #ffffff;
            border: none;
            padding: 10px 24px;
            font-size: 13px;
            font-weight: 700;
            border-radius: 8px;
            cursor: pointer;
            box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2);
            transition: background 0.2s;
        }
        .btn-print:hover { background: #059669; }
        @media print {
            body { background: #ffffff; padding: 0; }
            .invoice-card { border: none; box-shadow: none; border-radius: 0; }
            .print-actions { display: none; }
        }
    </style>
</head>
<body>
    <div class="invoice-card">
        <div class="invoice-header">
            <div class="brand-container">
                <div class="brand-logo">
                    ${logoSrc ? `<img src="${logoSrc}" alt="${ESPAREX_COMPANY_IDENTITY.tradeName}" style="height: 38px; width: auto; max-width: 180px; object-fit: contain;" />` : `<span class="brand-text">${ESPAREX_COMPANY_IDENTITY.tradeName}</span>`}
                </div>
                <div class="brand-tagline">${ESPAREX_COMPANY_IDENTITY.tagline}</div>
            </div>
            <div class="invoice-title-block">
                <div class="invoice-title">Tax Invoice</div>
                <div class="invoice-num">${input.invoiceNumber}</div>
                <div class="status-badge">PAID</div>
            </div>
        </div>

        <div class="invoice-body">
            <div class="grid-meta">
                <div class="meta-col">
                    <h3>Billed From (Seller)</h3>
                    <p><strong>${ESPAREX_COMPANY_IDENTITY.legalName}</strong></p>
                    <p>${ESPAREX_COMPANY_IDENTITY.address.line1}</p>
                    <p>${ESPAREX_COMPANY_IDENTITY.address.city}, ${ESPAREX_COMPANY_IDENTITY.address.state} ${ESPAREX_COMPANY_IDENTITY.address.pincode}</p>
                    <p><strong>GSTIN:</strong> ${gstin}</p>
                    <p><strong>SAC Code:</strong> ${sacCode}</p>
                    <p>${ESPAREX_COMPANY_IDENTITY.supportEmail}</p>
                </div>
                <div class="meta-col">
                    <h3>Billed To (Customer)</h3>
                    <p><strong>${user.name || 'Valued Customer'}</strong></p>
                    ${user.email ? `<p>${user.email}</p>` : ''}
                    <p>${user.mobile || '-'}</p>
                    <p><strong>Invoice Date:</strong> ${input.date}</p>
                    <p><strong>Payment Order:</strong> ${input.orderId}</p>
                </div>
            </div>

            <table class="invoice-table">
                <thead>
                    <tr>
                        <th>Item Description</th>
                        <th>Category / Type</th>
                        <th>SAC Code</th>
                        <th class="text-right">Price</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <strong>${input.planName}</strong><br>
                            <span style="font-size: 11px; color: #64748b;">Order Ref: ${input.orderId}</span>
                        </td>
                        <td>${input.planType}</td>
                        <td>${sacCode}</td>
                        <td class="text-right">${currencySymbol}${input.subtotal.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>

            <div class="summary-container">
                <table class="summary-table">
                    <tr>
                        <td>Subtotal (Base Price):</td>
                        <td class="text-right">${currencySymbol}${input.subtotal.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td>GST (18% Applicable):</td>
                        <td class="text-right">${currencySymbol}${input.taxGst.toFixed(2)}</td>
                    </tr>
                    <tr class="total-row">
                        <td>Total Amount Paid:</td>
                        <td class="text-right">${currencySymbol}${input.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    </tr>
                </table>
            </div>
        </div>

        <div class="invoice-footer">
            <div>
                <strong>Verification:</strong> Verified Electronic Tax Invoice
            </div>
            <div>
                Computer-generated invoice. No physical signature required.
            </div>
        </div>
    </div>

    <div class="print-actions">
        <button onclick="window.print()" class="btn-print">🖨️ Print Invoice</button>
    </div>
</body>
</html>`;
};
