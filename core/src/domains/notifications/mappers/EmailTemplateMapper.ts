import type {
    EmailTemplateCustomization,
    EmailTemplateDTO,
} from '@esparex/contracts';

import type { TemplateDefinition } from '../application/emailTemplateRegistry';

/**
 * EmailTemplateMapper — owns TemplateDefinition → EmailTemplateDTO mapping.
 *
 * Mapper ownership rule (audit E14): services never perform mapping logic.
 * EmailTemplateCatalogService delegates DTO assembly here.
 */
export const mapTemplateDefinitionToDTO = (
    def: TemplateDefinition,
    custom?: EmailTemplateCustomization
): EmailTemplateDTO => {
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
};
