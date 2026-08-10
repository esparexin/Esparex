import { FrontendAppError } from "./FrontendAppError";
import logger from "@/lib/logger";

export function logError(error: FrontendAppError) {
    logger.error(`[AppError] ${error.message}`, {
        name: error.name,
        code: error.code,
        status: error.status,
        details: error.details,
        stack: error.stack,
    });

    // Wire to Sentry in production for real-time error telemetry (F45)
    if (process.env.NODE_ENV === "production" && process.env.NEXT_PUBLIC_SENTRY_DSN) {
        import("@sentry/nextjs")
            .then(({ captureException }) => {
                captureException(error, {
                    extra: {
                        code: error.code,
                        status: error.status,
                        details: error.details,
                    },
                });
            })
            .catch(() => {
                // Sentry import failure must never crash the app
            });
    }
}

