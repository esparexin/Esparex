import type { Request, Response, NextFunction } from 'express';

/**
 * 🍪 Lightweight, RFC 6265-compliant Cookie Parser Middleware
 *
 * Parses incoming `Cookie` request headers into `req.cookies`.
 * Provides safe, zero-dependency cookie parsing without triggering
 * false-positive static analysis alerts for unmaintained third-party packages.
 */
export const cookieParser = (req: Request, _res: Response, next: NextFunction): void => {
    const header = req.headers.cookie;
    if (!header || typeof header !== 'string') {
        req.cookies = req.cookies || {};
        return next();
    }

    const cookies: Record<string, string> = {};
    const pairs = header.split(';');

    for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i].trim();
        if (!pair) continue;

        const eqIdx = pair.indexOf('=');
        if (eqIdx === -1) {
            cookies[pair] = '';
            continue;
        }

        const key = pair.substring(0, eqIdx).trim();
        let val = pair.substring(eqIdx + 1).trim();

        // Handle quoted cookie values per RFC 6265 section 4.1.1
        if (val.length >= 2 && val.charCodeAt(0) === 0x22 && val.charCodeAt(val.length - 1) === 0x22) {
            val = val.slice(1, -1);
        }

        try {
            cookies[key] = decodeURIComponent(val);
        } catch {
            cookies[key] = val;
        }
    }

    req.cookies = cookies;
    next();
};

export default cookieParser;
