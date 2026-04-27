"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CATALOG_STATUS_VALUES = exports.CATALOG_STATUS = void 0;
const lifecycle_1 = require("./lifecycle");
/**
 * Catalog Status Enum (Brands/Models/Categories)
 */
exports.CATALOG_STATUS = {
    PENDING: lifecycle_1.LIFECYCLE_STATUS.PENDING,
    LIVE: lifecycle_1.LIFECYCLE_STATUS.LIVE,
    REJECTED: lifecycle_1.LIFECYCLE_STATUS.REJECTED,
    INACTIVE: lifecycle_1.LIFECYCLE_STATUS.INACTIVE,
    // Legacy mapping
    ACTIVE: lifecycle_1.LIFECYCLE_STATUS.LIVE,
};
exports.CATALOG_STATUS_VALUES = Object.values(exports.CATALOG_STATUS);
//# sourceMappingURL=catalogStatus.js.map