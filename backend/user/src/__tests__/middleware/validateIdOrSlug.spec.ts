import express from 'express';
import inject from 'light-my-request';

jest.mock('@esparex/core/utils', () => ({
    sendErrorResponse: jest.fn((_req, res, status, _error, opts) => {
        res.status(status).json({
            success: false,
            error: opts?.details?.message || _error,
            status,
        });
    }),
}));

import { validateIdOrSlug } from '../../middleware/validateIdOrSlug';

describe('validateIdOrSlug', () => {
    const buildApp = (paramName = 'id') => {
        const app = express();
        const router = express.Router();
        router.get(`/:${paramName}`, validateIdOrSlug(paramName), (req, res) => {
            res.json({ success: true, value: req.params[paramName] });
        });
        app.use('/test', router);
        return app;
    };

    it('passes valid 24-char ObjectId', async () => {
        const app = buildApp();
        const res = await inject(app, { method: 'GET', url: '/test/507f1f77bcf86cd799439011' });
        expect(res.statusCode).toBe(200);
        expect(res.json().value).toBe('507f1f77bcf86cd799439011');
    });

    it('passes valid kebab-case slug', async () => {
        const app = buildApp();
        const res = await inject(app, { method: 'GET', url: '/test/iphone-15-pro' });
        expect(res.statusCode).toBe(200);
        expect(res.json().value).toBe('iphone-15-pro');
    });

    it('passes valid slug with underscore', async () => {
        const app = buildApp();
        const res = await inject(app, { method: 'GET', url: '/test/samsung_galaxy' });
        expect(res.statusCode).toBe(200);
    });

    it('returns 400 for parameter exceeding 200 chars', async () => {
        const app = buildApp();
        const long = 'a'.repeat(201);
        const res = await inject(app, { method: 'GET', url: `/test/${long}` });
        expect(res.statusCode).toBe(400);
    });

    it('returns 400 for single character parameter', async () => {
        const app = buildApp();
        const res = await inject(app, { method: 'GET', url: '/test/a' });
        expect(res.statusCode).toBe(400);
    });

    it('respects custom parameter name', async () => {
        const app = buildApp('slug');
        const res = await inject(app, { method: 'GET', url: '/test/samsung-galaxy' });
        expect(res.statusCode).toBe(200);
        expect(res.json().value).toBe('samsung-galaxy');
    });

    it('passes "all" keyword', async () => {
        const app = buildApp();
        const res = await inject(app, { method: 'GET', url: '/test/all' });
        expect(res.statusCode).toBe(200);
        expect(res.json().value).toBe('all');
    });
});
