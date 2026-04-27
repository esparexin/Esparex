"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SERVICE_STATUS_VALUES = exports.SERVICE_STATUS = void 0;
const lifecycle_1 = require("./lifecycle");
/**
 * Service Status Enum — Unified Reference
 * Applied to: Services
 */
exports.SERVICE_STATUS = {
    PENDING: lifecycle_1.LIFECYCLE_STATUS.PENDING,
    LIVE: lifecycle_1.LIFECYCLE_STATUS.LIVE,
    REJECTED: lifecycle_1.LIFECYCLE_STATUS.REJECTED,
    EXPIRED: lifecycle_1.LIFECYCLE_STATUS.EXPIRED,
    DEACTIVATED: lifecycle_1.LIFECYCLE_STATUS.DEACTIVATED,
};
/** Tuple of all valid service status values */
exports.SERVICE_STATUS_VALUES = Object.values(exports.SERVICE_STATUS);
//# sourceMappingURL=serviceStatus.js.map