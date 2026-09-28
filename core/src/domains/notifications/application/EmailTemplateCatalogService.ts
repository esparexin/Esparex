import {
    type EmailTemplateCustomization,
    type EmailTemplateDTO,
    type EmailTemplateKey,
    type EmailTemplatePreviewDTO,
} from '@esparex/contracts';

import {
    TEMPLATE_DEFINITIONS,
    type TemplateDefinition,
} from './emailTemplateRegistry';

export { TEMPLATE_DEFINITIONS, type TemplateDefinition };

/**
 * Service managing metadata catalog, sample previews, and custom overlays
 * for canonical transactional email templates.
 */
export class EmailTemplateCatalogService {
    /**
     * Replaces `{{variableName}}` placeholders in a text string.
     */
    public static interpolateVariables(
        template: string,
        params: Record<string, string | number | undefined>
    ): string {
        return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
            const val = params[key];
            return val !== undefined && val !== null ? String(val) : `{{${key}}}`;
        });
    }

    /**
     * Lists all registered email templates with customizations merged from system config.
     */
    public getAllTemplates(customizations: EmailTemplateCustomization[] = []): EmailTemplateDTO[] {
        const customMap = new Map<EmailTemplateKey, EmailTemplateCustomization>();
        customizations.forEach((c) => {
            if (c?.key) {
                customMap.set(c.key, c);
            }
        });

        return Object.values(TEMPLATE_DEFINITIONS).map((def) => {
            const custom = customMap.get(def.key);
            const isCustomized = Boolean(custom?.subject || custom?.customHeadline || custom?.customNote);
            const activeSubject = custom?.subject?.trim() || def.defaultSubject;

            return {
                key: def.key,
                name: def.name,
                category: def.category,
                description: def.description,
                trigger: def.trigger,
                defaultSubject: def.defaultSubject,
                subject: activeSubject,
                isCustomized,
                customSubject: custom?.subject,
                customHeadline: custom?.customHeadline,
                customNote: custom?.customNote,
                variables: def.variables,
                updatedAt: custom?.updatedAt,
                updatedBy: custom?.updatedBy,
            };
        });
    }

    /**
     * Returns a single template DTO by key with customizations applied.
     */
    public getTemplateByKey(
        key: EmailTemplateKey,
        customizations: EmailTemplateCustomization[] = []
    ): EmailTemplateDTO | undefined {
        const def = TEMPLATE_DEFINITIONS[key];
        if (!def) return undefined;

        const custom = customizations.find((c) => c.key === key);
        const isCustomized = Boolean(custom?.subject || custom?.customHeadline || custom?.customNote);
        const activeSubject = custom?.subject?.trim() || def.defaultSubject;

        return {
            key: def.key,
            name: def.name,
            category: def.category,
            description: def.description,
            trigger: def.trigger,
            defaultSubject: def.defaultSubject,
            subject: activeSubject,
            isCustomized,
            customSubject: custom?.subject,
            customHeadline: custom?.customHeadline,
            customNote: custom?.customNote,
            variables: def.variables,
            updatedAt: custom?.updatedAt,
            updatedBy: custom?.updatedBy,
        };
    }

    /**
     * Generates a live HTML preview of any template populated with sample data.
     */
    public generatePreview(
        key: EmailTemplateKey,
        customization?: Partial<EmailTemplateCustomization>
    ): EmailTemplatePreviewDTO {
        const def = TEMPLATE_DEFINITIONS[key];
        if (!def) {
            throw new Error(`Email template key "${key}" is not registered in catalog`);
        }

        const subjectRaw = customization?.subject?.trim() || def.defaultSubject;
        // Interpolate sample data into subject for preview
        const sampleDict: Record<string, string> = {};
        def.variables.forEach((v) => {
            sampleDict[v.name] = v.example;
        });

        const subject = EmailTemplateCatalogService.interpolateVariables(subjectRaw, sampleDict);
        const html = def.renderPreview(customization);

        return { key, subject, html };
    }

    /**
     * Resolves the runtime subject line for a given template key.
     *
     * This method is the dispatch-time API consumed by email dispatch services
     * (e.g. EmailService, NotificationDispatcher) when sending real emails.
     * It applies any admin-configured subject overlay from SystemConfig.emailTemplates,
     * then interpolates dynamic runtime parameters (e.g. `{{planName}}`).
     *
     * It is NOT called from admin controllers, which use `getAllTemplates()` /
     * `getTemplateByKey()` for catalog management instead.
     */
    public resolveSubject(
        key: EmailTemplateKey,
        defaultSubject: string,
        params: Record<string, string | number | undefined> = {},
        customizations: EmailTemplateCustomization[] = []
    ): string {
        const custom = customizations.find((c) => c.key === key);
        const rawSubject = custom?.subject?.trim() || defaultSubject;
        return EmailTemplateCatalogService.interpolateVariables(rawSubject, params);
    }
}

export const emailTemplateCatalogService = new EmailTemplateCatalogService();
