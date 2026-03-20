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

type LogDetails = Record<string, unknown>;

const maskPII = winston.format((info) => {
    if (process.env.NODE_ENV !== 'production') return info;

    const piiFields = ['email', 'phone', 'phonenumber', 'mobile', 'password', 'token'];

    const mask = (obj: any, seen = new WeakSet()): void => {
        if (!obj || typeof obj !== 'object' || seen.has(obj)) return;
        seen.add(obj);

        Object.keys(obj).forEach(key => {
            if (typeof obj[key] === 'string' && piiFields.includes(key.toLowerCase())) {
                obj[key] = '[REDACTED PII]';
            } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                mask(obj[key], seen);
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
        let msg = `${timestamp} [${level}]: ${message}`;

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

// Console transport (always enabled except in test)
if (!isTest) {
    transports.push(
        new winston.transports.Console({
            format: isDevelopment ? consoleFormat : logFormat,
            level: loggerLevel,
        })
    );
}

// File transports (production and development)
if (isProduction || isDevelopment) {
    const logsDir = path.join(process.cwd(), 'logs');

    // Error logs (separate file)
    transports.push(
        new DailyRotateFile({
            filename: path.join(logsDir, 'error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            maxSize: '20m',
            maxFiles: '14d',
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
const logger = winston.createLogger({
    level: loggerLevel,
    format: logFormat,
    transports,
    exitOnError: false,
});

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
