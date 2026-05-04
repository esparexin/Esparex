"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publishedBusinessStatusQuery = exports.isBusinessPublishedStatus = exports.normalizeBusinessStatus = void 0;
const businessStatus_1 = require("@core/constants/enums/businessStatus");
/**
 * Legacy compatibility:
 * historical records may still contain "active" or "approved".
 * Canonical published state is "live".
 */
const normalizeBusinessStatus = (status) => {
    if (typeof status !== "string")
        return "none";
    const normalized = status.toLowerCase();
    if (normalized === "active" || normalized === "approved")
        return businessStatus_1.BUSINESS_STATUS.LIVE;
    const validStatuses = Object.values(businessStatus_1.BUSINESS_STATUS);
    if (validStatuses.includes(normalized)) {
        return normalized;
    }
    return "none";
};
exports.normalizeBusinessStatus = normalizeBusinessStatus;
const isBusinessPublishedStatus = (status) => (0, exports.normalizeBusinessStatus)(status) === businessStatus_1.BUSINESS_STATUS.LIVE;
exports.isBusinessPublishedStatus = isBusinessPublishedStatus;
/**
 * Canonical published-status query.
 */
exports.publishedBusinessStatusQuery = businessStatus_1.BUSINESS_STATUS.LIVE;
//# sourceMappingURL=businessStatus.js.map