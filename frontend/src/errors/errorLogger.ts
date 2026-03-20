import { AppError } from "./AppError";

export function logError(error: AppError) {
    // Safe console logging for the development environment.
    // In production, this can hook into Sentry, Datadog or an internal ingestion API.
    console.error(`[AppError] ${error.message}`, {
        name: error.name,
        code: error.code,
        status: error.status,
        details: error.details,
        stack: error.stack,
    });
}
