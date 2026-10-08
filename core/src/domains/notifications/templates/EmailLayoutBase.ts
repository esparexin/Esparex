// --- EmailLayoutBase (P8 cycle-break for CIRC-001/ARCH-PLATFORM-001) ---
// Layout primitive owned here; group templates import from this module.
// EmailLayout.ts re-exports this module + groups (no back-edges; DAG).

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
