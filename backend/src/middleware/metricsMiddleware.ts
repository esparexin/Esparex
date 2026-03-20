import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import logger from '../utils/logger';

export const apiLatencyMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const requestUrl = req.originalUrl || req.url;
        const msg = `${req.method} ${requestUrl} ${res.statusCode} - ${duration}ms`;
        const isAdminLocationRoute = requestUrl.startsWith('/api/v1/admin/locations');
        const warnThresholdMs = isAdminLocationRoute ? 800 : 500;
        const errorThresholdMs = isAdminLocationRoute ? 2500 : 2000;

        if (duration > errorThresholdMs) {
            logger.error(`[SLOW_API] ${msg}`, { duration, method: req.method, url: req.originalUrl || req.url, status: res.statusCode });
        } else if (duration > warnThresholdMs) {
            logger.warn(`[SLOW_API] ${msg}`, { duration, method: req.method, url: req.originalUrl || req.url, status: res.statusCode });
        }
    });

    next();
};

export const memoryUsageMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // Note: Logging memory on every request is noisy. 
    // Usually handled by a setInterval, but middleware was requested.
    // We log periodically (e.g., 1 in 100 requests) or if memory is very high.
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);

    if (heapUsedMB > 1500) { // 1.5 GB threshold
        logger.error(`[HIGH_MEMORY] Heap used: ${heapUsedMB} MB`);
    }

    next();
};

export const initializeDatabaseMonitoring = () => {
    const slowQueryThresholdMs = 200; // 200ms

    mongoose.plugin((schema) => {
        // Track find operations
        schema.pre(/^(find|findOne|findOneAndUpdate|aggregate)$/, function (this: any, next: any) {
            this._startTime = Date.now();
            next();
        });

        schema.post(/^(find|findOne|findOneAndUpdate|aggregate)$/, function (this: any, docs: any, next: any) {
            if (this._startTime) {
                const duration = Date.now() - this._startTime;
                if (duration > slowQueryThresholdMs) {
                    const collectionName = this.mongooseCollection ? this.mongooseCollection.name : 'unknown_collection';
                    const operation = this.op || 'query';
                    logger.warn(`[SLOW_DB_QUERY] ${collectionName}.${operation} took ${duration}ms`, {
                        collection: collectionName,
                        operation,
                        duration,
                        query: this._conditions || 'unknown_conditions'
                    });
                }
            }
            if (typeof next === 'function') next();
        });
    });
};
