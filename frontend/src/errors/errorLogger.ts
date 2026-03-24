import { AppError } from "./AppError";
import logger from "@/lib/logger";

export function logError(error: AppError) {
    // In production, this can hook into Sentry, Datadog or an internal ingestion API.
    logger.error(`[AppError] ${error.message}`, {
        name: error.name,
        code: error.code,
        status: error.status,
        details: error.details,
        stack: error.stack,
    });
}
