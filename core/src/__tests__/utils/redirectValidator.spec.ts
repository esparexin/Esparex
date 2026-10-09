import { validateRedirectUrl } from '../../utils/redirectValidator';

describe('validateRedirectUrl', () => {
    it('accepts relative redirect paths', () => {
        expect(validateRedirectUrl('/dashboard')).toBe('/dashboard');
        expect(validateRedirectUrl('/account/profile')).toBe('/account/profile');
    });

    it('rejects protocol-relative redirect URLs', () => {
        expect(validateRedirectUrl('//evil.com/hack', '/fallback')).toBe('/fallback');
    });

    it('accepts allowed production and test subdomains', () => {
        expect(validateRedirectUrl('https://esparex.in/terms')).toBe('https://esparex.in/terms');
        expect(validateRedirectUrl('https://admin.esparex.in/dashboard')).toBe('https://admin.esparex.in/dashboard');
        expect(validateRedirectUrl('https://admintest.esparex.in/dashboard')).toBe('https://admintest.esparex.in/dashboard');
        expect(validateRedirectUrl('https://test.esparex.in/search')).toBe('https://test.esparex.in/search');
    });

    it('rejects unallowed external redirect domains', () => {
        expect(validateRedirectUrl('https://malicious-site.com/steal', '/')).toBe('/');
        expect(validateRedirectUrl('http://phishing.org/login', '/fallback')).toBe('/fallback');
    });

    it('falls back when given non-string or invalid input', () => {
        expect(validateRedirectUrl(null, '/safe')).toBe('/safe');
        expect(validateRedirectUrl(undefined, '/safe')).toBe('/safe');
        expect(validateRedirectUrl('not-a-valid-url-or-path', '/safe')).toBe('/safe');
    });
});
