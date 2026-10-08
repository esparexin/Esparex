// --- ListingEmails (P3 extract-before-split from EmailLayout) ---
// Marketplace listing lifecycle emails. Single owner per group.
import { escapeHtml, renderEmailLayout } from './EmailLayoutBase';

/**
 * Seller Listing Approved Email
 */
export function renderListingApprovedEmail(params: {
    name?: string;
    title: string;
    listingType?: string;
    viewUrl: string;
}): string {
    const greeting = params.name ? `Hello ${escapeHtml(params.name)},` : 'Hello,';
    const typeLabel = params.listingType || 'Listing';
    const contentHtml = `
        <p>${greeting}</p>
        <p>Great news! Your ${escapeHtml(typeLabel.toLowerCase())} <strong>${escapeHtml(params.title)}</strong> has been approved and is now live on Esparex.</p>
        <p>Buyers can now discover, view, and contact you directly regarding this item.</p>
    `;

    return renderEmailLayout({
        title: `Your ${typeLabel} is Live!`,
        preheader: `Your ${typeLabel.toLowerCase()} "${params.title}" has been approved and is now live.`,
        contentHtml,
        callToAction: {
            label: 'View My Listings',
            url: params.viewUrl,
        },
        footerNote: 'Keep your listings updated to maximize buyer interest.',
    });
}

/**
 * Seller Listing Rejected Email
 */
export function renderListingRejectedEmail(params: {
    name?: string;
    title: string;
    listingType?: string;
    rejectionReason?: string;
    viewUrl: string;
}): string {
    const greeting = params.name ? `Hello ${escapeHtml(params.name)},` : 'Hello,';
    const typeLabel = params.listingType || 'Listing';
    const reasonBlock = params.rejectionReason
        ? `
        <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 14px 16px; margin: 16px 0;">
            <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: #991b1b; text-transform: uppercase;">Moderation Feedback:</p>
            <p style="margin: 0; font-size: 14px; color: #b91c1c;">${escapeHtml(params.rejectionReason)}</p>
        </div>
        `
        : '';

    const contentHtml = `
        <p>${greeting}</p>
        <p>Unfortunately, your ${escapeHtml(typeLabel.toLowerCase())} <strong>${escapeHtml(params.title)}</strong> did not pass our moderation review.</p>
        ${reasonBlock}
        <p>Please review the feedback above, make the necessary corrections, and resubmit your listing.</p>
    `;

    return renderEmailLayout({
        title: `Your ${typeLabel} Needs Attention`,
        preheader: `Your ${typeLabel.toLowerCase()} "${params.title}" did not pass review. Please make changes and resubmit.`,
        contentHtml,
        callToAction: {
            label: 'Review & Edit Listing',
            url: params.viewUrl,
        },
        footerNote: 'Following our listing guidelines ensures quick approvals.',
    });
}

/**
 * Seller Listing Expired Email
 */
export function renderListingExpiredEmail(params: {
    name?: string;
    title: string;
    listingType?: string;
    renewUrl: string;
}): string {
    const greeting = params.name ? `Hello ${escapeHtml(params.name)},` : 'Hello,';
    const typeLabel = params.listingType || 'Listing';
    const contentHtml = `
        <p>${greeting}</p>
        <p>Your ${escapeHtml(typeLabel.toLowerCase())} <strong>${escapeHtml(params.title)}</strong> has reached its active duration and expired.</p>
        <p>It is currently not visible in search results or catalog browsing. You can renew it anytime to restore visibility.</p>
    `;

    return renderEmailLayout({
        title: `Your ${typeLabel} has Expired`,
        preheader: `Your ${typeLabel.toLowerCase()} "${params.title}" has expired. Renew it to continue receiving leads.`,
        contentHtml,
        callToAction: {
            label: 'Renew Listing',
            url: params.renewUrl,
        },
        footerNote: 'Renewed listings are instantly reactivated.',
    });
}
