// --- EngagementEmails (P3 extract-before-split from EmailLayout) ---
// Engagement emails (contact inquiry, notification). Single owner per group.
import { escapeHtml, renderEmailLayout } from './EmailLayout';

/**
 * Contact Inquiry / Grievance Notification Email
 */
export function renderContactInquiryEmail(params: {
    name: string;
    email: string;
    mobile?: string;
    subject: string;
    message: string;
}): string {
    const mobileRow = params.mobile
        ? `<tr><td style="padding: 6px 0; color: #64748b;"><strong>Mobile:</strong></td><td style="padding: 6px 0; color: #0f172a;">${escapeHtml(params.mobile)}</td></tr>`
        : '';

    const contentHtml = `
        <p>A new support or contact inquiry has been submitted via Esparex:</p>
        
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; border-radius: 8px; padding: 16px; margin: 20px 0; border: 1px solid #e2e8f0; font-size: 14px;">
            <tr>
                <td style="padding: 6px 0; color: #64748b; width: 30%;"><strong>Sender:</strong></td>
                <td style="padding: 6px 0; color: #0f172a; font-weight: 600;">${escapeHtml(params.name)}</td>
            </tr>
            <tr>
                <td style="padding: 6px 0; color: #64748b;"><strong>Email:</strong></td>
                <td style="padding: 6px 0; color: #0f172a;"><a href="mailto:${escapeHtml(params.email)}" style="color: #2563eb;">${escapeHtml(params.email)}</a></td>
            </tr>
            ${mobileRow}
            <tr>
                <td style="padding: 6px 0; color: #64748b;"><strong>Subject:</strong></td>
                <td style="padding: 6px 0; color: #0f172a;">${escapeHtml(params.subject)}</td>
            </tr>
        </table>

        <div style="background-color: #ffffff; border: 1px solid #cbd5e1; border-radius: 8px; padding: 16px; margin-top: 16px;">
            <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase;">Message Content:</p>
            <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #1e293b; white-space: pre-wrap;">${escapeHtml(params.message)}</p>
        </div>
    `;

    return renderEmailLayout({
        title: `Inquiry: ${params.subject}`,
        preheader: `New message from ${params.name}: ${params.subject}`,
        contentHtml,
        footerNote: 'Respond directly to the sender at their provided email address.',
    });
}

/**
 * Generic System / In-App Notification Email
 */
export function renderNotificationEmail(params: {
    title: string;
    body: string;
    actionUrl?: string;
    actionLabel?: string;
    userName?: string;
}): string {
    const greeting = params.userName ? `Hello ${escapeHtml(params.userName)},` : 'Hello,';
    const contentHtml = `
        <p>${greeting}</p>
        <p style="font-size: 15px; line-height: 1.6; color: #334155; white-space: pre-wrap;">${escapeHtml(params.body)}</p>
    `;

    return renderEmailLayout({
        title: params.title,
        preheader: params.body.slice(0, 120),
        contentHtml,
        ...(params.actionUrl ? {
            callToAction: {
                label: params.actionLabel || 'View Details',
                url: params.actionUrl,
            }
        } : {}),
    });
}
