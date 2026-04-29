import errorMiddleware from '@core/middleware/errorMiddleware';

/**
 * user-backend Sentry Error Handler Shim
 * Inherits SSOT implementation from @core
 */
export const sentryRequestHandler = errorMiddleware.sentryRequestHandler;
export const sentryTracingHandler = errorMiddleware.sentryTracingHandler;
export const sentryErrorHandler = errorMiddleware.globalErrorHandler; // Aligned with app.ts naming
export const customErrorHandler = errorMiddleware.globalErrorHandler; // Aligned with app.ts naming

export default {
    sentryRequestHandler,
    sentryTracingHandler,
    sentryErrorHandler,
    customErrorHandler
};
