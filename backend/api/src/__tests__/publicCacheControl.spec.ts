import { publicCacheControl } from '../middleware/publicCacheControl';
import { Request, Response, NextFunction } from 'express';

describe('publicCacheControl Middleware', () => {
    it('sets public Cache-Control headers for GET requests with default max-age (300, 3600)', () => {
        const req = { method: 'GET' } as Request;
        const setHeaderSpy = jest.fn();
        const res = { setHeader: setHeaderSpy } as any;
        const next = jest.fn() as NextFunction;

        const middleware = publicCacheControl();
        middleware(req, res, next);

        expect(setHeaderSpy).toHaveBeenCalledWith(
            'Cache-Control',
            'public, max-age=300, stale-while-revalidate=3600'
        );
        expect(next).toHaveBeenCalledTimes(1);
    });

    it('customizes maxAge and staleWhileRevalidate parameters', () => {
        const req = { method: 'GET' } as Request;
        const setHeaderSpy = jest.fn();
        const res = { setHeader: setHeaderSpy } as any;
        const next = jest.fn() as NextFunction;

        const middleware = publicCacheControl(600, 7200);
        middleware(req, res, next);

        expect(setHeaderSpy).toHaveBeenCalledWith(
            'Cache-Control',
            'public, max-age=600, stale-while-revalidate=7200'
        );
        expect(next).toHaveBeenCalledTimes(1);
    });

    it('does not apply Cache-Control headers for non-GET requests', () => {
        const req = { method: 'POST' } as Request;
        const setHeaderSpy = jest.fn();
        const res = { setHeader: setHeaderSpy } as any;
        const next = jest.fn() as NextFunction;

        const middleware = publicCacheControl();
        middleware(req, res, next);

        expect(setHeaderSpy).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledTimes(1);
    });
});

describe('privateNoCacheControl Middleware', () => {
    it('sets strict private no-store headers to prevent caching of user-sensitive data', () => {
        const req = { method: 'GET' } as Request;
        const setHeaderSpy = jest.fn();
        const res = { setHeader: setHeaderSpy } as any;
        const next = jest.fn() as NextFunction;

        const { privateNoCacheControl } = require('../middleware/publicCacheControl');
        const middleware = privateNoCacheControl();
        middleware(req, res, next);

        expect(setHeaderSpy).toHaveBeenCalledWith(
            'Cache-Control',
            'private, no-store, no-cache, must-revalidate, max-age=0'
        );
        expect(setHeaderSpy).toHaveBeenCalledWith('Pragma', 'no-cache');
        expect(setHeaderSpy).toHaveBeenCalledWith('Expires', '0');
        expect(next).toHaveBeenCalledTimes(1);
    });
});

