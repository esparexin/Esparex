/**
 * Structured Logging Utility
 * 
 * Provides Winston-based logging with different transports for different environments.
 * Replaces all console.log statements with structured, searchable logs.
 * 
 * @module utils/logger
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { env, isProduction, isDevelopment, isTest } from '../config/env';
import { TraceContext } from "@esparex/shared";
import type { Logger as BaseLogger, LogDetails, LogLevel } from "@esparex/shared";

const isJestRuntime = typeof process.env.JEST_WORKER_ID !== 'undefined';
const shouldSilenceForTests = isTest || isJestRuntime;

const maskPII = winston.format((info) => {
    if (process.env.NODE_ENV !== 'production') return info;

    const piiFields = ['email', 'phone', 'phonenumber', 'mobile', 'password', 'token'];

    const mask = (obj: Record<string, unknown>, seen = new WeakSet<Record<string, unknown>>()): void => {
        if (!obj || typeof obj !== 'object' || seen.has(obj)) return;
        seen.add(obj);

        Object.keys(obj).forEach(key => {
            if (typeof obj[key] === 'string' && piiFields.includes(key.toLowerCase())) {
                obj[key] = '[REDACTED PII]';
            } else if (typeof obj[key] === 'object' && obj[key] !== undefined) {
                mask(obj[key] as Record<string, unknown>, seen);
            }
        });
    };

    mask(info);
    return info;
});

/**
 * Custom log format with timestamp and colors
 */
const logFormat = winston.format.combine(
    maskPII(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

/**
 * Console format for development (human-readable)
 */
const consoleFormat = winston.format.combine(
    maskPII(),
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${String(timestamp)} [${level}]: ${String(message)}`;

        // Add metadata if present
        if (meta && Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta)}`;
        }

        return msg;
    })
);

/**
 * Create transports based on environment
 */
const transports: winston.transport[] = [];
const loggerLevel = process.env.LOG_LEVEL || 'info';

// Console transport (always enabled except in tests)
if (!shouldSilenceForTests) {
    transports.push(
        new winston.transports.Console({
            format: isDevelopment ? consoleFormat : logFormat,
            level: loggerLevel,
        })
    );
}

// File transports (production and development, but never under Jest)
if (!shouldSilenceForTests && (isProduction || isDevelopment)) {
    const logsDir = path.join(process.cwd(), 'logs');

    // Error logs (separate file)
    transports.push(
        new DailyRotateFile({
            filename: path.join(logsDir, 'error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            maxSize: '20m',
            maxFiles: '14d',
            zippedArchive: true,
            format: logFormat,
        })
    );

    // Combined logs (all levels)
    transports.push(
        new DailyRotateFile({
            filename: path.join(logsDir, 'combined-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '14d',
            zippedArchive: true,
            format: logFormat,
        })
    );

    // Debug logs (development only)
    if (isDevelopment) {
        transports.push(
            new DailyRotateFile({
                filename: path.join(logsDir, 'debug-%DATE%.log'),
                datePattern: 'YYYY-MM-DD',
                level: 'debug',
                maxSize: '20m',
                maxFiles: '7d',
                zippedArchive: true,
                format: logFormat,
            })
        );
    }
}

// Avoid "no transports" warnings in test environments
if (transports.length === 0) {
    transports.push(
        new winston.transports.Console({
            silent: true
        })
    );
}

/**
 * Winston logger instance
 */
const winstonLogger = winston.createLogger({
    level: loggerLevel,
    format: logFormat,
    transports,
    exitOnError: false,
});

/**
 * Wrapper to satisfy the @esparex/shared Logger interface.
 *
 * Both the root adapter (delegates to the shared winstonLogger instance) and
 * child adapters (wrap winston.Logger.child()) share the same per-method logic
 * via the private withCorrelation() helper. This eliminates the 7-method
 * duplication that previously existed in WinstonLoggerAdapterChild.
 */
class WinstonLoggerAdapter implements BaseLogger {
    constructor(private readonly wl: winston.Logger) {}
    get level(): string { return this.wl.level; }

    /**
     * Appends the live correlationId from AsyncLocalStorage to every log call.
     * Defined once here; WinstonLoggerAdapterChild re-uses it by composing
     * a child WinstonLoggerAdapter rather than re-implementing every method.
     */
    private withCorrelation(details: unknown[]): LogDetails {
        const base = details.length === 1 && typeof details[0] === 'object'
            ? details[0] as LogDetails
            : { meta: details };
        return { ...base, correlationId: TraceContext.getCorrelationId() };
    }

    log(level: LogLevel, message: unknown, ...meta: unknown[]): void {
        this.wl.log(level, message as string, this.withCorrelation(meta));
    }
    debug(message: unknown, ...meta: unknown[]): void {
        this.wl.debug(message as string, this.withCorrelation(meta));
    }
    info(message: unknown, ...meta: unknown[]): void {
        this.wl.info(message as string, this.withCorrelation(meta));
    }
    warn(message: unknown, ...meta: unknown[]): void {
        this.wl.warn(message as string, this.withCorrelation(meta));
    }
    /** Alias for warn() — satisfies the BaseLogger.warning() contract. */
    warning(message: unknown, ...meta: unknown[]): void {
        this.wl.warn(message as string, this.withCorrelation(meta));
    }
    error(message: unknown, ...meta: unknown[]): void {
        this.wl.error(message as string, this.withCorrelation(meta));
    }
    http(message: unknown, ...meta: unknown[]): void {
        this.wl.http(message as string, this.withCorrelation(meta));
    }
    child(defaultMeta: LogDetails): BaseLogger {
        return new WinstonLoggerAdapter(this.wl.child(defaultMeta));
    }
}

const logger = new WinstonLoggerAdapter(winstonLogger);


/**
 * Helper functions for common logging patterns.
 *
 * The implementations live in `./logHelpers` to keep this file focused on the
 * Winston instance and adapter class. All helpers are re-exported here so that
 * existing callers importing from `@esparex/core/utils/logger` continue to work
 * without any import path changes.
 */
export {
    logRequest,
    logQuery,
    logAuth,
    logSecurity,
    logExternalAPI,
    logBusiness,
    logPerformance,
    createChildLogger,
    withContext,
    morganStream,
} from './logHelpers';

// Log startup
if (!isTest && process.env.STARTUP_VERBOSE === 'true') {
    logger.info('Logger initialized', {
        environment: env.NODE_ENV,
        level: logger.level,
        transports: transports.map(t => t.constructor.name),
    });
}

export default logger;
