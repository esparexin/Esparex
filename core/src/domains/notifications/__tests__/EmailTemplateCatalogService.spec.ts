
import {
    EMAIL_TEMPLATE_CATEGORY,
    EMAIL_TEMPLATE_KEY,
    type EmailTemplateCustomization,
} from '@esparex/contracts';

import {
    emailTemplateCatalogService,
    EmailTemplateCatalogService,
} from '../application/EmailTemplateCatalogService';

describe('EmailTemplateCatalogService', () => {
    describe('getAllTemplates', () => {
        it('returns all 14 canonical system and transactional templates', () => {
            const templates = emailTemplateCatalogService.getAllTemplates();
            expect(templates).toHaveLength(14);

            const keys = templates.map((t) => t.key);
            expect(keys).toContain(EMAIL_TEMPLATE_KEY.PASSWORD_RESET);
            expect(keys).toContain(EMAIL_TEMPLATE_KEY.PURCHASE_CONFIRMATION);
            expect(keys).toContain(EMAIL_TEMPLATE_KEY.INVOICE_DELIVERY);
            expect(keys).toContain(EMAIL_TEMPLATE_KEY.CONTACT_INQUIRY);
            expect(keys).toContain(EMAIL_TEMPLATE_KEY.SYSTEM_NOTIFICATION);
            expect(keys).toContain(EMAIL_TEMPLATE_KEY.LISTING_APPROVED);
            expect(keys).toContain(EMAIL_TEMPLATE_KEY.LISTING_REJECTED);
            expect(keys).toContain(EMAIL_TEMPLATE_KEY.LISTING_EXPIRED);
            expect(keys).toContain(EMAIL_TEMPLATE_KEY.BUSINESS_EXPIRY_ALERT);
            expect(keys).toContain(EMAIL_TEMPLATE_KEY.BUSINESS_APPROVED);
            expect(keys).toContain(EMAIL_TEMPLATE_KEY.BUSINESS_REJECTED);
            expect(keys).toContain(EMAIL_TEMPLATE_KEY.BUSINESS_EXPIRED);
            expect(keys).toContain(EMAIL_TEMPLATE_KEY.BUSINESS_RENEWED);
            expect(keys).toContain(EMAIL_TEMPLATE_KEY.RELIABILITY_ALERT);
        });

        it('assigns correct categories to all templates', () => {
            const templates = emailTemplateCatalogService.getAllTemplates();
            const categoryMap = new Map(templates.map((t) => [t.key, t.category]));

            expect(categoryMap.get(EMAIL_TEMPLATE_KEY.PASSWORD_RESET)).toBe(EMAIL_TEMPLATE_CATEGORY.AUTHENTICATION);
            expect(categoryMap.get(EMAIL_TEMPLATE_KEY.PURCHASE_CONFIRMATION)).toBe(EMAIL_TEMPLATE_CATEGORY.BILLING);
            expect(categoryMap.get(EMAIL_TEMPLATE_KEY.INVOICE_DELIVERY)).toBe(EMAIL_TEMPLATE_CATEGORY.BILLING);
            expect(categoryMap.get(EMAIL_TEMPLATE_KEY.LISTING_APPROVED)).toBe(EMAIL_TEMPLATE_CATEGORY.LISTINGS);
            expect(categoryMap.get(EMAIL_TEMPLATE_KEY.BUSINESS_APPROVED)).toBe(EMAIL_TEMPLATE_CATEGORY.BUSINESSES);
            expect(categoryMap.get(EMAIL_TEMPLATE_KEY.RELIABILITY_ALERT)).toBe(EMAIL_TEMPLATE_CATEGORY.SYSTEM);
        });

        it('merges active customizations onto template DTOs', () => {
            const customizations: EmailTemplateCustomization[] = [
                {
                    key: EMAIL_TEMPLATE_KEY.PURCHASE_CONFIRMATION,
                    subject: 'Receipt: {{planName}} is now active!',
                    customHeadline: 'Welcome to Esparex Pro',
                    updatedAt: '2026-09-28T03:00:00.000Z',
                    updatedBy: 'admin-1',
                },
            ];

            const templates = emailTemplateCatalogService.getAllTemplates(customizations);
            const purchaseTemplate = templates.find((t) => t.key === EMAIL_TEMPLATE_KEY.PURCHASE_CONFIRMATION);

            expect(purchaseTemplate).toBeDefined();
            expect(purchaseTemplate?.isCustomized).toBe(true);
            expect(purchaseTemplate?.subject).toBe('Receipt: {{planName}} is now active!');
            expect(purchaseTemplate?.customSubject).toBe('Receipt: {{planName}} is now active!');
            expect(purchaseTemplate?.customHeadline).toBe('Welcome to Esparex Pro');
            expect(purchaseTemplate?.updatedBy).toBe('admin-1');

            // Non-customized template should keep defaults
            const invoiceTemplate = templates.find((t) => t.key === EMAIL_TEMPLATE_KEY.INVOICE_DELIVERY);
            expect(invoiceTemplate?.isCustomized).toBe(false);
            expect(invoiceTemplate?.subject).toBe(invoiceTemplate?.defaultSubject);
        });
    });

    describe('getTemplateByKey', () => {
        it('returns single template DTO with metadata and variable dictionary', () => {
            const template = emailTemplateCatalogService.getTemplateByKey(EMAIL_TEMPLATE_KEY.BUSINESS_APPROVED);
            expect(template).toBeDefined();
            expect(template?.name).toBe('Business Storefront Approved');
            expect(template?.trigger).toContain('Admin verifies business KYC');
            expect(template?.variables.length).toBeGreaterThan(0);
            expect(template?.variables.map((v) => v.name)).toContain('businessName');
        });

        it('returns undefined for non-existent key', () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const template = emailTemplateCatalogService.getTemplateByKey('NON_EXISTENT' as any);
            expect(template).toBeUndefined();
        });
    });

    describe('generatePreview', () => {
        it('renders live HTML preview for every registered template', () => {
            const templates = emailTemplateCatalogService.getAllTemplates();
            for (const t of templates) {
                const preview = emailTemplateCatalogService.generatePreview(t.key);
                expect(preview.key).toBe(t.key);
                expect(preview.subject).toBeTruthy();
                expect(preview.html).toContain('<!DOCTYPE html>');
                expect(preview.html).toContain('Esparex');
            }
        });

        it('interpolates sample variables into preview subject', () => {
            const preview = emailTemplateCatalogService.generatePreview(EMAIL_TEMPLATE_KEY.PURCHASE_CONFIRMATION);
            // Default subject is "Payment Confirmation — {{planName}}"
            expect(preview.subject).toContain('Featured Dealer Pro');
            expect(preview.subject).not.toContain('{{planName}}');
        });

        it('throws an error when previewing an unregistered key', () => {
            expect(() => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                emailTemplateCatalogService.generatePreview('INVALID_KEY' as any);
            }).toThrow('not registered in catalog');
        });
    });

    describe('resolveSubject', () => {
        it('interpolates dictionary values into subject line', () => {
            const result = EmailTemplateCatalogService.interpolateVariables(
                'Order {{orderId}} confirmed for {{userName}}',
                { orderId: 'ORD-101', userName: 'Aarav Patel' }
            );
            expect(result).toBe('Order ORD-101 confirmed for Aarav Patel');
        });

        it('leaves untouched tokens when variable is missing', () => {
            const result = EmailTemplateCatalogService.interpolateVariables(
                'Hello {{userName}}, your plan is {{missing}}',
                { userName: 'Aarav' }
            );
            expect(result).toBe('Hello Aarav, your plan is {{missing}}');
        });

        it('uses custom subject override when available', () => {
            const customizations: EmailTemplateCustomization[] = [
                {
                    key: EMAIL_TEMPLATE_KEY.LISTING_APPROVED,
                    subject: '🎉 Congratulations {{name}}! {{title}} is now online',
                },
            ];

            const subject = emailTemplateCatalogService.resolveSubject(
                EMAIL_TEMPLATE_KEY.LISTING_APPROVED,
                'Default Subject',
                { name: 'Rohan', title: 'Brake Pads' },
                customizations
            );

            expect(subject).toBe('🎉 Congratulations Rohan! Brake Pads is now online');
        });
    });
});
