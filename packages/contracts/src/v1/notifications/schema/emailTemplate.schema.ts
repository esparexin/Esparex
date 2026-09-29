import { z } from 'zod';
import { EMAIL_TEMPLATE_LIMITS } from '../../common/constants/fieldLimits';
import { EMAIL_TEMPLATE_KEYS } from '../enums/emailTemplate';

export const emailTemplateKeySchema = z.enum(EMAIL_TEMPLATE_KEYS);

export const emailTemplateCustomizationSchema = z.object({
    key: emailTemplateKeySchema,
    subject: z.string().trim().max(EMAIL_TEMPLATE_LIMITS.SUBJECT.MAX, EMAIL_TEMPLATE_LIMITS.SUBJECT.ERROR_MAX).optional(),
    customHeadline: z.string().trim().max(EMAIL_TEMPLATE_LIMITS.HEADLINE.MAX, EMAIL_TEMPLATE_LIMITS.HEADLINE.ERROR_MAX).optional(),
    customNote: z.string().trim().max(EMAIL_TEMPLATE_LIMITS.NOTE.MAX, EMAIL_TEMPLATE_LIMITS.NOTE.ERROR_MAX).optional(),
    updatedAt: z.string().optional(),
    updatedBy: z.string().optional(),
}).strict();

export const updateEmailTemplateSchema = z.object({
    subject: z.string().trim().max(EMAIL_TEMPLATE_LIMITS.SUBJECT.MAX, EMAIL_TEMPLATE_LIMITS.SUBJECT.ERROR_MAX).optional(),
    customHeadline: z.string().trim().max(EMAIL_TEMPLATE_LIMITS.HEADLINE.MAX, EMAIL_TEMPLATE_LIMITS.HEADLINE.ERROR_MAX).optional(),
    customNote: z.string().trim().max(EMAIL_TEMPLATE_LIMITS.NOTE.MAX, EMAIL_TEMPLATE_LIMITS.NOTE.ERROR_MAX).optional(),
}).strict().refine(
    (data) => data.subject !== undefined || data.customHeadline !== undefined || data.customNote !== undefined,
    { message: 'At least one field (subject, customHeadline, or customNote) must be provided' }
);

export const sendTestEmailTemplateSchema = z.object({
    recipientEmail: z.string().trim().email('Valid recipient email address is required'),
    customization: z.object({
        subject: z.string().trim().max(EMAIL_TEMPLATE_LIMITS.SUBJECT.MAX).optional(),
        customHeadline: z.string().trim().max(EMAIL_TEMPLATE_LIMITS.HEADLINE.MAX).optional(),
        customNote: z.string().trim().max(EMAIL_TEMPLATE_LIMITS.NOTE.MAX).optional(),
    }).optional(),
}).strict();
