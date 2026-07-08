import { describe, it, expect } from 'vitest';
import { containsInjectionPattern } from '../../utils/securityPatterns';

describe('containsInjectionPattern', () => {
    it('detects script tags', () => {
        expect(containsInjectionPattern('<script>alert(1)</script>')).toBe(true);
    });

    it('detects iframe tags', () => {
        expect(containsInjectionPattern('<iframe src="evil.com"></iframe>')).toBe(true);
    });

    it('detects javascript: URLs', () => {
        expect(containsInjectionPattern('javascript:alert(1)')).toBe(true);
    });

    it('detects onerror handlers', () => {
        expect(containsInjectionPattern('<img src=x onerror=alert(1)>')).toBe(true);
    });

    it('detects SQL SELECT', () => {
        expect(containsInjectionPattern("SELECT * FROM users")).toBe(true);
    });

    it('detects SQL DROP', () => {
        expect(containsInjectionPattern("DROP TABLE users")).toBe(true);
    });

    it('allows safe text', () => {
        expect(containsInjectionPattern('Hello, this is a safe message')).toBe(false);
    });

    it('allows numbers and special chars', () => {
        expect(containsInjectionPattern('Contact me at 555-1234')).toBe(false);
    });
});
