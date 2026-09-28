import {
    EMAIL_TEMPLATE_CATEGORY,
    EMAIL_TEMPLATE_KEY,
    type EmailTemplateCategory,
    type EmailTemplateCustomization,
    type EmailTemplateKey,
    type EmailTemplateVariable,
} from '@esparex/contracts';

import {
    renderBusinessApprovedEmail,
    renderBusinessExpiredEmail,
    renderBusinessExpiryAlertEmail,
    renderBusinessRejectedEmail,
    renderBusinessRenewedEmail,
    renderContactInquiryEmail,
    renderInvoiceEmail,
    renderListingApprovedEmail,
    renderListingExpiredEmail,
    renderListingRejectedEmail,
    renderNotificationEmail,
    renderPasswordResetEmail,
    renderPurchaseConfirmationEmail,
    renderReliabilityAlertEmail,
} from '../templates/EmailLayout';

export interface TemplateDefinition {
    key: EmailTemplateKey;
    name: string;
    category: EmailTemplateCategory;
    description: string;
    trigger: string;
    defaultSubject: string;
    variables: EmailTemplateVariable[];
    renderPreview: (customization?: Partial<EmailTemplateCustomization>) => string;
}

export const TEMPLATE_DEFINITIONS: Record<EmailTemplateKey, TemplateDefinition> = {
    [EMAIL_TEMPLATE_KEY.PASSWORD_RESET]: {
        key: EMAIL_TEMPLATE_KEY.PASSWORD_RESET,
        name: 'Admin Password Reset',
        category: EMAIL_TEMPLATE_CATEGORY.AUTHENTICATION,
        description: 'Single-use password reset link dispatched when an admin requests password recovery.',
        trigger: 'Admin submits forgot-password request on login screen',
        defaultSubject: 'Reset Your Esparex Admin Password',
        variables: [
            { name: 'resetUrl', description: 'Secure password reset token link', example: 'https://admin.esparex.in/reset-password/abc123token' },
            { name: 'expiryMinutes', description: 'Expiration window in minutes', example: '10' },
        ],
        renderPreview: () => renderPasswordResetEmail({
            resetUrl: 'https://admin.esparex.in/reset-password/demo-preview-token',
            expiryMinutes: 10,
        }),
    },

    [EMAIL_TEMPLATE_KEY.PURCHASE_CONFIRMATION]: {
        key: EMAIL_TEMPLATE_KEY.PURCHASE_CONFIRMATION,
        name: 'Purchase Confirmation & Plan Activated',
        category: EMAIL_TEMPLATE_CATEGORY.BILLING,
        description: 'Payment receipt sent to user or dealer immediately upon successful plan purchase.',
        trigger: 'Payment gateway verifies transaction (payment.completed event)',
        defaultSubject: 'Payment Confirmation — {{planName}}',
        variables: [
            { name: 'orderId', description: 'Unique order identifier', example: 'ORD-987654' },
            { name: 'planName', description: 'Subscription plan or boost package name', example: 'Featured Dealer Pro' },
            { name: 'amount', description: 'Total amount paid with currency symbol', example: '₹4,999.00' },
            { name: 'formattedDate', description: 'Date of transaction', example: '28 Sep 2026' },
            { name: 'userName', description: 'Recipient customer name', example: 'Rahul Sharma' },
        ],
        renderPreview: () => renderPurchaseConfirmationEmail({
            orderId: 'ORD-987654',
            planName: 'Featured Dealer Pro',
            amount: '₹4,999.00',
            formattedDate: '28 Sep 2026',
            userName: 'Rahul Sharma',
        }),
    },

    [EMAIL_TEMPLATE_KEY.INVOICE_DELIVERY]: {
        key: EMAIL_TEMPLATE_KEY.INVOICE_DELIVERY,
        name: 'Tax Invoice Delivery',
        category: EMAIL_TEMPLATE_CATEGORY.BILLING,
        description: 'Official GST tax invoice delivery with PDF attachment sent after transaction settlement.',
        trigger: 'System generates official GST invoice document',
        defaultSubject: 'Esparex Tax Invoice — {{invoiceNumber}}',
        variables: [
            { name: 'invoiceNumber', description: 'Statutory GST invoice serial number', example: 'INV-2026-0042' },
            { name: 'planName', description: 'Itemized plan or service description', example: 'Featured Dealer Pro' },
            { name: 'amount', description: 'Total invoice amount inclusive of GST', example: '₹4,999.00' },
            { name: 'formattedDate', description: 'Date of invoice issuance', example: '28 Sep 2026' },
            { name: 'downloadUrl', description: 'Direct PDF download link', example: 'https://esparex.in/api/v1/invoices/INV-2026-0042/pdf' },
            { name: 'userName', description: 'Registered business or customer name', example: 'Pooja Verma' },
        ],
        renderPreview: () => renderInvoiceEmail({
            invoiceNumber: 'INV-2026-0042',
            planName: 'Featured Dealer Pro',
            amount: '₹4,999.00',
            formattedDate: '28 Sep 2026',
            downloadUrl: 'https://esparex.in/api/v1/invoices/INV-2026-0042/pdf',
            userName: 'Pooja Verma',
        }),
    },

    [EMAIL_TEMPLATE_KEY.CONTACT_INQUIRY]: {
        key: EMAIL_TEMPLATE_KEY.CONTACT_INQUIRY,
        name: 'Contact & Support Inquiry',
        category: EMAIL_TEMPLATE_CATEGORY.SYSTEM,
        description: 'Internal notification alert sent to support inbox when visitor submits the contact form.',
        trigger: 'Visitor or user submits inquiry on public contact form',
        defaultSubject: 'Contact Form: {{subject}}',
        variables: [
            { name: 'senderName', description: 'Name of person submitting inquiry', example: 'Amit Patel' },
            { name: 'senderEmail', description: 'Reply email address of sender', example: 'amit.patel@example.com' },
            { name: 'subject', description: 'Inquiry subject line', example: 'Bulk Spare Parts Listing Question' },
            { name: 'message', description: 'Message body content', example: 'Hello Esparex Team, I would like to enquire about listing over 500 spare parts under our registered dealership.' },
        ],
        renderPreview: () => renderContactInquiryEmail({
            name: 'Amit Patel',
            email: 'amit.patel@example.com',
            subject: 'Bulk Spare Parts Listing Question',
            message: 'Hello Esparex Team, I would like to enquire about listing over 500 spare parts under our registered dealership.',
        }),
    },

    [EMAIL_TEMPLATE_KEY.SYSTEM_NOTIFICATION]: {
        key: EMAIL_TEMPLATE_KEY.SYSTEM_NOTIFICATION,
        name: 'General System Notification',
        category: EMAIL_TEMPLATE_CATEGORY.SYSTEM,
        description: 'Versatile operational notification used for security alerts, platform updates, and transactional notes.',
        trigger: 'Dispatched by system jobs, admin announcements, or automated alerts',
        defaultSubject: 'Esparex Notification — {{headline}}',
        variables: [
            { name: 'headline', description: 'Primary announcement headline', example: 'System Scheduled Maintenance Notice' },
            { name: 'message', description: 'Full announcement message body', example: 'Please note that Esparex servers will undergo scheduled infrastructure maintenance on Sunday between 02:00 AM and 04:00 AM IST.' },
            { name: 'actionUrl', description: 'Optional button CTA target link', example: 'https://esparex.in/status' },
            { name: 'actionText', description: 'Optional CTA button text', example: 'View Status' },
        ],
        renderPreview: (customization) => renderNotificationEmail({
            title: customization?.customHeadline || 'System Scheduled Maintenance Notice',
            body: customization?.customNote || 'Please note that Esparex servers will undergo scheduled infrastructure maintenance on Sunday between 02:00 AM and 04:00 AM IST.',
            actionUrl: 'https://esparex.in/status',
            actionLabel: 'View Status',
        }),
    },

    [EMAIL_TEMPLATE_KEY.LISTING_APPROVED]: {
        key: EMAIL_TEMPLATE_KEY.LISTING_APPROVED,
        name: 'Listing Approved',
        category: EMAIL_TEMPLATE_CATEGORY.LISTINGS,
        description: 'Sent to seller when an ad listing passes moderation and is published live on the marketplace.',
        trigger: 'Moderator or auto-moderation marks listing status as APPROVED',
        defaultSubject: 'Your Listing is Now Live: {{title}}',
        variables: [
            { name: 'title', description: 'Title of the approved listing', example: 'Toyota Fortuner OEM Brake Pads (Set of 4)' },
            { name: 'viewUrl', description: 'Public URL to view live listing', example: 'https://esparex.in/ads/toyota-fortuner-brake-pads-87421' },
        ],
        renderPreview: (customization) => renderListingApprovedEmail({
            title: customization?.customHeadline || 'Toyota Fortuner OEM Brake Pads (Set of 4)',
            viewUrl: 'https://esparex.in/ads/toyota-fortuner-brake-pads-87421',
        }),
    },

    [EMAIL_TEMPLATE_KEY.LISTING_REJECTED]: {
        key: EMAIL_TEMPLATE_KEY.LISTING_REJECTED,
        name: 'Listing Rejected',
        category: EMAIL_TEMPLATE_CATEGORY.LISTINGS,
        description: 'Sent to seller when an ad listing fails moderation guidelines with specific rejection reason.',
        trigger: 'Moderator marks listing status as REJECTED with reason',
        defaultSubject: 'Action Required: Listing Review for {{title}}',
        variables: [
            { name: 'title', description: 'Title of the rejected listing', example: 'Used Car Spare Turbocharger' },
            { name: 'rejectionReason', description: 'Moderator rejection notes or policy citation', example: 'Image quality is too low and description missing manufacturer part number (OEM).' },
            { name: 'viewUrl', description: 'Link to edit and resubmit the listing', example: 'https://esparex.in/user/listings/edit/LST-87420' },
        ],
        renderPreview: (customization) => renderListingRejectedEmail({
            title: customization?.customHeadline || 'Used Car Spare Turbocharger',
            rejectionReason: customization?.customNote || 'Image quality is too low and description missing manufacturer part number (OEM).',
            viewUrl: 'https://esparex.in/user/listings/edit/LST-87420',
        }),
    },

    [EMAIL_TEMPLATE_KEY.LISTING_EXPIRED]: {
        key: EMAIL_TEMPLATE_KEY.LISTING_EXPIRED,
        name: 'Listing Expired',
        category: EMAIL_TEMPLATE_CATEGORY.LISTINGS,
        description: 'Notifies seller that their 30-day listing lifecycle has ended and invites them to renew or re-boost.',
        trigger: 'Nightly listing lifecycle cron job identifies expired listings',
        defaultSubject: 'Your Listing Has Expired: {{title}}',
        variables: [
            { name: 'title', description: 'Title of the expired listing', example: 'Hyundai Creta Headlight Assembly Left' },
            { name: 'renewUrl', description: 'One-click renewal or re-activation link', example: 'https://esparex.in/user/listings/renew/LST-65123' },
        ],
        renderPreview: (customization) => renderListingExpiredEmail({
            title: customization?.customHeadline || 'Hyundai Creta Headlight Assembly Left',
            renewUrl: 'https://esparex.in/user/listings/renew/LST-65123',
        }),
    },

    [EMAIL_TEMPLATE_KEY.BUSINESS_EXPIRY_ALERT]: {
        key: EMAIL_TEMPLATE_KEY.BUSINESS_EXPIRY_ALERT,
        name: 'Business Membership Expiry Warning',
        category: EMAIL_TEMPLATE_CATEGORY.BUSINESSES,
        description: 'Sent 7 days before business profile subscription expires to prevent storefront deactivation.',
        trigger: 'Subscription renewal alert cron job (7-day advance notice)',
        defaultSubject: 'Urgent: Business Profile Expiring in {{daysLeft}} Days — {{businessName}}',
        variables: [
            { name: 'businessName', description: 'Registered business name', example: 'Autotech Spares & Accessories' },
            { name: 'daysLeft', description: 'Days remaining before expiration', example: '7' },
            { name: 'expiryDate', description: 'Subscription expiration date', example: '05 Oct 2026' },
            { name: 'renewUrl', description: 'Direct business renewal checkout URL', example: 'https://esparex.in/dealers/membership/renew' },
        ],
        renderPreview: (customization) => renderBusinessExpiryAlertEmail({
            businessName: customization?.customHeadline || 'Autotech Spares & Accessories',
            daysLeft: 7,
            expiryDate: '05 Oct 2026',
            renewUrl: 'https://esparex.in/dealers/membership/renew',
        }),
    },

    [EMAIL_TEMPLATE_KEY.BUSINESS_APPROVED]: {
        key: EMAIL_TEMPLATE_KEY.BUSINESS_APPROVED,
        name: 'Business Storefront Approved',
        category: EMAIL_TEMPLATE_CATEGORY.BUSINESSES,
        description: 'Sent to dealer or business owner when their business storefront profile and GST docs are approved.',
        trigger: 'Admin verifies business KYC and approves profile',
        defaultSubject: 'Congratulations! Your Business Storefront is Approved: {{businessName}}',
        variables: [
            { name: 'businessName', description: 'Registered business storefront name', example: 'Supreme Auto Components' },
            { name: 'manageUrl', description: 'Direct business management URL', example: 'https://esparex.in/dealers/supreme-auto-components' },
        ],
        renderPreview: (customization) => renderBusinessApprovedEmail({
            businessName: customization?.customHeadline || 'Supreme Auto Components',
            manageUrl: 'https://esparex.in/dealers/supreme-auto-components',
        }),
    },

    [EMAIL_TEMPLATE_KEY.BUSINESS_REJECTED]: {
        key: EMAIL_TEMPLATE_KEY.BUSINESS_REJECTED,
        name: 'Business Profile Verification Rejected',
        category: EMAIL_TEMPLATE_CATEGORY.BUSINESSES,
        description: 'Sent when dealer business application is rejected with required clarification steps.',
        trigger: 'Admin rejects business verification due to incomplete KYC/GST',
        defaultSubject: 'Verification Update for Business: {{businessName}}',
        variables: [
            { name: 'businessName', description: 'Submitted business name', example: 'Express Car Mechanics' },
            { name: 'rejectionReason', description: 'Reason for verification rejection', example: 'GSTIN certificate provided does not match legal entity name.' },
            { name: 'applyUrl', description: 'Link to update KYC documentation', example: 'https://esparex.in/dealers/register/kyc' },
        ],
        renderPreview: (customization) => renderBusinessRejectedEmail({
            businessName: customization?.customHeadline || 'Express Car Mechanics',
            rejectionReason: customization?.customNote || 'GSTIN certificate provided does not match legal entity name.',
            applyUrl: 'https://esparex.in/dealers/register/kyc',
        }),
    },

    [EMAIL_TEMPLATE_KEY.BUSINESS_EXPIRED]: {
        key: EMAIL_TEMPLATE_KEY.BUSINESS_EXPIRED,
        name: 'Business Membership Expired',
        category: EMAIL_TEMPLATE_CATEGORY.BUSINESSES,
        description: 'Sent when business subscription has ended and storefront is converted to read-only/unverified.',
        trigger: 'Subscription expiry cron marks dealer status as EXPIRED',
        defaultSubject: 'Your Business Subscription Has Expired — {{businessName}}',
        variables: [
            { name: 'businessName', description: 'Business name', example: 'Royal Motor Works' },
            { name: 'renewUrl', description: 'Storefront re-activation link', example: 'https://esparex.in/dealers/membership/renew' },
        ],
        renderPreview: (customization) => renderBusinessExpiredEmail({
            businessName: customization?.customHeadline || 'Royal Motor Works',
            renewUrl: 'https://esparex.in/dealers/membership/renew',
        }),
    },

    [EMAIL_TEMPLATE_KEY.BUSINESS_RENEWED]: {
        key: EMAIL_TEMPLATE_KEY.BUSINESS_RENEWED,
        name: 'Business Membership Renewed',
        category: EMAIL_TEMPLATE_CATEGORY.BUSINESSES,
        description: 'Sent upon successful payment renewal extending business membership validity.',
        trigger: 'Renewal invoice settled and business validity period updated',
        defaultSubject: 'Business Membership Renewed Successfully — {{businessName}}',
        variables: [
            { name: 'businessName', description: 'Business name', example: 'Royal Motor Works' },
            { name: 'expiresAt', description: 'New membership expiry date', example: '28 Sep 2027' },
            { name: 'manageUrl', description: 'Direct link to dealer dashboard', example: 'https://esparex.in/dealers/dashboard' },
        ],
        renderPreview: (customization) => renderBusinessRenewedEmail({
            businessName: customization?.customHeadline || 'Royal Motor Works',
            expiresAt: '28 Sep 2027',
            manageUrl: 'https://esparex.in/dealers/dashboard',
        }),
    },

    [EMAIL_TEMPLATE_KEY.RELIABILITY_ALERT]: {
        key: EMAIL_TEMPLATE_KEY.RELIABILITY_ALERT,
        name: 'Infrastructure Reliability Alert',
        category: EMAIL_TEMPLATE_CATEGORY.SYSTEM,
        description: 'High-priority alert dispatched to engineering administrators when error budget or threshold trips.',
        trigger: 'Alert engine / Sentry / Health monitor trips severity threshold',
        defaultSubject: 'Reliability Alert [{{service}}]: {{summary}}',
        variables: [
            { name: 'title', description: 'Alert title', example: 'Infrastructure Reliability Alert: Webhook Spike' },
            { name: 'severity', description: 'Alert severity (critical, high, warning)', example: 'critical' },
            { name: 'service', description: 'Affected subsystem or microservice name', example: 'Payment-Webhook-Worker' },
            { name: 'summary', description: 'Summary of failure condition or alert', example: 'Webhook 5xx Error Rate > 5% over 5m' },
            { name: 'timestamp', description: 'Incident event timestamp', example: '2026-09-28 08:30:00 UTC' },
        ],
        renderPreview: () => renderReliabilityAlertEmail({
            title: 'Infrastructure Reliability Alert: Webhook Error Spike',
            severity: 'critical',
            type: 'PAYMENT_WEBHOOK_FAILURE',
            service: 'Payment-Webhook-Worker',
            module: 'RazorpaySignature',
            summary: 'Webhook 5xx Error Rate > 5% over 5m',
            timestamp: '2026-09-28 08:30:00 UTC',
            metadataJson: JSON.stringify({ errorRate: '5.2%', threshold: '5.0%', region: 'ap-south-1' }, null, 2),
        }),
    },
};
