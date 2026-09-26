/**
 * Esparex Email Layout & Templates (Single Source of Truth)
 * 
 * Provides responsive, cross-client compatible HTML templates for all
 * system, transactional, and authentication emails.
 */

export interface EmailLayoutOptions {
    title: string;
    preheader?: string;
    contentHtml: string;
    callToAction?: {
        label: string;
        url: string;
    };
    footerNote?: string;
}

export function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

export function renderEmailLayout(options: EmailLayoutOptions): string {
    const preheaderSnippet = options.preheader
        ? `<div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${escapeHtml(options.preheader)}</div>`
        : '';

    const ctaButton = options.callToAction
        ? `
        <div style="margin: 28px 0; text-align: center;">
            <a href="${escapeHtml(options.callToAction.url)}" target="_blank" rel="noopener noreferrer" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 8px; display: inline-block; letter-spacing: 0.2px; box-shadow: 0 2px 4px rgba(37,99,235,0.2);">
                ${escapeHtml(options.callToAction.label)}
            </a>
        </div>
        `
        : '';

    const footerText = options.footerNote
        ? `<p style="margin: 0 0 12px 0; font-size: 12px; color: #94a3b8;">${escapeHtml(options.footerNote)}</p>`
        : '';

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(options.title)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1e293b;">
    ${preheaderSnippet}
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 32px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
                    <!-- Brand Header -->
                    <tr>
                        <td style="padding: 28px 32px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); text-align: left;">
                            <span style="font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">Esparex</span>
                            <span style="display: block; font-size: 12px; color: #94a3b8; font-weight: 500; margin-top: 2px;">Automotive Marketplace &amp; Services</span>
                        </td>
                    </tr>
                    <!-- Main Content Body -->
                    <tr>
                        <td style="padding: 32px;">
                            <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #0f172a; line-height: 1.3;">
                                ${escapeHtml(options.title)}
                            </h1>
                            <div style="font-size: 15px; line-height: 1.6; color: #334155;">
                                ${options.contentHtml}
                            </div>
                            ${ctaButton}
                        </td>
                    </tr>
                    <!-- Footer Notice -->
                    <tr>
                        <td style="padding: 24px 32px; background-color: #f1f5f9; border-top: 1px solid #e2e8f0; text-align: center;">
                            ${footerText}
                            <p style="margin: 0; font-size: 12px; color: #64748b; line-height: 1.5;">
                                &copy; ${new Date().getFullYear()} Esparex Technologies Pvt. Ltd. All rights reserved.<br>
                                This is an automated message. Please do not reply directly to this email.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
}

/**
 * Admin Password Reset Email
 */
export function renderPasswordResetEmail(params: { resetUrl: string; expiryMinutes?: number }): string {
    const minutes = params.expiryMinutes || 10;
    const contentHtml = `
        <p>You requested a password reset for your Esparex Admin account.</p>
        <p>Click the button below to verify your identity and set a new password:</p>
        <p style="margin-top: 24px; font-size: 13px; color: #64748b;">
            If you did not request this password reset, please disregard this email or contact security if you have concerns.
            This link is valid for <strong>${minutes} minutes</strong> and can only be used once.
        </p>
    `;

    return renderEmailLayout({
        title: 'Reset Your Admin Password',
        preheader: 'Use this secure link to reset your Esparex Admin password',
        contentHtml,
        callToAction: {
            label: 'Set New Password',
            url: params.resetUrl,
        },
        footerNote: 'For security reasons, this reset link is single-use and will expire shortly.',
    });
}

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

