import {
    getAllowedOriginList,
    inferCookieDomainFromEnv,
    requiresSharedCookieDomain,
} from '../../utils/originConfig';

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
});
