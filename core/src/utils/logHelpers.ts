/**
 * Structured Logging Helpers
 *
 * Domain-specific logging patterns built on top of the core Winston logger instance.
 * Importing from this file instead of logger.ts directly is preferred when you only
 * need helper functions and not the logger instance itself — it keeps the dependency
 * surface narrow and makes mocking in tests straightforward.
 *
 * All helpers are also re-exported from `logger.ts` for backwards compatibility
 * with callers that import them alongside the default logger instance.
 *
 * @module utils/logHelpers
 */

import logger from './logger';
import type { LogDetails } from '@esparex/shared';

// ---------------------------------------------------------------------------
// HTTP
// ---------------------------------------------------------------------------

/**
 * Log an inbound HTTP request.
 * Emitted at the `http` level so it can be filtered independently of
 * application-level info/debug logs.
 */
export function logRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    userId?: string,
): void {
    logger.http('HTTP Request', {
        method,
        url,
        statusCode,
        duration: `${duration}ms`,
        userId,
    });
}

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------

/**
 * Log a database query.
 * Successful queries are emitted at `debug`; failures at `error` with stack trace.
 */
export function logQuery(
    operation: string,
    collection: string,
    duration: number,
    error?: Error,
): void {
    if (error) {
        logger.error('Database Query Failed', {
            operation,
            collection,
            duration: `${duration}ms`,
            error: error.message,
            stack: error.stack,
        });
    } else {
        logger.debug('Database Query', {
            operation,
            collection,
            duration: `${duration}ms`,
        });
    }
}

// ---------------------------------------------------------------------------
// Authentication
// ---------------------------------------------------------------------------

/**
 * Log an authentication lifecycle event (login, logout, register, failed).
 * All auth events are emitted at `info` so they are visible in production
 * without enabling debug mode.
 */
export function logAuth(
    event: 'login' | 'logout' | 'register' | 'failed',
    userId?: string,
    details: LogDetails = {},
): void {
    logger.info('Authentication Event', {
        event,
        userId,
        ...details,
    });
}

// ---------------------------------------------------------------------------
// Security
// ---------------------------------------------------------------------------

/**
 * Log a security event with an explicit severity classification.
 * Emitted at `warn` so security events are always visible regardless of
 * the configured log level (assuming level <= warn).
 *
 * @param severity - 'low' | 'medium' | 'high' | 'critical'
 */
export function logSecurity(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details: LogDetails = {},
): void {
    logger.warn('Security Event', {
        event,
        severity,
        ...details,
    });
}

// ---------------------------------------------------------------------------
// External API
// ---------------------------------------------------------------------------

/**
 * Lazy Prometheus metrics handle.
 * Resolved on first use so this module loads cleanly in environments where
 * metrics.js is not present (e.g. test runners, non-instrumented deployments).
 * The promise is cached after the first resolution — no repeated dynamic imports.
 */
let _metricsPromise: Promise<{
    externalApiDuration: { labels: (...args: string[]) => { observe: (v: number) => void } };
} | null> | null = null;

function getMetrics() {
    if (!_metricsPromise) {
        _metricsPromise = import('./metrics.js')
            .then(m => m as {
                externalApiDuration: { labels: (...args: string[]) => { observe: (v: number) => void } };
            })
            .catch(() => null);
    }
    return _metricsPromise;
}

/**
 * Log an outbound external API call and record its duration as a Prometheus metric.
 * Successful calls are emitted at `debug`; failures at `error`.
 *
 * The Prometheus metric (`externalApiDuration`) is recorded lazily — if the
 * metrics module is unavailable (e.g. in tests) the log call still succeeds.
 */
export function logExternalAPI(
    service: string,
    endpoint: string,
    durationMs: number,
    success: boolean,
    error?: Error,
): void {
    // 📊 RECORD PROMETHEUS METRIC — resolves lazily, silently no-ops if metrics unavailable
    void getMetrics().then(m => {
        m?.externalApiDuration
            .labels(service, endpoint, success ? 'success' : 'failed')
            .observe(durationMs / 1000);
    });

    if (error) {
        logger.error('External API Call Failed', {
            service,
            endpoint,
            duration: `${durationMs}ms`,
            error: error.message,
        });
    } else {
        logger.debug('External API Call', {
            service,
            endpoint,
            duration: `${durationMs}ms`,
            success,
        });
    }
}

// ---------------------------------------------------------------------------
// Business events
// ---------------------------------------------------------------------------

/**
 * Log a domain business event (e.g. 'order_created', 'payment_verified').
 * Emitted at `info` so business events are always visible in production.
 */
export function logBusiness(event: string, details: LogDetails = {}): void {
    logger.info('Business Event', {
        event,
        ...details,
    });
}

// ---------------------------------------------------------------------------
// Performance
// ---------------------------------------------------------------------------

/**
 * Log a performance measurement.
 * Emitted at `debug` — only visible when debug logging is enabled.
 *
 * @param unit - defaults to 'ms'
 */
export function logPerformance(metric: string, value: number, unit = 'ms'): void {
    logger.debug('Performance Metric', {
        metric,
        value,
        unit,
    });
}

// ---------------------------------------------------------------------------
// Context helpers
// ---------------------------------------------------------------------------

/**
 * Create a child logger bound to fixed default metadata.
 * All log calls on the returned logger automatically include the provided fields.
 */
export function createChildLogger(defaultMeta: LogDetails = {}) {
    return logger.child(defaultMeta);
}

/**
 * Create a request-scoped child logger that automatically includes
 * `requestId`, `userId`, and `role` in every subsequent log entry.
 *
 * Usage:
 * ```ts
 * const log = withContext(req);
 * log.info('Processing order');  // → { requestId, userId, role, message, correlationId }
 * ```
 */
export function withContext(req: {
    requestId?: string;
    user?: { id?: string; _id?: { toString(): string }; role?: string };
}) {
    const context: LogDetails = {};
    if (req.requestId) context.requestId = req.requestId;
    if (req.user) {
        context.userId = req.user.id ?? req.user._id?.toString();
        context.role = req.user.role;
    }
    return logger.child(context);
}

// ---------------------------------------------------------------------------
// Morgan stream adapter
// ---------------------------------------------------------------------------

/**
 * Write stream adapter for Morgan HTTP logger middleware.
 * Pipes Morgan's output into the structured Winston logger at the `http` level
 * so HTTP access logs are formatted and rotated alongside application logs.
 *
 * Usage in app.ts:
 * ```ts
 * import { morganStream } from '@esparex/core/utils/logHelpers';
 * app.use(morgan('combined', { stream: morganStream }));
 * ```
 */
export const morganStream = {
    write: (message: string): void => {
        logger.http(message.trim());
    },
};
