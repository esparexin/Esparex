"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startSystemMonitor = void 0;
const logger_1 = __importDefault(require("./logger"));
const env_1 = require("@core/config/env");
const startSystemMonitor = () => {
    const role = env_1.env.PROCESS_ROLE;
    if (role !== 'api' && role !== 'worker') {
        return;
    }
    // Resolve monitor settings once at startup so behavior is explicit and stable.
    const defaultLimitMb = env_1.env.NODE_ENV === 'production' ? 512 : 2048;
    const CONTAINER_LIMIT_MB = env_1.env.CONTAINER_MEMORY_LIMIT_MB ?? defaultLimitMb;
    const defaultWarnRatio = env_1.env.NODE_ENV === 'production' ? 0.75 : 0.9;
    const warnRatio = env_1.env.SYSTEM_MONITOR_WARN_RATIO ?? defaultWarnRatio;
    const warnThresholdMb = CONTAINER_LIMIT_MB * warnRatio;
    logger_1.default.info(`[SYSTEM_MONITOR] Settings resolved: limit=${CONTAINER_LIMIT_MB}MB ` +
        `ratio=${warnRatio} threshold=${warnThresholdMb.toFixed(2)}MB interval=30000ms role=${role}`);
    setInterval(() => {
        const mem = process.memoryUsage();
        const heapUsedMB = (mem.heapUsed / 1024 / 1024).toFixed(2);
        const rssMB = (mem.rss / 1024 / 1024).toFixed(2);
        const heapUsed = parseFloat(heapUsedMB);
        if (heapUsed > warnThresholdMb) {
            logger_1.default.warn(`[SYSTEM_MONITOR] High Memory Pressure: Heap ${heapUsedMB}MB / RSS ${rssMB}MB ` +
                `(threshold ${warnThresholdMb.toFixed(2)}MB; limit ${CONTAINER_LIMIT_MB}MB, ratio ${warnRatio})`);
        }
        else {
            // Optional debug level logging for normal operation
            logger_1.default.debug(`[SYSTEM_MONITOR] Memory: Heap ${heapUsedMB}MB / RSS ${rssMB}MB`);
        }
    }, 30000);
};
exports.startSystemMonitor = startSystemMonitor;
//# sourceMappingURL=systemMonitor.js.map