/**
 * Email Template Enums — Single Source of Truth (SSOT)
 *
 * Authoritative identifiers and category classifications for all
 * system and transactional email templates across the Esparex platform.
 */

export const EMAIL_TEMPLATE_KEY = {
    PASSWORD_RESET: 'PASSWORD_RESET',
    PURCHASE_CONFIRMATION: 'PURCHASE_CONFIRMATION',
    INVOICE_DELIVERY: 'INVOICE_DELIVERY',
    CONTACT_INQUIRY: 'CONTACT_INQUIRY',
    SYSTEM_NOTIFICATION: 'SYSTEM_NOTIFICATION',
    LISTING_APPROVED: 'LISTING_APPROVED',
    LISTING_REJECTED: 'LISTING_REJECTED',
    LISTING_EXPIRED: 'LISTING_EXPIRED',
    BUSINESS_EXPIRY_ALERT: 'BUSINESS_EXPIRY_ALERT',
    BUSINESS_APPROVED: 'BUSINESS_APPROVED',
    BUSINESS_REJECTED: 'BUSINESS_REJECTED',
    BUSINESS_EXPIRED: 'BUSINESS_EXPIRED',
    BUSINESS_RENEWED: 'BUSINESS_RENEWED',
    RELIABILITY_ALERT: 'RELIABILITY_ALERT',
} as const;

export type EmailTemplateKey = (typeof EMAIL_TEMPLATE_KEY)[keyof typeof EMAIL_TEMPLATE_KEY];

export const EMAIL_TEMPLATE_KEYS = Object.values(EMAIL_TEMPLATE_KEY) as [
    EmailTemplateKey,
    ...EmailTemplateKey[]
];

export const EMAIL_TEMPLATE_CATEGORY = {
    AUTHENTICATION: 'authentication',
    BILLING: 'billing',
    LISTINGS: 'listings',
    BUSINESSES: 'businesses',
    SYSTEM: 'system',
} as const;

export type EmailTemplateCategory = (typeof EMAIL_TEMPLATE_CATEGORY)[keyof typeof EMAIL_TEMPLATE_CATEGORY];

export const EMAIL_TEMPLATE_CATEGORIES = Object.values(EMAIL_TEMPLATE_CATEGORY) as [
    EmailTemplateCategory,
    ...EmailTemplateCategory[]
];
