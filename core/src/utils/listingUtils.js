"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toImageUrls = exports.normalizeImageTokens = void 0;
const s3_1 = require("./s3");
/**
 * Normalizes an array of image tokens (strings).
 */
const normalizeImageTokens = (value) => {
    if (!Array.isArray(value))
        return [];
    return value
        .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
        .filter((entry) => entry.length > 0);
};
exports.normalizeImageTokens = normalizeImageTokens;
/**
 * Converts image objects (with url/hash) to an array of sanitized URLs.
 */
const toImageUrls = (value) => (0, s3_1.sanitizeStoredImageUrls)(value.map((item) => item.url));
exports.toImageUrls = toImageUrls;
//# sourceMappingURL=listingUtils.js.map