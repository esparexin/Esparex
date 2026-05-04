"use strict";
/**
 * Sentry Error Tracking Configuration
 *
 * Initializes Sentry for error tracking and performance monitoring.
 * Automatically captures errors, unhandled rejections, and performance metrics.
 *
 * @module config/sentry
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSentry = initSentry;
exports.captureException = captureException;
exports.captureMessage = captureMessage;
exports.setUser = setUser;
exports.clearUser = clearUser;
exports.addBreadcrumb = addBreadcrumb;
exports.startTransaction = startTransaction;
exports.flushSentry = flushSentry;
const Sentry = __importStar(require("@sentry/node"));
const profiling_node_1 = require("@sentry/profiling-node");
const env_1 = require("./env");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Initialize Sentry error tracking
 *
 * Only initializes if SENTRY_DSN is configured.
 * Includes performance monitoring and profiling in production.
 */
function initSentry() {
    // Skip if Sentry is not configured
    if (!env_1.env.SENTRY_DSN) {
        if (env_1.isProduction) {
            logger_1.default.warn('Sentry DSN not configured. Error tracking disabled in production!');
        }
        else {
            logger_1.default.debug('Sentry DSN not configured. Error tracking disabled.');
        }
        return;
    }
    try {
        Sentry.init({
            dsn: env_1.env.SENTRY_DSN,
            environment: env_1.env.SENTRY_ENVIRONMENT || env_1.env.NODE_ENV,
            // Performance Monitoring
            tracesSampleRate: env_1.isProduction ? 0.1 : 1.0, // 10% in prod, 100% in dev
            // Profiling
            profilesSampleRate: env_1.isProduction ? 0.1 : 1.0,
            integrations: [
                (0, profiling_node_1.nodeProfilingIntegration)(),
            ],
            // Release tracking
            release: process.env.npm_package_version,
            // Error filtering
            beforeSend(event, hint) {
                // Don't send errors in development unless explicitly enabled
                if (env_1.isDevelopment && !env_1.env.SENTRY_ENABLE_DEV) {
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
        logger_1.default.info('Sentry initialized successfully', {
            environment: env_1.env.SENTRY_ENVIRONMENT || env_1.env.NODE_ENV,
            tracesSampleRate: env_1.isProduction ? 0.1 : 1.0,
        });
    }
    catch (error) {
        logger_1.default.error('Failed to initialize Sentry', {
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
function captureException(error, context) {
    if (!env_1.env.SENTRY_DSN) {
        logger_1.default.error('Error occurred (Sentry not configured)', {
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
function captureMessage(message, level = 'info', context) {
    if (!env_1.env.SENTRY_DSN) {
        logger_1.default.log(level === 'fatal' ? 'error' : level, message, context);
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
function setUser(user) {
    if (!env_1.env.SENTRY_DSN)
        return;
    Sentry.setUser({
        id: user.id,
        email: user.email,
        username: user.username,
    });
}
/**
 * Clear user context
 */
function clearUser() {
    if (!env_1.env.SENTRY_DSN)
        return;
    Sentry.setUser(null);
}
/**
 * Add breadcrumb for debugging
 *
 * @param message - Breadcrumb message
 * @param category - Category (e.g., 'auth', 'db', 'api')
 * @param data - Additional data
 */
function addBreadcrumb(message, category, data) {
    if (!env_1.env.SENTRY_DSN)
        return;
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
function startTransaction(name, op) {
    void name;
    void op;
    if (!env_1.env.SENTRY_DSN) {
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
async function flushSentry(timeout = 2000) {
    if (!env_1.env.SENTRY_DSN)
        return true;
    try {
        return await Sentry.close(timeout);
    }
    catch (error) {
        logger_1.default.error('Failed to flush Sentry', {
            error: error instanceof Error ? error.message : String(error),
        });
        return false;
    }
}
exports.default = Sentry;
//# sourceMappingURL=sentry.js.map