import express from 'express';
import inject from 'light-my-request';

jest.mock('../../middleware/adminAuth', () => ({
    requireAdmin: (req: express.Request, _res: express.Response, next: express.NextFunction) => {
        req.admin = { _id: '65fa29c9d2c1f2e165fa29cb' } as never;
        next();
    },
    requirePermission: () => (req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
}));

jest.mock('../../middleware/rateLimiter', () => ({
    mutationLimiter: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
    searchLimiter: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
    adminLimiter: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
    adminMutationLimiter: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
}));

jest.mock('../../controllers/catalog', () => ({
    getCategories: (_req: express.Request, res: express.Response) => res.status(200).json({ ok: true }),
    getCategoryCounts: (_req: express.Request, res: express.Response) => res.status(200).json({ ok: true }),
    getCategoryById: (_req: express.Request, res: express.Response) => res.status(200).json({ ok: true }),
    getCategorySchema: (_req: express.Request, res: express.Response) => res.status(200).json({ ok: true }),
    getBrands: (_req: express.Request, res: express.Response) => res.status(200).json({ ok: true }),
    getBrandBySlug: (_req: express.Request, res: express.Response) => res.status(200).json({ ok: true }),
    getBrandById: (_req: express.Request, res: express.Response) => res.status(200).json({ ok: true }),
    getModels: (_req: express.Request, res: express.Response) => res.status(200).json({ ok: true }),
    getModelBySlug: (_req: express.Request, res: express.Response) => res.status(200).json({ ok: true }),
    getModelById: (_req: express.Request, res: express.Response) => res.status(200).json({ ok: true }),
    getSpareParts: (_req: express.Request, res: express.Response) => res.status(200).json({ ok: true }),
    getSparePartById: (_req: express.Request, res: express.Response) => res.status(200).json({ ok: true }),
    getServiceTypes: (_req: express.Request, res: express.Response) => res.status(200).json({ ok: true }),
    getServiceTypeById: (_req: express.Request, res: express.Response) => res.status(200).json({ ok: true }),
    getScreenSizes: (_req: express.Request, res: express.Response) => res.status(200).json({ ok: true }),
    getScreenSizeById: (_req: express.Request, res: express.Response) => res.status(200).json({ ok: true }),
}));

jest.mock('../../controllers/admin/catalog', () => {
    const handler = (_req: express.Request, res: express.Response) => {
        res.status(200).json({ ok: true });
    };
    return {
        getCategories: handler,
        getCategoryCounts: handler,
        getCategoryById: handler,
        createCategory: handler,
        updateCategory: handler,
        deleteCategory: handler,
        getCategorySchema: handler,
        updateCategorySchema: handler,
        toggleCategoryStatus: handler,
        getBrands: handler,
        getBrandById: handler,
        createBrand: handler,
        updateBrand: handler,
        toggleBrandStatus: handler,
        deleteBrand: handler,
        approveBrand: handler,
        rejectBrand: handler,
        getModels: handler,
        getModelById: handler,
        createModel: handler,
        updateModel: handler,
        toggleModelStatus: handler,
        deleteModel: handler,
        approveModel: handler,
        rejectModel: handler,
        getSpareParts: handler,
        getSparePartById: handler,
        createSparePart: handler,
        updateSparePart: handler,
        toggleSparePartStatus: handler,
        deleteSparePart: handler,
        getServiceTypes: handler,
        getServiceTypeById: handler,
        createServiceType: handler,
        updateServiceType: handler,
        toggleServiceTypeStatus: handler,
        deleteServiceType: handler,
        getScreenSizes: handler,
        getScreenSizeById: handler,
        createScreenSize: handler,
        updateScreenSize: handler,
        toggleScreenSizeStatus: handler,
        deleteScreenSize: handler,
    };
});

import catalogRoutes from '../../routes/catalogRoutes';
import adminCatalogRoutes from '../../routes/adminCatalogRoutes';

const buildApp = () => {
    const app = express();
    app.use(express.json());
    app.use('/api/v1/catalog', catalogRoutes);
    app.use('/api/v1/admin/catalog', adminCatalogRoutes);
    return app;
};

describe('legacy catalog endpoint deprecations', () => {
    const app = buildApp();

    it('returns 404 for removed legacy user suggest/ensure endpoints', async () => {
        const [ensureResponse, brandSuggestResponse, modelSuggestResponse] = await Promise.all([
            inject(app, { method: 'POST', url: '/api/v1/catalog/models/ensure', payload: { name: 'X' } }),
            inject(app, { method: 'POST', url: '/api/v1/catalog/brands/suggest', payload: { name: 'Y' } }),
            inject(app, { method: 'POST', url: '/api/v1/catalog/models/suggest', payload: { name: 'Z' } }),
        ]);

        [ensureResponse, brandSuggestResponse, modelSuggestResponse].forEach((response) => {
            expect(response.statusCode).toBe(404);
        });
    });

    it('returns 404 for removed legacy admin ensure endpoint', async () => {
        const response = await inject(app, {
            method: 'POST',
            url: '/api/v1/admin/catalog/models/ensure',
            payload: { name: 'Legacy' },
        });

        expect(response.statusCode).toBe(404);
    });
});
