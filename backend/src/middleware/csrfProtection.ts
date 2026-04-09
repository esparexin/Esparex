// backend/src/middleware/csrfProtection.ts
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import logger from '../utils/logger';
import { sendErrorResponse } from '../utils/errorResponse';

/**
 * 🛡️ CSRF Protection Middleware
 * 
 * Implements Double Submit Cookie pattern for CSRF protection.
 * This is a modern, stateless alternative to the deprecated csurf package.
 * 
 * How it works:
 * 1. Server generates a random token and sends it in both:
 *    - HTTP-only cookie (csrfToken)
 *    - Response body (for client to include in requests)
 * 2. Client includes token in custom header (X-CSRF-Token) for state-changing requests
 * 3. Server validates that cookie value matches header value
 * 
 * @see https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
 */

const CSRF_COOKIE_NAME = 'esparex_csrf';
const CSRF_HEADER_NAME = 'x-csrf-token';
const TOKEN_LENGTH = 32;

/**
 * Generate a cryptographically secure random token
 */
export function generateCsrfToken(): string {
    return crypto.randomBytes(TOKEN_LENGTH).toString('hex');
}

/**
 * Middleware to generate and set CSRF token
 * Use this on GET requests to provide token to client
 */
export function setCsrfToken(req: Request, res: Response, next: NextFunction) {
    // Skip if token already exists
    if (req.cookies[CSRF_COOKIE_NAME]) {
        return next();
    }

    const token = generateCsrfToken();

    // Set HTTP-only cookie
    res.cookie(CSRF_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    // Attach to response locals for easy access
    res.locals.csrfToken = token;

    next();
}

/**
 * Middleware to verify CSRF token
 * Use this on POST/PUT/PATCH/DELETE requests
 */
export function verifyCsrfToken(req: Request, res: Response, next: NextFunction) {
    // Skip for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    // Skip for webhook endpoints (they use HMAC verification)
    if (req.path.includes('/webhook')) {
        return next();
    }

    // Skip in test and development environments
    if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
        return next();
    }

    const cookieToken = req.cookies[CSRF_COOKIE_NAME];
    const headerToken = req.headers[CSRF_HEADER_NAME] as string;

    // Check if both tokens exist
    if (!cookieToken || !headerToken) {
        logger.warn('CSRF token missing', {
            path: req.path,
            method: req.method,
            ip: req.ip,
            hasCookie: !!cookieToken,
            hasHeader: !!headerToken
        });

        return sendErrorResponse(req, res, 403, 'CSRF token missing', {
            code: 'CSRF_TOKEN_MISSING',
            message: 'Invalid or missing CSRF token. Please refresh the page and try again.'
        });
    }

    // Constant-time comparison to prevent timing attacks
    const cookieBuffer = Buffer.from(cookieToken);
    const headerBuffer = Buffer.from(headerToken);

    if (cookieBuffer.length !== headerBuffer.length) {
        logger.warn('CSRF token length mismatch', {
            path: req.path,
            method: req.method,
            ip: req.ip
        });

        return sendErrorResponse(req, res, 403, 'CSRF token invalid', {
            code: 'CSRF_TOKEN_INVALID',
            message: 'Invalid CSRF token. Please refresh the page and try again.'
        });
    }

    // Use crypto.timingSafeEqual for constant-time comparison
    if (!crypto.timingSafeEqual(cookieBuffer, headerBuffer)) {
        logger.warn('CSRF token mismatch', {
            path: req.path,
            method: req.method,
            ip: req.ip
        });

        return sendErrorResponse(req, res, 403, 'CSRF token invalid', {
            code: 'CSRF_TOKEN_INVALID',
            message: 'Invalid CSRF token. Please refresh the page and try again.'
        });
    }

    // Token is valid
    next();
}

/**
 * Endpoint to get CSRF token
 * Client can call this to get a fresh token
 */
export function getCsrfToken(req: Request, res: Response) {
    // Prefer token generated earlier in this request (setCsrfToken middleware),
    // then fall back to existing cookie, else create one.
    const localToken = typeof res.locals.csrfToken === 'string' ? res.locals.csrfToken : undefined;
    const cookieToken = req.cookies[CSRF_COOKIE_NAME];
    const token = localToken || cookieToken || generateCsrfToken();

    // Only set cookie here if it wasn't already set by setCsrfToken middleware
    // and no CSRF cookie exists in the incoming request.
    if (!localToken && !cookieToken) {
        res.cookie(CSRF_COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000
        });
    }

    res.json({
        success: true,
        csrfToken: token
    });
}
