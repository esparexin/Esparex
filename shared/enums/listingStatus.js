"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LISTING_DISPLAY_STATUS_VALUES = exports.LISTING_STATUS_VALUES = exports.LISTING_DISPLAY_STATUSES = exports.LISTING_STATUS = void 0;
const lifecycle_1 = require("./lifecycle");
/**
 * Unified Listing Status Enum (SSOT)
 * Supersedes AD_STATUS, SERVICE_STATUS, and SPARE_PART_STATUS.
 * Alignment: PR #36 Canonical Refactor
 */
exports.LISTING_STATUS = lifecycle_1.LIFECYCLE_STATUS;
/**
 * Public/Display facing statuses for listings
 */
exports.LISTING_DISPLAY_STATUSES = [
    exports.LISTING_STATUS.LIVE,
    exports.LISTING_STATUS.PENDING,
    exports.LISTING_STATUS.SOLD,
    exports.LISTING_STATUS.EXPIRED,
    exports.LISTING_STATUS.REJECTED,
    exports.LISTING_STATUS.DEACTIVATED,
];
exports.LISTING_STATUS_VALUES = Object.values(exports.LISTING_STATUS);
exports.LISTING_DISPLAY_STATUS_VALUES = exports.LISTING_DISPLAY_STATUSES;
//# sourceMappingURL=listingStatus.js.map