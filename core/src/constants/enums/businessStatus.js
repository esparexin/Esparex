"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BUSINESS_STATUS_VALUES = exports.BUSINESS_STATUS = void 0;
const lifecycle_1 = require("./lifecycle");
/**
 * Business Status Enum — Single Source of Truth
 */
exports.BUSINESS_STATUS = {
    PENDING: lifecycle_1.LIFECYCLE_STATUS.PENDING,
    LIVE: lifecycle_1.LIFECYCLE_STATUS.LIVE,
    REJECTED: lifecycle_1.LIFECYCLE_STATUS.REJECTED,
    SUSPENDED: lifecycle_1.LIFECYCLE_STATUS.SUSPENDED,
    DELETED: lifecycle_1.LIFECYCLE_STATUS.DELETED,
    // Legacy mapping (remove after migration)
    APPROVED: lifecycle_1.LIFECYCLE_STATUS.LIVE,
    ACTIVE: lifecycle_1.LIFECYCLE_STATUS.LIVE,
};
/** Tuple of all valid business status values */
exports.BUSINESS_STATUS_VALUES = Object.values(exports.BUSINESS_STATUS);
//# sourceMappingURL=businessStatus.js.map