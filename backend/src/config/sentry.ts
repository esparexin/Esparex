/**
 * Sentry Error Tracking Configuration
 * 
 * Initializes Sentry for error tracking and performance monitoring.
 * Automatically captures errors, unhandled rejections, and performance metrics.
 * 
 * @module config/sentry
 */

import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { env, isProduction, isDevelopment } from './env';
import logger from '../utils/logger';

/**
 * Initialize Sentry error tracking
 * 
 * Only initializes if SENTRY_DSN is configured.
 * Includes performance monitoring and profiling in production.
 */
export function initSentry() {
    // Skip if Sentry is not configured
    if (!env.SENTRY_DSN) {
        if (isProduction) {
            logger.warn('Sentry DSN not configured. Error tracking disabled in production!');
        } else {
            logger.debug('Sentry DSN not configured. Error tracking disabled.');
        }
        return;
    }

    try {
        Sentry.init({
            dsn: env.SENTRY_DSN,
            environment: env.SENTRY_ENVIRONMENT || env.NODE_ENV,

            // Performance Monitoring
            tracesSampleRate: isProduction ? 0.1 : 1.0, // 10% in prod, 100% in dev

            // Profiling
            profilesSampleRate: isProduction ? 0.1 : 1.0,
            integrations: [
                nodeProfilingIntegration(),
            ],

            // Release tracking
            release: process.env.npm_package_version,

            // Error filtering
            beforeSend(event, hint) {
                // Don't send errors in development unless explicitly enabled
                if (isDevelopment && !process.env.SENTRY_ENABLE_DEV) {
                    return null;
                }

                // Filter out known non-critical errors
                const error = hint.originalException;

                if (error instanceof Error) {
                    // Ignore MongoDB connection errors during shutdown
                    if (error.message.includes('topology was destroyed')) {
                        return null;
                    }

                    // Ignore rate limit errors (expected behavior)
                    if (error.message.includes('Too many requests')) {
                        return null;
                    }

                    // Ignore validation errors (user input errors)
                    if (error.message.includes('Validation failed')) {
                        return null;
                    }
                }

                return event;
            },

            // Breadcrumbs configuration
            maxBreadcrumbs: 50,

            // Attach stack traces to all messages
            attachStacktrace: true,
        });

        logger.info('Sentry initialized successfully', {
            environment: env.SENTRY_ENVIRONMENT || env.NODE_ENV,
            tracesSampleRate: isProduction ? 0.1 : 1.0,
        });
    } catch (error) {
        logger.error('Failed to initialize Sentry', {
            error: error instanceof Error ? error.message : String(error),
        });
    }
}

/**
 * Capture an exception in Sentry
 * 
 * @param error - Error to capture
 * @param context - Additional context
 */
export function captureException(error: Error, context?: Record<string, unknown>) {
    if (!env.SENTRY_DSN) {
        logger.error('Error occurred (Sentry not configured)', {
            error: error.message,
            stack: error.stack,
            ...context,
        });
        return;
    }

    Sentry.captureException(error, {
        extra: context,
    });
}

/**
 * Capture a message in Sentry
 * 
 * @param message - Message to capture
 * @param level - Severity level
 * @param context - Additional context
 */
export function captureMessage(
    message: string,
    level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
    context?: Record<string, unknown>
) {
    if (!env.SENTRY_DSN) {
        logger.log(level === 'fatal' ? 'error' : level, message, context);
        return;
    }

    Sentry.captureMessage(message, {
        level,
        extra: context,
    });
}

/**
 * Set user context for error tracking
 * 
 * @param user - User information
 */
export function setUser(user: { id: string; email?: string; username?: string }) {
    if (!env.SENTRY_DSN) return;

    Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.username,
    });
}

/**
 * Clear user context
 */
export function clearUser() {
    if (!env.SENTRY_DSN) return;
    Sentry.setUser(null);
}

/**
 * Add breadcrumb for debugging
 * 
 * @param message - Breadcrumb message
 * @param category - Category (e.g., 'auth', 'db', 'api')
 * @param data - Additional data
 */
export function addBreadcrumb(
    message: string,
    category: string,
    data?: Record<string, unknown>
) {
    if (!env.SENTRY_DSN) return;

    Sentry.addBreadcrumb({
        message,
        category,
        data,
        level: 'info',
    });
}

/**
 * Note: Transaction API has been deprecated in Sentry v8+
 * Use Sentry.startSpan() instead for performance monitoring
 * This function is kept for backward compatibility but does nothing
 */
export function startTransaction(name: string, op: string) {
    void name;
    void op;
    if (!env.SENTRY_DSN) {
        return {
            finish: () => { },
            setStatus: () => { },
            setData: () => { },
        };
    }

    // Return a no-op object for backward compatibility
    return {
        finish: () => { },
        setStatus: () => { },
        setData: () => { },
    };
}

/**
 * Flush Sentry events (useful before shutdown)
 * 
 * @param timeout - Timeout in milliseconds
 */
export async function flushSentry(timeout = 2000): Promise<boolean> {
    if (!env.SENTRY_DSN) return true;

    try {
        return await Sentry.close(timeout);
    } catch (error) {
        logger.error('Failed to flush Sentry', {
            error: error instanceof Error ? error.message : String(error),
        });
        return false;
    }
}

export default Sentry;
