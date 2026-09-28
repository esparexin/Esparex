import {
    DEFAULT_STATIC_ALLOWED_ORIGINS,
    getAllowedOriginList,
    inferCookieDomainFromEnv,
    isAllowedOrigin,
    requiresSharedCookieDomain,
} from '@esparex/core/utils/originConfig';

describe('originConfig', () => {
    it('infers the shared cookie domain from split-subdomain first-party origins', () => {
        expect(
            inferCookieDomainFromEnv({
                NODE_ENV: 'production',
                CORS_ORIGIN: 'https://exparex.in,https://admin.exparex.in',
                FRONTEND_URL: 'https://exparex.in',
                ADMIN_FRONTEND_URL: 'https://admin.exparex.in',
            })
        ).toBe('exparex.in');
    });

    it('flags split first-party origins that require a shared cookie domain', () => {
        expect(
            requiresSharedCookieDomain({
                NODE_ENV: 'production',
                FRONTEND_URL: 'https://exparex.in',
                ADMIN_FRONTEND_URL: 'https://admin.exparex.in',
            })
        ).toBe(true);
    });

    it('builds the same first-party origin list for REST and sockets', () => {
        expect(
            getAllowedOriginList({
                NODE_ENV: 'production',
                CORS_ORIGIN: 'https://exparex.in',
                FRONTEND_URL: 'https://exparex.in',
                ADMIN_FRONTEND_URL: 'https://admin.exparex.in',
            })
        ).toEqual(
            expect.arrayContaining([
                'https://exparex.in',
                'https://admin.exparex.in',
            ])
        );
    });

    describe('DEFAULT_STATIC_ALLOWED_ORIGINS and isAllowedOrigin', () => {
        it('includes the test and admin test subdomains in static allowed origins', () => {
            expect(DEFAULT_STATIC_ALLOWED_ORIGINS).toEqual(
                expect.arrayContaining([
                    'https://admintest.esparex.in',
                    'https://test.esparex.in',
                    'admintest.esparex.in',
                    'test.esparex.in',
                ])
            );
        });

        it('allows requests from test subdomains in production', () => {
            expect(isAllowedOrigin('https://admintest.esparex.in', DEFAULT_STATIC_ALLOWED_ORIGINS, 'production')).toBe(true);
            expect(isAllowedOrigin('https://test.esparex.in', DEFAULT_STATIC_ALLOWED_ORIGINS, 'production')).toBe(true);
            expect(isAllowedOrigin('admintest.esparex.in', DEFAULT_STATIC_ALLOWED_ORIGINS, 'production')).toBe(true);
            expect(isAllowedOrigin('test.esparex.in', DEFAULT_STATIC_ALLOWED_ORIGINS, 'production')).toBe(true);
            expect(isAllowedOrigin('http://admintest.esparex.in', DEFAULT_STATIC_ALLOWED_ORIGINS, 'production')).toBe(true);
            expect(isAllowedOrigin('http://test.esparex.in', DEFAULT_STATIC_ALLOWED_ORIGINS, 'production')).toBe(true);
        });

        it('allows Vercel preview domains', () => {
            expect(isAllowedOrigin('https://my-preview-branch.vercel.app', DEFAULT_STATIC_ALLOWED_ORIGINS, 'production')).toBe(true);
        });

        it('allows empty/undefined origin (e.g. server-to-server or curl)', () => {
            expect(isAllowedOrigin(undefined, DEFAULT_STATIC_ALLOWED_ORIGINS, 'production')).toBe(true);
            expect(isAllowedOrigin('', DEFAULT_STATIC_ALLOWED_ORIGINS, 'production')).toBe(true);
        });

        it('blocks unauthorized external domains', () => {
            expect(isAllowedOrigin('https://malicious-attacker.com', DEFAULT_STATIC_ALLOWED_ORIGINS, 'production')).toBe(false);
            expect(isAllowedOrigin('https://not-esparex.in', DEFAULT_STATIC_ALLOWED_ORIGINS, 'production')).toBe(false);
        });

        it('allows local dev hosts only in development and test environments', () => {
            expect(isAllowedOrigin('http://localhost:3000', DEFAULT_STATIC_ALLOWED_ORIGINS, 'development')).toBe(true);
            expect(isAllowedOrigin('http://localhost:5173', DEFAULT_STATIC_ALLOWED_ORIGINS, 'test')).toBe(true);
            expect(isAllowedOrigin('http://localhost:3000', DEFAULT_STATIC_ALLOWED_ORIGINS, 'production')).toBe(false);
        });
    });
});
