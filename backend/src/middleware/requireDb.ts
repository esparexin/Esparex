import { Request, Response, NextFunction } from "express";
import { isDbReady } from "../config/db";
import logger from '../utils/logger';
import { sendErrorResponse } from '../utils/errorResponse';

/**
 * 🛡️ DATABASE READINESS GUARD (FAIL-FAST)
 * ------------------------------------------------
 * Purpose:
 * - Prevent requests from entering controllers
 *   when MongoDB is disconnected.
 * - Avoids Mongoose buffering → UI hangs.
 *
 * RULES:
 * - NO database queries here
 * - NO async/await
 * - MUST be route-scoped (never global)
 * - MUST NOT block OPTIONS (CORS preflight)
 *
 * NEVER APPLY TO:
 * - /health
 * - /auth/send-otp
 * - /auth/verify-otp
 * - webhooks
 */
export function requireDb(
    req: Request,
    res: Response,
    next: NextFunction
) {
    // ✅ CRITICAL: Allow CORS preflight to pass
    if (req.method === "OPTIONS") {
        return next();
    }

    // ✅ Fail fast if DB is not ready
    if (!isDbReady()) {
        const isUrlAdmin = req.originalUrl.includes('/admin');
        const dbType = isUrlAdmin ? 'Admin DB' : 'User DB';

        logger.warn(
            `🚨 [DB-GUARD] ${dbType} unavailable or connection lost → ${req.method} ${req.originalUrl}`
        );

        return sendErrorResponse(req, res, 503, 'Database unavailable', {
            code: "DATABASE_UNAVAILABLE",
            details: {
                message:
                    "Service temporarily unavailable due to database connectivity issues. Please try again shortly.",
                level: "CRITICAL",
                service: "MongoDB",
                context: dbType
            },
        });
    }

    // ✅ DB is ready → continue
    return next();
}
