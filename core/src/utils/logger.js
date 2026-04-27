"use strict";
/**
 * Structured Logging Utility
 *
 * Provides Winston-based logging with different transports for different environments.
 * Replaces all console.log statements with structured, searchable logs.
 *
 * @module utils/logger
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.morganStream = void 0;
exports.logRequest = logRequest;
exports.logQuery = logQuery;
exports.logAuth = logAuth;
exports.logSecurity = logSecurity;
exports.logExternalAPI = logExternalAPI;
exports.logBusiness = logBusiness;
exports.logPerformance = logPerformance;
exports.createChildLogger = createChildLogger;
exports.withContext = withContext;
const winston_1 = __importDefault(require("winston"));
const winston_daily_rotate_file_1 = __importDefault(require("winston-daily-rotate-file"));
const path_1 = __importDefault(require("path"));
const env_1 = require("@core/config/env");
const trace_1 = require("@shared/observability/trace");
const isJestRuntime = typeof process.env.JEST_WORKER_ID !== 'undefined';
const shouldSilenceForTests = env_1.isTest || isJestRuntime;
const maskPII = winston_1.default.format((info) => {
    if (process.env.NODE_ENV !== 'production')
        return info;
    const piiFields = ['email', 'phone', 'phonenumber', 'mobile', 'password', 'token'];
    const mask = (obj, seen = new WeakSet()) => {
        if (!obj || typeof obj !== 'object' || seen.has(obj))
            return;
        seen.add(obj);
        Object.keys(obj).forEach(key => {
            if (typeof obj[key] === 'string' && piiFields.includes(key.toLowerCase())) {
                obj[key] = '[REDACTED PII]';
            }
            else if (typeof obj[key] === 'object' && obj[key] !== null) {
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
const logFormat = winston_1.default.format.combine(maskPII(), winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.splat(), winston_1.default.format.json());
/**
 * Console format for development (human-readable)
 */
const consoleFormat = winston_1.default.format.combine(maskPII(), winston_1.default.format.colorize(), winston_1.default.format.timestamp({ format: 'HH:mm:ss' }), winston_1.default.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${String(timestamp)} [${level}]: ${String(message)}`;
    // Add metadata if present
    if (meta && Object.keys(meta).length > 0) {
        msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
}));
/**
 * Create transports based on environment
 */
const transports = [];
const loggerLevel = process.env.LOG_LEVEL || (env_1.isProduction ? 'info' : 'info');
// Console transport (always enabled except in tests)
if (!shouldSilenceForTests) {
    transports.push(new winston_1.default.transports.Console({
        format: env_1.isDevelopment ? consoleFormat : logFormat,
        level: loggerLevel,
    }));
}
// File transports (production and development, but never under Jest)
if (!shouldSilenceForTests && (env_1.isProduction || env_1.isDevelopment)) {
    const logsDir = path_1.default.join(process.cwd(), 'logs');
    // Error logs (separate file)
    transports.push(new winston_daily_rotate_file_1.default({
        filename: path_1.default.join(logsDir, 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        maxSize: '20m',
        maxFiles: '14d',
        zippedArchive: true,
        format: logFormat,
    }));
    // Combined logs (all levels)
    transports.push(new winston_daily_rotate_file_1.default({
        filename: path_1.default.join(logsDir, 'combined-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        maxSize: '20m',
        maxFiles: '14d',
        zippedArchive: true,
        format: logFormat,
    }));
    // Debug logs (development only)
    if (env_1.isDevelopment) {
        transports.push(new winston_daily_rotate_file_1.default({
            filename: path_1.default.join(logsDir, 'debug-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            level: 'debug',
            maxSize: '20m',
            maxFiles: '7d',
            zippedArchive: true,
            format: logFormat,
        }));
    }
}
// Avoid "no transports" warnings in test environments
if (transports.length === 0) {
    transports.push(new winston_1.default.transports.Console({
        silent: true
    }));
}
/**
 * Winston logger instance
 */
const winstonLogger = winston_1.default.createLogger({
    level: loggerLevel,
    format: logFormat,
    transports,
    exitOnError: false,
});
/**
 * Wrapper to satisfy ../shared/observability.Logger interface
 */
class WinstonLoggerAdapter {
    get level() { return winstonLogger.level; }
    log(level, message, ...meta) {
        const details = meta.length === 1 && typeof meta[0] === 'object' ? meta[0] : { meta };
        winstonLogger.log(level, message, { ...details, correlationId: trace_1.TraceContext.getCorrelationId() });
    }
    debug(message, ...meta) {
        const details = meta.length === 1 && typeof meta[0] === 'object' ? meta[0] : { meta };
        winstonLogger.debug(message, { ...details, correlationId: trace_1.TraceContext.getCorrelationId() });
    }
    info(message, ...meta) {
        const details = meta.length === 1 && typeof meta[0] === 'object' ? meta[0] : { meta };
        winstonLogger.info(message, { ...details, correlationId: trace_1.TraceContext.getCorrelationId() });
    }
    warn(message, ...meta) {
        const details = meta.length === 1 && typeof meta[0] === 'object' ? meta[0] : { meta };
        winstonLogger.warn(message, { ...details, correlationId: trace_1.TraceContext.getCorrelationId() });
    }
    warning(message, ...meta) {
        const details = meta.length === 1 && typeof meta[0] === 'object' ? meta[0] : { meta };
        winstonLogger.warn(message, { ...details, correlationId: trace_1.TraceContext.getCorrelationId() });
    }
    error(message, ...meta) {
        const details = meta.length === 1 && typeof meta[0] === 'object' ? meta[0] : { meta };
        winstonLogger.error(message, { ...details, correlationId: trace_1.TraceContext.getCorrelationId() });
    }
    http(message, ...meta) {
        const details = meta.length === 1 && typeof meta[0] === 'object' ? meta[0] : { meta };
        winstonLogger.http(message, { ...details, correlationId: trace_1.TraceContext.getCorrelationId() });
    }
    child(defaultMeta) {
        return new WinstonLoggerAdapterChild(winstonLogger.child(defaultMeta));
    }
}
class WinstonLoggerAdapterChild {
    wLogger;
    constructor(wLogger) {
        this.wLogger = wLogger;
    }
    get level() { return this.wLogger.level; }
    log(level, message, ...meta) {
        this.wLogger.log(level, message, ...meta, { correlationId: trace_1.TraceContext.getCorrelationId() });
    }
    debug(message, ...meta) {
        this.wLogger.debug(message, ...meta, { correlationId: trace_1.TraceContext.getCorrelationId() });
    }
    info(message, ...meta) {
        this.wLogger.info(message, ...meta, { correlationId: trace_1.TraceContext.getCorrelationId() });
    }
    warn(message, ...meta) {
        this.wLogger.warn(message, ...meta, { correlationId: trace_1.TraceContext.getCorrelationId() });
    }
    warning(message, ...meta) {
        this.wLogger.warn(message, ...meta, { correlationId: trace_1.TraceContext.getCorrelationId() });
    }
    error(message, ...meta) {
        this.wLogger.error(message, ...meta, { correlationId: trace_1.TraceContext.getCorrelationId() });
    }
    http(message, ...meta) {
        this.wLogger.http(message, ...meta, { correlationId: trace_1.TraceContext.getCorrelationId() });
    }
    child(defaultMeta) {
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
function logRequest(method, url, statusCode, duration, userId) {
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
function logQuery(operation, collection, duration, error) {
    if (error) {
        logger.error('Database Query Failed', {
            operation,
            collection,
            duration: `${duration}ms`,
            error: error.message,
            stack: error.stack,
        });
    }
    else {
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
function logAuth(event, userId, details = {}) {
    logger.info('Authentication Event', {
        event,
        userId,
        ...details,
    });
}
/**
 * Log security event
 */
function logSecurity(event, severity, details = {}) {
    logger.warn('Security Event', {
        event,
        severity,
        ...details,
    });
}
/**
 * Log external API call
 */
function logExternalAPI(service, endpoint, duration, success, error) {
    if (error) {
        logger.error('External API Call Failed', {
            service,
            endpoint,
            duration: `${duration}ms`,
            error: error.message,
        });
    }
    else {
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
function logBusiness(event, details = {}) {
    logger.info('Business Event', {
        event,
        ...details,
    });
}
/**
 * Log performance metric
 */
function logPerformance(metric, value, unit = 'ms') {
    logger.debug('Performance Metric', {
        metric,
        value,
        unit,
    });
}
/**
 * Create a child logger with default metadata
 */
function createChildLogger(defaultMeta = {}) {
    return logger.child(defaultMeta);
}
/**
 * Creates a request-contextual logger that automatically includes
 * requestId and userId in all subsequent log entries.
 */
function withContext(req) {
    const context = {};
    if (req.requestId)
        context.requestId = req.requestId;
    if (req.user) {
        context.userId = req.user.id ?? req.user._id?.toString();
        context.role = req.user.role;
    }
    return logger.child(context);
}
/**
 * Stream for Morgan HTTP logger
 */
exports.morganStream = {
    write: (message) => {
        logger.http(message.trim());
    },
};
// Log startup
if (!env_1.isTest && process.env.STARTUP_VERBOSE === 'true') {
    logger.info('Logger initialized', {
        environment: env_1.env.NODE_ENV,
        level: logger.level,
        transports: transports.map(t => t.constructor.name),
    });
}
exports.default = logger;
//# sourceMappingURL=logger.js.map