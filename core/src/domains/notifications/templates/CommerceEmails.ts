// --- CommerceEmails (P3 extract-before-split from EmailLayout) ---
// Commerce emails (purchase confirmation, invoice). Single owner per group.
import { escapeHtml, renderEmailLayout } from './EmailLayout';

/**
 * Purchase Confirmation Email
 */
export function renderPurchaseConfirmationEmail(params: {
    orderId: string;
    planName: string;
    amount: string;
    formattedDate: string;
    userName?: string;
}): string {
    const greeting = params.userName ? `Hello ${escapeHtml(params.userName)},` : 'Hello,';
    const contentHtml = `
        <p>${greeting}</p>
        <p>Thank you for your purchase on Esparex! Your subscription has been activated successfully.</p>
        
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #e2e8f0; font-size: 14px;">
            <tr>
                <td style="padding: 6px 0; color: #64748b; width: 40%;"><strong>Order ID:</strong></td>
                <td style="padding: 6px 0; color: #0f172a; font-family: monospace;">${escapeHtml(params.orderId)}</td>
            </tr>
            <tr>
                <td style="padding: 6px 0; color: #64748b;"><strong>Plan / Product:</strong></td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${escapeHtml(params.planName)}</td>
            </tr>
            <tr>
                <td style="padding: 6px 0; color: #64748b;"><strong>Amount Paid:</strong></td>
                <td style="padding: 6px 0; color: #16a34a; font-weight: 700;">${escapeHtml(params.amount)}</td>
            </tr>
            <tr>
                <td style="padding: 6px 0; color: #64748b;"><strong>Date:</strong></td>
                <td style="padding: 6px 0; color: #0f172a;">${escapeHtml(params.formattedDate)}</td>
            </tr>
        </table>

        <p style="font-size: 14px; color: #475569;">
            Your plan benefits are now active on your account. You can manage your listings and subscription anytime in your profile.
        </p>
    `;

    return renderEmailLayout({
        title: 'Payment Confirmation & Plan Activated',
        preheader: `Your purchase for ${params.planName} was successful. Order: ${params.orderId}`,
        contentHtml,
        footerNote: 'Keep this receipt for your records.',
    });
}

/**
 * Invoice Delivery Email
 */
export function renderInvoiceEmail(params: {
    invoiceNumber: string;
    planName: string;
    amount: string;
    formattedDate: string;
    downloadUrl?: string;
    userName?: string;
}): string {
    const greeting = params.userName ? `Hello ${escapeHtml(params.userName)},` : 'Hello,';
    const downloadSnippet = params.downloadUrl
        ? `<p style="text-align: center; margin: 24px 0;"><a href="${escapeHtml(params.downloadUrl)}" target="_blank" rel="noopener noreferrer" style="background-color: #0f172a; color: #ffffff; padding: 10px 24px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 6px; display: inline-block;">Download Tax Invoice PDF</a></p>`
        : '<p style="font-size: 13px; color: #64748b;">A copy of your invoice is attached to this email.</p>';

    const contentHtml = `
        <p>${greeting}</p>
        <p>Please find attached the official GST tax invoice for your recent transaction on Esparex.</p>
        
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #e2e8f0; font-size: 14px;">
            <tr>
                <td style="padding: 6px 0; color: #64748b; width: 40%;"><strong>Invoice Number:</strong></td>
                <td style="padding: 6px 0; color: #0f172a; font-family: monospace;">${escapeHtml(params.invoiceNumber)}</td>
            </tr>
            <tr>
                <td style="padding: 6px 0; color: #64748b;"><strong>Description:</strong></td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${escapeHtml(params.planName)}</td>
            </tr>
            <tr>
                <td style="padding: 6px 0; color: #64748b;"><strong>Total (incl. GST):</strong></td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${escapeHtml(params.amount)}</td>
            </tr>
            <tr>
                <td style="padding: 6px 0; color: #64748b;"><strong>Invoice Date:</strong></td>
                <td style="padding: 6px 0; color: #0f172a;">${escapeHtml(params.formattedDate)}</td>
            </tr>
        </table>

        ${downloadSnippet}
    `;

    return renderEmailLayout({
        title: `Tax Invoice: ${params.invoiceNumber}`,
        preheader: `Tax invoice for your Esparex subscription (${params.invoiceNumber})`,
        contentHtml,
        footerNote: 'This is an official tax document. Please retain for accounting and GST filing.',
    });
}
