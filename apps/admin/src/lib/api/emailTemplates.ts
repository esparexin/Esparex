import {
    type EmailTemplateCustomization,
    type EmailTemplateDTO,
    type EmailTemplateKey,
    type EmailTemplatePreviewDTO,
    type UpdateEmailTemplatePayload,
} from "@esparex/contracts";
import { ADMIN_ROUTES } from "@esparex/shared";
import { adminFetch } from "./adminClient";

/**
 * Lists all registered canonical email templates with merged system customizations.
 */
export async function listEmailTemplates(): Promise<EmailTemplateDTO[]> {
    const res = await adminFetch<EmailTemplateDTO[]>(ADMIN_ROUTES.EMAIL_TEMPLATES);
    return res.data || [];
}

/**
 * Retrieves a single email template by key.
 */
export async function getEmailTemplate(key: EmailTemplateKey): Promise<EmailTemplateDTO> {
    const res = await adminFetch<EmailTemplateDTO>(ADMIN_ROUTES.EMAIL_TEMPLATE_BY_KEY(key));
    if (!res.data) throw new Error(res.error || "Email template not found");
    return res.data;
}

/**
 * Generates an HTML live preview with sample data and optional draft overrides.
 */
export async function getEmailTemplatePreview(
    key: EmailTemplateKey,
    customization?: Partial<EmailTemplateCustomization>
): Promise<EmailTemplatePreviewDTO> {
    const res = await adminFetch<EmailTemplatePreviewDTO>(ADMIN_ROUTES.EMAIL_TEMPLATE_PREVIEW(key), {
        method: "POST",
        body: JSON.stringify(customization ?? {}),
    });
    if (!res.data) throw new Error(res.error || "Failed to generate preview");
    return res.data;
}

/**
 * Saves customizations (subject, headline, note) for an email template.
 */
export async function updateEmailTemplate(
    key: EmailTemplateKey,
    payload: UpdateEmailTemplatePayload
): Promise<EmailTemplateDTO> {
    const res = await adminFetch<EmailTemplateDTO>(ADMIN_ROUTES.EMAIL_TEMPLATE_BY_KEY(key), {
        method: "PUT",
        body: JSON.stringify(payload),
    });
    if (!res.data) throw new Error(res.error || "Failed to update email template");
    return res.data;
}

/**
 * Resets customizations for an email template back to default system layout.
 */
export async function resetEmailTemplate(key: EmailTemplateKey): Promise<EmailTemplateDTO> {
    const res = await adminFetch<EmailTemplateDTO>(ADMIN_ROUTES.EMAIL_TEMPLATE_RESET(key), {
        method: "POST",
    });
    if (!res.data) throw new Error(res.error || "Failed to reset email template");
    return res.data;
}

/**
 * Dispatches a test email rendered with the specified template & customizations.
 */
export async function sendTestEmailTemplate(
    key: EmailTemplateKey,
    recipientEmail: string,
    customization?: Partial<EmailTemplateCustomization>
): Promise<{ recipient: string; messageId?: string }> {
    const res = await adminFetch<{ recipient: string; messageId?: string }>(ADMIN_ROUTES.EMAIL_TEMPLATE_TEST(key), {
        method: "POST",
        body: JSON.stringify({ recipientEmail, customization }),
    });
    if (!res.data) throw new Error(res.error || "Failed to send test email");
    return res.data;
}
