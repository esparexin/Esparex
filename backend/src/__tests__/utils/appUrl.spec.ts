import { getAdminAppUrl, getFrontendAppUrl, getFrontendInternalUrl } from '../../utils/appUrl';

describe('appUrl helpers', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        process.env = { ...originalEnv };
        delete process.env.FRONTEND_URL;
        delete process.env.FRONTEND_INTERNAL_URL;
        delete process.env.ADMIN_URL;
        delete process.env.ADMIN_FRONTEND_URL;
    });

    afterAll(() => {
        process.env = originalEnv;
    });

    it('uses local defaults outside production', () => {
        process.env.NODE_ENV = 'development';

        expect(getFrontendAppUrl()).toBe('http://localhost:3000');
        expect(getFrontendInternalUrl()).toBe('http://localhost:3000');
        expect(getAdminAppUrl()).toBe('http://localhost:3001');
    });

    it('uses production-safe Esparex.in defaults when env vars are missing in production', () => {
        process.env.NODE_ENV = 'production';

        expect(getFrontendAppUrl()).toBe('https://esparex.in');
        expect(getFrontendInternalUrl()).toBe('https://esparex.in');
        expect(getAdminAppUrl()).toBe('https://admin.esparex.in');
    });

    it('prefers configured runtime URLs when provided', () => {
        process.env.NODE_ENV = 'production';
        process.env.FRONTEND_URL = 'https://exparex.in/';
        process.env.FRONTEND_INTERNAL_URL = 'https://frontend.internal.exparex.in/';
        process.env.ADMIN_FRONTEND_URL = 'https://admin.exparex.in/';

        expect(getFrontendAppUrl()).toBe('https://exparex.in');
        expect(getFrontendInternalUrl()).toBe('https://frontend.internal.exparex.in');
        expect(getAdminAppUrl()).toBe('https://admin.exparex.in');
    });
});
