// --- AuthEmails (P3 extract-before-split from EmailLayout) ---
// Authentication emails (password reset). Single owner per group.
import { renderEmailLayout } from './EmailLayout';

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
