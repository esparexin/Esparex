import type { EmailTemplateCategory, EmailTemplateKey } from '../enums/emailTemplate';

/**
 * Variable metadata describing placeholder tokens available in a template.
 */
export interface EmailTemplateVariable {
    name: string;
    description: string;
    example: string;
}

/**
 * Customization state persisted in SystemConfig.emailTemplates.
 */
export interface EmailTemplateCustomization {
    key: EmailTemplateKey;
    subject?: string;
    customHeadline?: string;
    customNote?: string;
    updatedAt?: string;
    updatedBy?: string;
}

/**
 * Canonical DTO for an Email Template exposed to Admin UI.
 */
export interface EmailTemplateDTO {
    key: EmailTemplateKey;
    name: string;
    category: EmailTemplateCategory;
    description: string;
    trigger: string;
    defaultSubject: string;
    subject: string;
    isCustomized: boolean;
    customSubject?: string;
    customHeadline?: string;
    customNote?: string;
    variables: EmailTemplateVariable[];
    updatedAt?: string;
    updatedBy?: string;
}

/**
 * Live HTML preview DTO.
 */
export interface EmailTemplatePreviewDTO {
    key: EmailTemplateKey;
    subject: string;
    html: string;
}

/**
 * Admin update payload.
 */
export interface UpdateEmailTemplatePayload {
    subject?: string;
    customHeadline?: string;
    customNote?: string;
}

