"use strict";
/**
 * Listing Type Enum — Global SSOT for marketplace entity classification.
 * Values are lowercase strings that match DB field values exactly.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LISTING_TYPE_VALUES = exports.LISTING_TYPE = void 0;
exports.LISTING_TYPE = {
    AD: 'ad',
    SERVICE: 'service',
    SPARE_PART: 'spare_part',
};
/** Tuple of all valid listing type values — use with z.enum() */
exports.LISTING_TYPE_VALUES = Object.values(exports.LISTING_TYPE);
//# sourceMappingURL=listingType.js.map