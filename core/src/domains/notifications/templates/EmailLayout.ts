/**
 * Esparex Email Layout & Templates (Single Source of Truth)
 * 
 * Provides responsive, cross-client compatible HTML templates for all
 * system, transactional, and authentication emails.
 */

// P8: implementation lives in ./EmailLayoutBase (cycle-free); templates
// import from Base. This barrel re-exports Base + groups for consumers.
export * from './EmailLayoutBase';

// P3: template bodies live in grouped modules (single owner per group).
// Re-exported here so existing consumer import paths keep working; migrate
// consumers to group paths opportunistically, then drop these re-exports.
export { renderPasswordResetEmail } from './AuthEmails';
export { renderPurchaseConfirmationEmail, renderInvoiceEmail } from './CommerceEmails';
export { renderContactInquiryEmail, renderNotificationEmail } from './EngagementEmails';
export { renderListingApprovedEmail, renderListingRejectedEmail, renderListingExpiredEmail } from './ListingEmails';
export {
    renderBusinessExpiryAlertEmail,
    renderBusinessApprovedEmail,
    renderBusinessRejectedEmail,
    renderBusinessExpiredEmail,
    renderBusinessRenewedEmail,
} from './BusinessEmails';
export { renderReliabilityAlertEmail } from './SystemEmails';