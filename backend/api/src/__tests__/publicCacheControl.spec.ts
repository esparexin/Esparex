import { describe, it, expect, vi } from 'vitest';
import { publicCacheControl } from '../middleware/publicCacheControl';
import type { Request, Response, NextFunction } from 'express';

describe('publicCacheControl middleware', () => {
    it('sets public Cache-Control header with stale-while-revalidate for GET requests', () => {
        const req = { method: 'GET' } as Request;
        const setHeaderMock = vi.fn();
        const res = { setHeader: setHeaderMock } as unknown as Response;
        const next: NextFunction = vi.fn();

        const middleware = publicCacheControl(300, 3600);
        middleware(req, res, next);

        expect(setHeaderMock).toHaveBeenCalledWith(
            'Cache-Control',
            'public, max-age=300, stale-while-revalidate=3600'
        );
        expect(next).toHaveBeenCalledTimes(1);
    });

    it('does not set Cache-Control headers for non-GET requests', () => {
        const req = { method: 'POST' } as Request;
        const setHeaderMock = vi.fn();
        const res = { setHeader: setHeaderMock } as unknown as Response;
        const next: NextFunction = vi.fn();

        const middleware = publicCacheControl(300, 3600);
        middleware(req, res, next);

        expect(setHeaderMock).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledTimes(1);
    });

    it('supports custom max-age and stale-while-revalidate values', () => {
        const req = { method: 'GET' } as Request;
        const setHeaderMock = vi.fn();
        const res = { setHeader: setHeaderMock } as unknown as Response;
        const next: NextFunction = vi.fn();

        const middleware = publicCacheControl(600, 7200);
        middleware(req, res, next);

        expect(setHeaderMock).toHaveBeenCalledWith(
            'Cache-Control',
            'public, max-age=600, stale-while-revalidate=7200'
        );
        expect(next).toHaveBeenCalledTimes(1);
    });
});
