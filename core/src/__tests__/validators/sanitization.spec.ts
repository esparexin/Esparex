import { sanitizeString } from '../../validators/common';
import { createReportSchema } from '../../validators/report.validator';

describe('Security Input Sanitization Tests (CODE-01)', () => {
    describe('sanitizeString', () => {
        const schema = sanitizeString();

        it('strips simple HTML tags', () => {
            const result = schema.parse('<b>Bold Text</b>');
            expect(result).toBe('Bold Text');
        });

        it('strips script tags and inner content', () => {
            const result = schema.parse('<script>alert("xss")</script>Hello');
            expect(result).toBe('Hello');
        });

        it('strips nested/malformed script tags (anti-bypass)', () => {
            const result = schema.parse('<<script>script>alert(1)</script>Safe Text');
            expect(result).not.toContain('<script>');
            expect(result).not.toContain('alert(1)');
            expect(result).toContain('Safe Text');
        });

        it('strips inline event handlers', () => {
            const result = schema.parse('<img src="x" onerror="alert(1)">Image Text');
            expect(result).toBe('Image Text');
        });

        it('strips javascript: pseudo-protocol links', () => {
            const result = schema.parse('<a href="javascript:alert(1)">Click me</a>');
            expect(result).toBe('Click me');
        });

        it('preserves clean text, numbers, and legitimate punctuation', () => {
            const cleanText = 'Original Spare Parts for Hyundai i20 - Good Condition! Price: Rs. 15,000.';
            const result = schema.parse(cleanText);
            expect(result).toBe(cleanText);
        });

        it('enforces min and max length bounds after sanitization', () => {
            const boundedSchema = sanitizeString(5, 20);
            expect(() => boundedSchema.parse('<script>alert(1)</script>Hi')).toThrow();
            expect(boundedSchema.parse('Valid Title Here')).toBe('Valid Title Here');
        });
    });

    describe('createReportSchema sanitization', () => {
        it('sanitizes description against nested html injections', () => {
            const payload = {
                targetType: 'ad',
                targetId: '507f1f77bcf86cd799439011',
                reason: 'SPAM',
                description: '<p>This is a <b>spam</b> listing <<script>script>alert(1)</script></p>',
            };

            const parsed = createReportSchema.parse(payload);
            expect(parsed.description).toContain('This is a spam listing');
            expect(parsed.description).not.toContain('<script>');
            expect(parsed.description).not.toContain('alert(1)');
        });
    });
});
