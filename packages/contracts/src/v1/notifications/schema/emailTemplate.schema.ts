import { z } from 'zod';
import { EMAIL_TEMPLATE_LIMITS } from '../../common/constants/fieldLimits';
import { EMAIL_TEMPLATE_KEYS } from '../enums/emailTemplate';

export const emailTemplateKeySchema = z.enum(EMAIL_TEMPLATE_KEYS);

export const emailTemplateCustomizationSchema = z.object({
    key: emailTemplateKeySchema,
    subject: z.union([z.string().trim().max(EMAIL_TEMPLATE_LIMITS.SUBJECT.MAX, EMAIL_TEMPLATE_LIMITS.SUBJECT.ERROR_MAX), z.literal('')]).optional(),
    customHeadline: z.union([z.string().trim().max(EMAIL_TEMPLATE_LIMITS.HEADLINE.MAX, EMAIL_TEMPLATE_LIMITS.HEADLINE.ERROR_MAX), z.literal('')]).optional(),
    customNote: z.union([z.string().trim().max(EMAIL_TEMPLATE_LIMITS.NOTE.MAX, EMAIL_TEMPLATE_LIMITS.NOTE.ERROR_MAX), z.literal('')]).optional(),
    updatedAt: z.string().optional(),
    updatedBy: z.string().optional(),
}).strict();

export const updateEmailTemplateSchema = z.object({
    subject: z.union([z.string().trim().max(EMAIL_TEMPLATE_LIMITS.SUBJECT.MAX, EMAIL_TEMPLATE_LIMITS.SUBJECT.ERROR_MAX), z.literal('')]).optional(),
    customHeadline: z.union([z.string().trim().max(EMAIL_TEMPLATE_LIMITS.HEADLINE.MAX, EMAIL_TEMPLATE_LIMITS.HEADLINE.ERROR_MAX), z.literal('')]).optional(),
    customNote: z.union([z.string().trim().max(EMAIL_TEMPLATE_LIMITS.NOTE.MAX, EMAIL_TEMPLATE_LIMITS.NOTE.ERROR_MAX), z.literal('')]).optional(),
}).strict().refine(
    (data) => data.subject !== undefined || data.customHeadline !== undefined || data.customNote !== undefined,
    { message: 'At least one field (subject, customHeadline, or customNote) must be provided' }
);

export const sendTestEmailTemplateSchema = z.object({
    recipientEmail: z.string().trim().email('Valid recipient email address is required'),
    customization: z.object({
        subject: z.union([z.string().trim().max(EMAIL_TEMPLATE_LIMITS.SUBJECT.MAX), z.literal('')]).optional(),
        customHeadline: z.union([z.string().trim().max(EMAIL_TEMPLATE_LIMITS.HEADLINE.MAX), z.literal('')]).optional(),
        customNote: z.union([z.string().trim().max(EMAIL_TEMPLATE_LIMITS.NOTE.MAX), z.literal('')]).optional(),
    }).optional(),
}).strict();
