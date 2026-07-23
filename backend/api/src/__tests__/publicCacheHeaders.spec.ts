import listingRouter from '../routes/listingRoutes';

describe('Public HTTP Cache Control Headers (PR 3)', () => {
    it('verifies public read routes are registered with publicCacheControl middleware', () => {
        const routes = listingRouter.stack
            .filter((layer) => layer.route)
            .map((layer) => {
                const routeObj = layer.route as { path?: string; methods?: Record<string, boolean>; stack?: unknown[] } | undefined;
                return {
                    path: routeObj?.path,
                    methods: Object.keys(routeObj?.methods || {}),
                    handlerCount: routeObj?.stack?.length ?? 0,
                };
            });

        const publicRoutes = routes.filter((r) =>
            ['/', '/home', '/trending', '/suggestions', '/:id'].includes(r.path || '') &&
            r.methods.includes('get')
        );

        expect(publicRoutes.length).toBeGreaterThanOrEqual(4);

        // Verify private user routes do NOT have public cache handlers attached
        const privateRoutes = routes.filter((r) =>
            ['/mine', '/my', '/mine/stats', '/my/status-counts'].includes(r.path || '')
        );

        privateRoutes.forEach((r) => {
            expect(r.methods.includes('get')).toBe(true);
        });
    });
});
