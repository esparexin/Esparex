import { z } from 'zod';
import { EMAIL_TEMPLATE_KEYS } from '../enums/emailTemplate';

export const emailTemplateKeySchema = z.enum(EMAIL_TEMPLATE_KEYS);

export const emailTemplateCustomizationSchema = z.object({
    key: emailTemplateKeySchema,
    subject: z.string().trim().max(200, 'Subject must be 200 characters or fewer').optional(),
    customHeadline: z.string().trim().max(200, 'Headline must be 200 characters or fewer').optional(),
    customNote: z.string().trim().max(500, 'Custom note must be 500 characters or fewer').optional(),
    updatedAt: z.string().optional(),
    updatedBy: z.string().optional(),
}).strict();

export const updateEmailTemplateSchema = z.object({
    subject: z.string().trim().max(200, 'Subject must be 200 characters or fewer').optional(),
    customHeadline: z.string().trim().max(200, 'Headline must be 200 characters or fewer').optional(),
    customNote: z.string().trim().max(500, 'Custom note must be 500 characters or fewer').optional(),
}).strict().refine(
    (data) => data.subject !== undefined || data.customHeadline !== undefined || data.customNote !== undefined,
    { message: 'At least one field (subject, customHeadline, or customNote) must be provided' }
);

export const sendTestEmailTemplateSchema = z.object({
    recipientEmail: z.string().trim().email('Valid recipient email address is required'),
}).strict();
