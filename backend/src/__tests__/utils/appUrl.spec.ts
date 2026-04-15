describe('appUrl helpers', () => {
    const loadAppUrl = (envOverrides: {
        NODE_ENV?: 'development' | 'production' | 'test';
        FRONTEND_URL?: string;
        FRONTEND_INTERNAL_URL?: string;
        ADMIN_URL?: string;
        ADMIN_FRONTEND_URL?: string;
    } = {}) => {
        jest.resetModules();

        const mockLogger = {
            warn: jest.fn(),
            info: jest.fn(),
            error: jest.fn(),
        };

        jest.doMock('../../utils/logger', () => ({
            __esModule: true,
            default: mockLogger,
        }));

        jest.doMock('../../config/env', () => ({
            __esModule: true,
            env: {
                NODE_ENV: envOverrides.NODE_ENV ?? 'development',
                FRONTEND_URL: envOverrides.FRONTEND_URL,
                FRONTEND_INTERNAL_URL: envOverrides.FRONTEND_INTERNAL_URL,
                ADMIN_URL: envOverrides.ADMIN_URL,
                ADMIN_FRONTEND_URL: envOverrides.ADMIN_FRONTEND_URL,
            },
        }));

        // eslint-disable-next-line @typescript-eslint/no-require-imports -- resetModules requires a fresh module load.
        const appUrl = require('../../utils/appUrl') as typeof import('../../utils/appUrl');

        return {
            ...appUrl,
            mockLogger,
        };
    };

    afterEach(() => {
        jest.clearAllMocks();
        jest.resetModules();
    });

    it('uses local defaults outside production', () => {
        const { getFrontendAppUrl, getFrontendInternalUrl, getAdminAppUrl } = loadAppUrl({
            NODE_ENV: 'development',
        });

        expect(getFrontendAppUrl()).toBe('http://localhost:3000');
        expect(getFrontendInternalUrl()).toBe('http://localhost:3000');
        expect(getAdminAppUrl()).toBe('http://localhost:3001');
    });

    it('uses production-safe Esparex.in defaults when env vars are missing in production', () => {
        const { getFrontendAppUrl, getFrontendInternalUrl, getAdminAppUrl } = loadAppUrl({
            NODE_ENV: 'production',
        });

        expect(getFrontendAppUrl()).toBe('https://esparex.in');
        expect(getFrontendInternalUrl()).toBe('https://esparex.in');
        expect(getAdminAppUrl()).toBe('https://admin.esparex.in');
    });

    it('prefers configured runtime URLs when provided', () => {
        const { getFrontendAppUrl, getFrontendInternalUrl, getAdminAppUrl } = loadAppUrl({
            NODE_ENV: 'production',
            FRONTEND_URL: 'https://exparex.in/',
            FRONTEND_INTERNAL_URL: 'https://frontend.internal.exparex.in/',
            ADMIN_FRONTEND_URL: 'https://admin.exparex.in/',
        });

        expect(getFrontendAppUrl()).toBe('https://exparex.in');
        expect(getFrontendInternalUrl()).toBe('https://frontend.internal.exparex.in');
        expect(getAdminAppUrl()).toBe('https://admin.exparex.in');
    });
});
