import { Request, Response, NextFunction } from "express";
import { isDbReady } from '@esparex/core/infrastructure';;
import { logger } from '@esparex/core/utils';;;;
import { sendErrorResponse } from '@esparex/core/utils';;;;

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

    /**
     * ✅ CRITICAL: Never block health endpoint.
     *
     * The health endpoint must always execute so it can return
     * structured degraded JSON (HTTP 200) when MongoDB is down.
     *
     * Supported paths:
     * - /api/v1/health
     * - /health
     * - /api/v1/admin/health (future-safe)
     */
    const path = req.path || "";
    const originalUrl = req.originalUrl || "";

    const isHealthRequest =
        path === "/health" ||
        path.endsWith("/health") ||
        originalUrl === "/health" ||
        originalUrl.endsWith("/health");

    if (isHealthRequest) {
        return next();
    }

    // ✅ Fail fast if DB is not ready
    if (!isDbReady()) {
        const isUrlAdmin = originalUrl.includes("/admin");
        const dbType = isUrlAdmin ? "Admin DB" : "User DB";

        logger.warn(
            `🚨 [DB-GUARD] ${dbType} unavailable or connection lost → ${req.method} ${originalUrl}`
        );

        return sendErrorResponse(req, res, 503, "Database unavailable", {
            code: "DATABASE_UNAVAILABLE",
            details: {
                message:
                    "Service temporarily unavailable due to database connectivity issues. Please try again shortly.",
                level: "CRITICAL",
                service: "MongoDB",
                context: dbType,
            },
        });
    }

    // ✅ DB is ready → continue
    return next();
}