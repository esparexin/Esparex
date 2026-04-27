"use strict";
/**
 * Saved Ad Validation Schemas
 *
 * Zod schemas for validating saved ad requests
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSavedAdsQuerySchema = exports.savedAdParamSchema = exports.saveAdSchema = void 0;
const zod_1 = require("zod");
const common_1 = require("./common");
/**
 * Save Ad Schema (Body)
 */
exports.saveAdSchema = zod_1.z.object({
    adId: common_1.commonSchemas.objectId,
}).strict();
/**
 * Saved Ad Param Schema
 */
exports.savedAdParamSchema = zod_1.z.object({
    adId: common_1.commonSchemas.objectId,
});
/**
 * Get Saved Ads Query Schema
 */
exports.getSavedAdsQuerySchema = common_1.commonSchemas.pagination.extend({
// Optional filters if needed later
}).strict();
//# sourceMappingURL=savedAd.validator.js.map