import { createUniversalLogger } from './logger';
import type { Logger } from './types';

// Singleton instance
let logger: Logger | null = null;

export const getLogger = (serviceName: string = 'app'): Logger => {
    if (!logger) {
        logger = createUniversalLogger(serviceName);
    }
    return logger;
};

export * from './types';
export * from './logger';
