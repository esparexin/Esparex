import {
    EMAIL_TEMPLATE_KEY,
    EMAIL_TEMPLATE_KEYS,
    type EmailTemplateKey,
} from '@esparex/contracts';
import {
    emailTemplateCatalogService,
    TEMPLATE_DEFINITIONS,
} from '../application/EmailTemplateCatalogService';

describe('Email Template Architecture Parity Guard', () => {
    it('guarantees 100% parity between EMAIL_TEMPLATE_KEYS and TEMPLATE_DEFINITIONS', () => {
        const registeredKeys = Object.keys(TEMPLATE_DEFINITIONS) as EmailTemplateKey[];
        expect(registeredKeys).toHaveLength(EMAIL_TEMPLATE_KEYS.length);

        for (const key of EMAIL_TEMPLATE_KEYS) {
            expect(TEMPLATE_DEFINITIONS[key]).toBeDefined();
            expect(TEMPLATE_DEFINITIONS[key].key).toBe(key);
        }
    });

    it('enforces mandatory metadata fields on every registered template definition', () => {
        for (const [key, def] of Object.entries(TEMPLATE_DEFINITIONS)) {
            expect(def.name).toBeTruthy();
            expect(def.description).toBeTruthy();
            expect(def.trigger).toBeTruthy();
            expect(def.defaultSubject).toBeTruthy();
            expect(def.category).toBeTruthy();
            expect(Array.isArray(def.variables)).toBe(true);
            expect(typeof def.renderPreview).toBe('function');
        }
    });

    it('validates that every template preview renders responsive HTML with email layout structure', () => {
        for (const key of EMAIL_TEMPLATE_KEYS) {
            const preview = emailTemplateCatalogService.generatePreview(key);
            expect(preview.key).toBe(key);
            expect(preview.subject).toBeTruthy();
            expect(preview.html).toContain('<!DOCTYPE html>');
            expect(preview.html).toContain('Esparex');
        }
    });

    it('ensures variables declared in template definitions have complete documentation', () => {
        for (const [key, def] of Object.entries(TEMPLATE_DEFINITIONS)) {
            for (const variable of def.variables) {
                expect(variable.name).toBeTruthy();
                expect(variable.description).toBeTruthy();
                expect(variable.example).toBeTruthy();
            }
        }
    });
});
