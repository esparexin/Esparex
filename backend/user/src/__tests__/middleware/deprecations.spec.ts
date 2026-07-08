import express from 'express';
import inject from 'light-my-request';

jest.mock('@esparex/core/utils', () => ({
    logger: { warn: jest.fn(), info: jest.fn() },
}));

import { registerDeprecationRoutes, deprecateMethod } from '../../middleware/deprecations';

describe('registerDeprecationRoutes', () => {
    it('returns 308 for legacy admin API path', async () => {
        const app = express();
        registerDeprecationRoutes(app);

        const res = await inject(app, { method: 'GET', url: '/api/admin/dashboard' });
        expect(res.statusCode).toBe(308);
    });

    it('returns 410 for legacy /api/v1/ads endpoint', async () => {
        const app = express();
        registerDeprecationRoutes(app);

        const res = await inject(app, { method: 'GET', url: '/api/v1/ads' });
        expect(res.statusCode).toBe(410);
        const body = res.json();
        expect(body.success).toBe(false);
        expect(body.code).toBe('ENDPOINT_DEPRECATED');
        expect(body.replacement).toBe('/api/v1/listings');
    });

    it('returns 410 for legacy /api/v1/services endpoint', async () => {
        const app = express();
        registerDeprecationRoutes(app);

        const res = await inject(app, { method: 'GET', url: '/api/v1/services' });
        expect(res.statusCode).toBe(410);
    });

    it('returns 410 for legacy /api/v1/spare-part-listings endpoint', async () => {
        const app = express();
        registerDeprecationRoutes(app);

        const res = await inject(app, { method: 'GET', url: '/api/v1/spare-part-listings' });
        expect(res.statusCode).toBe(410);
    });

    it('returns 308 for legacy /api/v1/contact to /api/v1/contacts redirect', async () => {
        const app = express();
        registerDeprecationRoutes(app);

        const res = await inject(app, { method: 'GET', url: '/api/v1/contact/form' });
        expect(res.statusCode).toBe(308);
    });

    it('includes deprecation headers on 410 responses', async () => {
        const app = express();
        registerDeprecationRoutes(app);

        const res = await inject(app, { method: 'GET', url: '/api/v1/ads' });
        expect(res.headers['deprecation']).toBe('true');
        expect(res.headers['sunset']).toBeDefined();
    });
});

describe('deprecateMethod', () => {
    it('sets deprecation headers and calls next', async () => {
        const app = express();
        const middleware = deprecateMethod('PATCH');
        app.get('/test', middleware, (_req, res) => res.json({ success: true }));

        const res = await inject(app, { method: 'GET', url: '/test' });
        expect(res.headers['deprecation']).toBe('true');
        expect(res.headers['x-deprecated-method']).toBe('GET');
        expect(res.headers['x-successor-method']).toBe('PATCH');
        expect(res.json()).toEqual({ success: true });
    });
});
