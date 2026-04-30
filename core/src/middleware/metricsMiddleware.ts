import { Request, Response, NextFunction } from 'express';
import { AlertService } from '../services/AlertService';

/**
 * API Latency & Performance Tracking Middleware
 */
export const apiLatencyMiddleware = (serviceName: string) => (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const url = req.originalUrl || req.url;

        // Auto-detect performance issues
        if (duration > 1000) {
            AlertService.capturePerformance(serviceName, req.method, url, duration);
        }
    });

    next();
};

/**
 * Memory Usage Monitoring Middleware
 */
export const memoryUsageMiddleware = (serviceName: string) => (req: Request, res: Response, next: NextFunction) => {
    const memoryUsage = process.memoryUsage();
    const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);

    if (heapUsedMB > 1500) { // 1.5 GB threshold
        AlertService.trigger({
            type: 'HIGH_MEMORY_USAGE',
            severity: 'HIGH',
            service: serviceName,
            message: `Memory usage critical: ${heapUsedMB} MB`,
            metadata: { heapUsedMB }
        });
    }

    next();
};

/**
 * Compatibility wrapper for backend services
 */
export const initializeDatabaseMonitoring = () => {
    // This previously might have initialized some DB level hooks.
    // In the new architecture, these are handled via global mongoose plugins in core/config/mongoosePlugins.ts
    // We keep this shim to avoid breaking existing service boot sequences.
    return;
};
