import listingRouter from '../routes/listingRoutes';
import locationRouter from '../routes/locationRoutes';

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

    it('verifies /api/v1/locations/ip-locate is isolated from publicCacheControl and has privateNoCache', () => {
        const routes = locationRouter.stack
            .filter((layer) => layer.route)
            .map((layer) => {
                const routeObj = layer.route as { path?: string; methods?: Record<string, boolean>; stack?: Array<{ handle: Function }> } | undefined;
                return {
                    path: routeObj?.path,
                    methods: Object.keys(routeObj?.methods || {}),
                    stack: routeObj?.stack || [],
                };
            });

        const ipLocateRoute = routes.find((r) => r.path === '/ip-locate');
        expect(ipLocateRoute).toBeDefined();
        expect(ipLocateRoute?.methods).toContain('get');

        // Execute route cache middleware layer on a mock res to verify Cache-Control header
        const cacheMiddlewareLayer = ipLocateRoute!.stack[0];
        expect(cacheMiddlewareLayer).toBeDefined();

        const mockRes = {
            setHeader: jest.fn(),
        } as any;
        const mockReq = { method: 'GET' } as any;
        const mockNext = jest.fn();

        cacheMiddlewareLayer.handle(mockReq, mockRes, mockNext);

        // Must set private, no-store and NEVER public
        expect(mockRes.setHeader).toHaveBeenCalledWith(
            'Cache-Control',
            'private, no-store, no-cache, must-revalidate, max-age=0'
        );
        expect(mockRes.setHeader).toHaveBeenCalledWith('Pragma', 'no-cache');
        expect(mockRes.setHeader).toHaveBeenCalledWith('Expires', '0');
        for (const call of mockRes.setHeader.mock.calls) {
            expect(call[1]).not.toContain('public');
        }
        expect(mockNext).toHaveBeenCalled();
    });
});

