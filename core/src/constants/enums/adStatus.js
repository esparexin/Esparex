"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AD_DISPLAY_STATUS_VALUES = exports.AD_DISPLAY_STATUSES = exports.AD_STATUS_VALUES = exports.AD_STATUS = void 0;
const listingStatus_1 = require("./listingStatus");
const lifecycle_1 = require("./lifecycle");
/**
 * @deprecated Use LISTING_STATUS from ./listingStatus instead.
 * Ad Status Enum — Unified Reference
 */
exports.AD_STATUS = listingStatus_1.LISTING_STATUS;
/** Tuple of all lifecycle status values (includes admin-only: deleted, suspended, banned, inactive) */
exports.AD_STATUS_VALUES = Object.values(exports.AD_STATUS);
/**
 * Display-facing ad statuses — the 6 states visible to users and schemas.
 * Use this with z.enum() in Zod schemas instead of hardcoding string literals.
 * Excludes admin-only lifecycle states (deleted, suspended, banned, inactive).
 */
exports.AD_DISPLAY_STATUSES = [
    lifecycle_1.LIFECYCLE_STATUS.LIVE,
    lifecycle_1.LIFECYCLE_STATUS.PENDING,
    lifecycle_1.LIFECYCLE_STATUS.SOLD,
    lifecycle_1.LIFECYCLE_STATUS.EXPIRED,
    lifecycle_1.LIFECYCLE_STATUS.REJECTED,
    lifecycle_1.LIFECYCLE_STATUS.DEACTIVATED,
];
exports.AD_DISPLAY_STATUS_VALUES = exports.AD_DISPLAY_STATUSES;
//# sourceMappingURL=adStatus.js.map