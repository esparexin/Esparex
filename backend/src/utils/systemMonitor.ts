import logger from './logger';
import { env } from '../config/env';

export const startSystemMonitor = () => {
    const role = env.PROCESS_ROLE as string;
    if (role !== 'api' && role !== 'worker') {
        return;
    }

    // Resolve monitor settings once at startup so behavior is explicit and stable.
    const defaultLimitMb = env.NODE_ENV === 'production' ? 512 : 2048;
    const parsedLimitMb = parseInt(process.env.CONTAINER_MEMORY_LIMIT_MB || `${defaultLimitMb}`, 10);
    const CONTAINER_LIMIT_MB = Number.isFinite(parsedLimitMb) && parsedLimitMb > 0 ? parsedLimitMb : defaultLimitMb;
    const defaultWarnRatio = env.NODE_ENV === 'production' ? 0.75 : 0.9;
    const parsedWarnRatio = parseFloat(process.env.SYSTEM_MONITOR_WARN_RATIO || `${defaultWarnRatio}`);
    const warnRatio = Number.isFinite(parsedWarnRatio) && parsedWarnRatio > 0 && parsedWarnRatio < 1
        ? parsedWarnRatio
        : defaultWarnRatio;
    const warnThresholdMb = CONTAINER_LIMIT_MB * warnRatio;

    logger.info(
        `[SYSTEM_MONITOR] Settings resolved: limit=${CONTAINER_LIMIT_MB}MB ` +
        `ratio=${warnRatio} threshold=${warnThresholdMb.toFixed(2)}MB interval=30000ms role=${role}`
    );

    setInterval(() => {
        const mem = process.memoryUsage();
        const heapUsedMB = (mem.heapUsed / 1024 / 1024).toFixed(2);
        const rssMB = (mem.rss / 1024 / 1024).toFixed(2);
        const heapUsed = parseFloat(heapUsedMB);

        if (heapUsed > warnThresholdMb) {
            logger.warn(
                `[SYSTEM_MONITOR] High Memory Pressure: Heap ${heapUsedMB}MB / RSS ${rssMB}MB ` +
                `(threshold ${warnThresholdMb.toFixed(2)}MB; limit ${CONTAINER_LIMIT_MB}MB, ratio ${warnRatio})`
            );
        } else {
            // Optional debug level logging for normal operation
            logger.debug(`[SYSTEM_MONITOR] Memory: Heap ${heapUsedMB}MB / RSS ${rssMB}MB`);
        }
    }, 30000);
};
