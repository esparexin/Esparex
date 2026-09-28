import { Request, Response } from 'express';
import {
    EMAIL_TEMPLATE_KEY,
    sendTestEmailTemplateSchema,
    updateEmailTemplateSchema,
    type EmailTemplateCustomization,
    type EmailTemplateKey,
} from '@esparex/contracts';
import { emailTemplateCatalogService } from '@esparex/core/domains/notifications/application/EmailTemplateCatalogService';
import { emailService } from '@esparex/core/domains/notifications/application/EmailService';
import {
    getSystemConfigForRead,
    updateSystemConfigSections,
} from '@esparex/core/services/SystemConfigService';

import { sendAdminError, sendSuccessResponse } from '../../utils/adminBaseController';
import { logAdminAction } from '../../utils/adminLogger';

type AuthenticatedAdminUser = {
    _id?: string;
    id?: string;
    email?: string;
};

const getAdminIdentifier = (req: Request): string => {
    const user = req.user as AuthenticatedAdminUser | undefined;
    return user?.email || user?._id || user?.id || 'admin';
};

const getAdminUserId = (req: Request): string | undefined => {
    const user = req.user as AuthenticatedAdminUser | undefined;
    const id = user?._id || user?.id;
    return id ? String(id) : undefined;
};

const isValidTemplateKey = (key: unknown): key is EmailTemplateKey => {
    return typeof key === 'string' && Object.values(EMAIL_TEMPLATE_KEY).includes(key as EmailTemplateKey);
};

/**
 * Lists all registered canonical email templates with merged system customizations.
 */
export const listEmailTemplates = async (req: Request, res: Response) => {
    try {
        const config = await getSystemConfigForRead();
        const customizations = (config.emailTemplates || []) as EmailTemplateCustomization[];
        const templates = emailTemplateCatalogService.getAllTemplates(customizations);

        sendSuccessResponse(res, templates);
    } catch (error) {
        return sendAdminError(req, res, error);
    }
};

/**
 * Retrieves a single email template by key.
 */
export const getEmailTemplate = async (req: Request, res: Response) => {
    try {
        const { key } = req.params;
        if (!isValidTemplateKey(key)) {
            return sendAdminError(req, res, `Invalid email template key: ${String(key)}`, 404);
        }

        const config = await getSystemConfigForRead();
        const customizations = (config.emailTemplates || []) as EmailTemplateCustomization[];
        const template = emailTemplateCatalogService.getTemplateByKey(key, customizations);

        if (!template) {
            return sendAdminError(req, res, `Email template not found: ${key}`, 404);
        }

        sendSuccessResponse(res, template);
    } catch (error) {
        return sendAdminError(req, res, error);
    }
};

/**
 * Generates an HTML live preview for an email template, optionally with live customization overrides.
 */
export const getEmailTemplatePreview = async (req: Request, res: Response) => {
    try {
        const { key } = req.params;
        if (!isValidTemplateKey(key)) {
            return sendAdminError(req, res, `Invalid email template key: ${String(key)}`, 404);
        }

        const overrides = (req.body && typeof req.body === 'object' ? req.body : {}) as Partial<EmailTemplateCustomization>;
        const preview = emailTemplateCatalogService.generatePreview(key, overrides);

        sendSuccessResponse(res, preview);
    } catch (error) {
        return sendAdminError(req, res, error);
    }
};

/**
 * Saves customizations (subject, headline, note) for a canonical email template.
 */
export const updateEmailTemplate = async (req: Request, res: Response) => {
    try {
        const { key } = req.params;
        if (!isValidTemplateKey(key)) {
            return sendAdminError(req, res, `Invalid email template key: ${String(key)}`, 404);
        }

        const parsed = updateEmailTemplateSchema.parse(req.body);
        const config = await getSystemConfigForRead();
        const existingCustomizations = ((config.emailTemplates || []) as EmailTemplateCustomization[]).filter(
            (c) => c.key !== key
        );

        const updatedCustomization: EmailTemplateCustomization = {
            key,
            subject: parsed.subject?.trim(),
            customHeadline: parsed.customHeadline?.trim(),
            customNote: parsed.customNote?.trim(),
            updatedAt: new Date().toISOString(),
            updatedBy: getAdminIdentifier(req),
        };

        const nextCustomizations = [...existingCustomizations, updatedCustomization];
        await updateSystemConfigSections({ emailTemplates: nextCustomizations }, getAdminUserId(req));

        await logAdminAction(
            req,
            'UPDATE_EMAIL_TEMPLATE',
            'Config',
            `emailTemplates.${key}`,
            { key, updates: parsed }
        );

        const updatedTemplate = emailTemplateCatalogService.getTemplateByKey(key, nextCustomizations);
        sendSuccessResponse(res, updatedTemplate, 'Email template customized successfully');
    } catch (error) {
        return sendAdminError(req, res, error);
    }
};

/**
 * Resets customizations for an email template back to default system layout.
 */
export const resetEmailTemplate = async (req: Request, res: Response) => {
    try {
        const { key } = req.params;
        if (!isValidTemplateKey(key)) {
            return sendAdminError(req, res, `Invalid email template key: ${String(key)}`, 404);
        }

        const config = await getSystemConfigForRead();
        const nextCustomizations = ((config.emailTemplates || []) as EmailTemplateCustomization[]).filter(
            (c) => c.key !== key
        );

        await updateSystemConfigSections({ emailTemplates: nextCustomizations }, getAdminUserId(req));

        await logAdminAction(
            req,
            'RESET_EMAIL_TEMPLATE',
            'Config',
            `emailTemplates.${key}`,
            { key }
        );

        const resetTemplate = emailTemplateCatalogService.getTemplateByKey(key, nextCustomizations);
        sendSuccessResponse(res, resetTemplate, 'Email template restored to system defaults');
    } catch (error) {
        return sendAdminError(req, res, error);
    }
};

/**
 * Dispatches a live test email rendered with the specified template & customizations.
 */
export const sendTestEmailTemplate = async (req: Request, res: Response) => {
    try {
        const { key } = req.params;
        if (!isValidTemplateKey(key)) {
            return sendAdminError(req, res, `Invalid email template key: ${String(key)}`, 404);
        }

        const parsed = sendTestEmailTemplateSchema.parse(req.body);

        // Pre-flight check SMTP credentials
        const verifyResult = await emailService.verify();
        if (!verifyResult.ok) {
            const diagnostic = verifyResult.error || 'SMTP credentials are not configured or email is disabled in settings';
            return sendAdminError(req, res, `SMTP verification failed: ${diagnostic}`, 400);
        }

        const preview = emailTemplateCatalogService.generatePreview(key, parsed.customization);
        const result = await emailService.send({
            to: parsed.recipientEmail,
            subject: `[TEST] ${preview.subject}`,
            html: preview.html,
        });

        if (!result.success) {
            const detail = result.errorMessage || result.skippedReason || 'Delivery failure';
            return sendAdminError(req, res, `SMTP send failed: ${detail}`, 502);
        }

        await logAdminAction(
            req,
            'SEND_TEST_EMAIL_TEMPLATE',
            'Config',
            `emailTemplates.${key}`,
            { key, recipient: parsed.recipientEmail, messageId: result.messageId }
        );

        sendSuccessResponse(
            res,
            { recipient: parsed.recipientEmail, messageId: result.messageId },
            `Test email dispatched to ${parsed.recipientEmail}`
        );
    } catch (error) {
        return sendAdminError(req, res, error);
    }
};
