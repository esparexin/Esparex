// --- BusinessEmails (P3 extract-before-split from EmailLayout) ---
// Business lifecycle emails. Single owner per group.
import { escapeHtml, renderEmailLayout } from './EmailLayout';

/**
 * Business Plan Expiry Alert Email
 */
export function renderBusinessExpiryAlertEmail(params: {
    businessName: string;
    expiryDate: string;
    daysLeft: number;
    renewUrl: string;
}): string {
    const daysText = params.daysLeft === 1 ? '1 day' : `${params.daysLeft} days`;
    const contentHtml = `
        <p>Hello <strong>${escapeHtml(params.businessName)}</strong>,</p>
        <p>This is a reminder that your Esparex Business Subscription will expire on <strong>${escapeHtml(params.expiryDate)}</strong> (in ${daysText}).</p>
        <p>To ensure your business profile, spare parts inventory, and automotive services remain active and visible to buyers, please renew your subscription before it expires.</p>
        <p style="font-size: 13px; color: #dc2626;">If your subscription expires, your verified business status and active inventory will be temporarily suspended.</p>
    `;

    return renderEmailLayout({
        title: `Business Subscription Expiring in ${daysText}`,
        preheader: `Action required: Your Esparex Business Plan expires on ${params.expiryDate}.`,
        contentHtml,
        callToAction: {
            label: 'Renew Business Plan',
            url: params.renewUrl,
        },
        footerNote: 'Maintain uninterrupted access to your business tools and verified badge.',
    });
}

/**
 * Business Profile Approved Confirmation Email
 */
export function renderBusinessApprovedEmail(params: {
    businessName: string;
    userName?: string;
    manageUrl: string;
}): string {
    const greeting = params.userName ? `Hello ${escapeHtml(params.userName)},` : 'Hello,';
    const contentHtml = `
        <p>${greeting}</p>
        <p>Congratulations! Your business application for <strong>${escapeHtml(params.businessName)}</strong> has been reviewed and officially approved.</p>
        <p>Your verified business account is now active on Esparex. As a verified dealer, you enjoy:</p>
        <ul style="padding-left: 20px; margin: 16px 0; color: #334155; line-height: 1.8;">
            <li>Verified Merchant Badge displayed on all listings</li>
            <li>Higher visibility across search, category feeds, and dealer directories</li>
            <li>Dedicated business management portal and analytics</li>
        </ul>
        <p>You can now manage your business profile, post automotive spare parts, and publish services.</p>
    `;

    return renderEmailLayout({
        title: 'Business Profile Approved! 🏢',
        preheader: `Congratulations! Your business "${params.businessName}" is now verified on Esparex.`,
        contentHtml,
        callToAction: {
            label: 'Manage My Business',
            url: params.manageUrl,
        },
        footerNote: 'Welcome to the Esparex verified dealer network.',
    });
}

/**
 * Business Profile Rejected Confirmation Email
 */
export function renderBusinessRejectedEmail(params: {
    businessName: string;
    userName?: string;
    rejectionReason?: string;
    applyUrl: string;
}): string {
    const greeting = params.userName ? `Hello ${escapeHtml(params.userName)},` : 'Hello,';
    const reasonBlock = params.rejectionReason
        ? `
        <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 14px 16px; margin: 16px 0;">
            <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: #991b1b; text-transform: uppercase;">Reason for Decision:</p>
            <p style="margin: 0; font-size: 14px; color: #b91c1c;">${escapeHtml(params.rejectionReason)}</p>
        </div>
        `
        : '';

    const contentHtml = `
        <p>${greeting}</p>
        <p>Thank you for submitting a business application for <strong>${escapeHtml(params.businessName)}</strong> on Esparex.</p>
        <p>After careful review by our moderation team, we regret to inform you that your application could not be approved at this time.</p>
        ${reasonBlock}
        <p>Please review the feedback above, update your documentation or business details, and submit a new application when ready.</p>
    `;

    return renderEmailLayout({
        title: 'Business Application Update — Esparex',
        preheader: `Update regarding your business application for "${params.businessName}".`,
        contentHtml,
        callToAction: {
            label: 'Review & Reapply',
            url: params.applyUrl,
        },
        footerNote: 'If you believe this was an error, please reach out to our support team.',
    });
}/**
 * Business Profile Expired Email
 */
export function renderBusinessExpiredEmail(params: {
    businessName: string;
    userName?: string;
    renewUrl: string;
}): string {
    const greeting = params.userName ? `Hello ${escapeHtml(params.userName)},` : 'Hello,';
    const contentHtml = `
        <p>${greeting}</p>
        <p>Your Esparex Business subscription for <strong>${escapeHtml(params.businessName)}</strong> has expired.</p>
        <p>Your business profile and associated listings are no longer visible to buyers. Renew your subscription to restore access and keep your inventory active.</p>
        <p style="font-size: 13px; color: #6b7280;">If you believe this is an error or need assistance, please contact our support team.</p>
    `;

    return renderEmailLayout({
        title: 'Business Subscription Expired',
        preheader: `Your Esparex Business subscription for "${params.businessName}" has expired.`,
        contentHtml,
        callToAction: {
            label: 'Renew Now',
            url: params.renewUrl,
        },
        footerNote: 'Renewing restores your verified status, listings, and business tools.',
    });
}

/**
 * Business Plan Renewed Confirmation Email
 */
export function renderBusinessRenewedEmail(params: {
    businessName: string;
    userName?: string;
    expiresAt: string;
    manageUrl: string;
}): string {
    const greeting = params.userName ? `Hello ${escapeHtml(params.userName)},` : 'Hello,';
    const contentHtml = `
        <p>${greeting}</p>
        <p>Great news! Your Esparex Business subscription for <strong>${escapeHtml(params.businessName)}</strong> has been successfully renewed.</p>
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 12px 16px; margin: 16px 0; font-size: 14px; color: #166534;">
            <strong>Renewed Until:</strong> ${escapeHtml(params.expiresAt)}
        </div>
        <p>Your business profile and all active listings remain live and visible to buyers without interruption.</p>
    `;

    return renderEmailLayout({
        title: 'Business Subscription Renewed ✅',
        preheader: `Your Esparex Business subscription for "${params.businessName}" has been renewed.`,
        contentHtml,
        callToAction: {
            label: 'Manage My Business',
            url: params.manageUrl,
        },
        footerNote: 'Thank you for being part of the Esparex verified dealer network.',
    });
}
