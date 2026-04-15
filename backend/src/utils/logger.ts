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
import { TraceContext } from '@shared/observability/trace';
import type { Logger as BaseLogger, LogDetails, LogLevel } from '@shared/observability/types';

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
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
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
const loggerLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'info');

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
 * Wrapper to satisfy @shared/observability.Logger interface
 */
class WinstonLoggerAdapter implements BaseLogger {
    get level(): string { return winstonLogger.level; }
    log(level: LogLevel, message: unknown, ...meta: unknown[]): void {
        const details = meta.length === 1 && typeof meta[0] === 'object' ? meta[0] as LogDetails : { meta };
        winstonLogger.log(level, message as string, { ...details, correlationId: TraceContext.getCorrelationId() });
    }
    debug(message: unknown, ...meta: unknown[]): void {
        const details = meta.length === 1 && typeof meta[0] === 'object' ? meta[0] as LogDetails : { meta };
        winstonLogger.debug(message as string, { ...details, correlationId: TraceContext.getCorrelationId() });
    }
    info(message: unknown, ...meta: unknown[]): void {
        const details = meta.length === 1 && typeof meta[0] === 'object' ? meta[0] as LogDetails : { meta };
        winstonLogger.info(message as string, { ...details, correlationId: TraceContext.getCorrelationId() });
    }
    warn(message: unknown, ...meta: unknown[]): void {
        const details = meta.length === 1 && typeof meta[0] === 'object' ? meta[0] as LogDetails : { meta };
        winstonLogger.warn(message as string, { ...details, correlationId: TraceContext.getCorrelationId() });
    }
    warning(message: unknown, ...meta: unknown[]): void {
        const details = meta.length === 1 && typeof meta[0] === 'object' ? meta[0] as LogDetails : { meta };
        winstonLogger.warn(message as string, { ...details, correlationId: TraceContext.getCorrelationId() });
    }
    error(message: unknown, ...meta: unknown[]): void {
        const details = meta.length === 1 && typeof meta[0] === 'object' ? meta[0] as LogDetails : { meta };
        winstonLogger.error(message as string, { ...details, correlationId: TraceContext.getCorrelationId() });
    }
    http(message: unknown, ...meta: unknown[]): void {
        const details = meta.length === 1 && typeof meta[0] === 'object' ? meta[0] as LogDetails : { meta };
        winstonLogger.http(message as string, { ...details, correlationId: TraceContext.getCorrelationId() });
    }
    child(defaultMeta: LogDetails): BaseLogger {
        return new WinstonLoggerAdapterChild(winstonLogger.child(defaultMeta));
    }
}

class WinstonLoggerAdapterChild implements BaseLogger {
    constructor(private wLogger: winston.Logger) {}
    get level(): string { return this.wLogger.level; }
    log(level: LogLevel, message: unknown, ...meta: unknown[]): void {
        this.wLogger.log(level, message as string, ...meta, { correlationId: TraceContext.getCorrelationId() });
    }
    debug(message: unknown, ...meta: unknown[]): void {
        this.wLogger.debug(message as string, ...meta, { correlationId: TraceContext.getCorrelationId() });
    }
    info(message: unknown, ...meta: unknown[]): void {
        this.wLogger.info(message as string, ...meta, { correlationId: TraceContext.getCorrelationId() });
    }
    warn(message: unknown, ...meta: unknown[]): void {
        this.wLogger.warn(message as string, ...meta, { correlationId: TraceContext.getCorrelationId() });
    }
    warning(message: unknown, ...meta: unknown[]): void {
        this.wLogger.warn(message as string, ...meta, { correlationId: TraceContext.getCorrelationId() });
    }
    error(message: unknown, ...meta: unknown[]): void {
        this.wLogger.error(message as string, ...meta, { correlationId: TraceContext.getCorrelationId() });
    }
    http(message: unknown, ...meta: unknown[]): void {
        this.wLogger.http(message as string, ...meta, { correlationId: TraceContext.getCorrelationId() });
    }
    child(defaultMeta: LogDetails): BaseLogger {
        return new WinstonLoggerAdapterChild(this.wLogger.child(defaultMeta));
    }
}

const logger = new WinstonLoggerAdapter();

/**
 * Log levels:
 * - error: 0 - Critical errors that need immediate attention
 * - warn: 1 - Warning messages
 * - info: 2 - General informational messages
 * - http: 3 - HTTP request logs
 * - debug: 4 - Detailed debug information
 */

/**
 * Helper functions for common logging patterns
 */

/**
 * Log HTTP request
 */
export function logRequest(method: string, url: string, statusCode: number, duration: number, userId?: string) {
    logger.http('HTTP Request', {
        method,
        url,
        statusCode,
        duration: `${duration}ms`,
        userId,
    });
}

/**
 * Log database query
 */
export function logQuery(operation: string, collection: string, duration: number, error?: Error) {
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

/**
 * Log authentication event
 */
export function logAuth(
    event: 'login' | 'logout' | 'register' | 'failed',
    userId?: string,
    details: LogDetails = {}
) {
    logger.info('Authentication Event', {
        event,
        userId,
        ...details,
    });
}

/**
 * Log security event
 */
export function logSecurity(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details: LogDetails = {}
) {
    logger.warn('Security Event', {
        event,
        severity,
        ...details,
    });
}

/**
 * Log external API call
 */
export function logExternalAPI(service: string, endpoint: string, duration: number, success: boolean, error?: Error) {
    if (error) {
        logger.error('External API Call Failed', {
            service,
            endpoint,
            duration: `${duration}ms`,
            error: error.message,
        });
    } else {
        logger.debug('External API Call', {
            service,
            endpoint,
            duration: `${duration}ms`,
            success,
        });
    }
}

/**
 * Log business event
 */
export function logBusiness(event: string, details: LogDetails = {}) {
    logger.info('Business Event', {
        event,
        ...details,
    });
}

/**
 * Log performance metric
 */
export function logPerformance(metric: string, value: number, unit: string = 'ms') {
    logger.debug('Performance Metric', {
        metric,
        value,
        unit,
    });
}

/**
 * Create a child logger with default metadata
 */
export function createChildLogger(defaultMeta: LogDetails = {}) {
    return logger.child(defaultMeta);
}

/**
 * Stream for Morgan HTTP logger
 */
export const morganStream = {
    write: (message: string) => {
        logger.http(message.trim());
    },
};

// Log startup
if (!isTest && process.env.STARTUP_VERBOSE === 'true') {
    logger.info('Logger initialized', {
        environment: env.NODE_ENV,
        level: logger.level,
        transports: transports.map(t => t.constructor.name),
    });
}

export default logger;
