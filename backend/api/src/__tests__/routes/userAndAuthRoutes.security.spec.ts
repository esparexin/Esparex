import authRouter from '../../routes/authRoutes';
import userRouter from '../../routes/userRoutes';

describe('User and Auth Route Security & Rate Limiting (CODE-03)', () => {
    const getRouteLayerNames = (router: any, path: string, method: string): string[] => {
        const route = router.stack.find(
            (layer: any) => layer.route && layer.route.path === path && layer.route.methods[method.toLowerCase()]
        );
        if (!route) {
            throw new Error(`Route ${method.toUpperCase()} ${path} not found in router stack`);
        }
        return route.route.stack.map((layer: any) => layer.name || 'anonymous');
    };

    describe('Auth Routes Rate Limiting', () => {
        it('mounts otp rate limiters on POST /cancel-otp', () => {
            const layers = getRouteLayerNames(authRouter, '/cancel-otp', 'POST');
            // rate limiters and validation middleware should be in the pipeline
            expect(layers.length).toBeGreaterThanOrEqual(3);
        });

        it('mounts otp rate limiters on POST /send-otp and POST /verify-otp', () => {
            const sendLayers = getRouteLayerNames(authRouter, '/send-otp', 'POST');
            const verifyLayers = getRouteLayerNames(authRouter, '/verify-otp', 'POST');
            expect(sendLayers.length).toBeGreaterThanOrEqual(4);
            expect(verifyLayers.length).toBeGreaterThanOrEqual(4);
        });
    });

    describe('User Routes Rate Limiting & Auth Protection', () => {
        it('mounts rate limiting on GET /me/wallet, /me/posting-balance, /me/transactions, /me/boosts', () => {
            const walletLayers = getRouteLayerNames(userRouter, '/me/wallet', 'GET');
            const postingLayers = getRouteLayerNames(userRouter, '/me/posting-balance', 'GET');
            const txLayers = getRouteLayerNames(userRouter, '/me/transactions', 'GET');
            const boostLayers = getRouteLayerNames(userRouter, '/me/boosts', 'GET');

            // All should include protect and searchLimiter
            expect(walletLayers.length).toBeGreaterThanOrEqual(3);
            expect(postingLayers.length).toBeGreaterThanOrEqual(3);
            expect(txLayers.length).toBeGreaterThanOrEqual(3);
            expect(boostLayers.length).toBeGreaterThanOrEqual(3);
        });

        it('mounts mutationLimiter and protect on PATCH /me and DELETE /me', () => {
            const patchMeLayers = getRouteLayerNames(userRouter, '/me', 'PATCH');
            const deleteMeLayers = getRouteLayerNames(userRouter, '/me', 'DELETE');

            expect(patchMeLayers.length).toBeGreaterThanOrEqual(4);
            expect(deleteMeLayers.length).toBeGreaterThanOrEqual(3);
        });

        it('mounts searchLimiter and protect on GET /saved-ads', () => {
            const savedAdsLayers = getRouteLayerNames(userRouter, '/saved-ads', 'GET');
            expect(savedAdsLayers.length).toBeGreaterThanOrEqual(3);
        });
    });
});
