import errorMiddleware from '@core/middleware/errorMiddleware';

/**
 * admin-backend Sentry Error Handler Shim
 * Inherits SSOT implementation from @core
 */
export const sentryRequestHandler = errorMiddleware.sentryRequestHandler;
export const sentryTracingHandler = errorMiddleware.sentryTracingHandler;
export const sentryErrorHandler = errorMiddleware.globalErrorHandler; 
export const customErrorHandler = errorMiddleware.globalErrorHandler; 

export default {
    sentryRequestHandler,
    sentryTracingHandler,
    sentryErrorHandler,
    customErrorHandler
};
