"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminReportedAdsQuerySchema = exports.adminModerationListingsQuerySchema = void 0;
const zod_1 = require("zod");
const common_1 = require("./common");
const listingType_1 = require("@core/constants/enums/listingType");
const LEGACY_ADMIN_MODERATION_SEARCH_ALIAS_MESSAGE = '`search` is no longer accepted in admin listing moderation filters. Use `q` instead.';
const LEGACY_ADMIN_MODERATION_LOCATION_ALIAS_MESSAGE = '`location` is no longer accepted in admin listing moderation filters. Use `locationId` instead.';
const LEGACY_ADMIN_REPORTS_SEARCH_ALIAS_MESSAGE = '`search` is no longer accepted in admin report filters. Use `q` instead.';
const hasOwn = (value, key) => Boolean(value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, key));
const rejectLegacyAdminModerationAliases = (raw) => {
    const issues = [
        hasOwn(raw, 'search')
            ? {
                code: zod_1.z.ZodIssueCode.custom,
                path: ['search'],
                message: LEGACY_ADMIN_MODERATION_SEARCH_ALIAS_MESSAGE,
            }
            : null,
        hasOwn(raw, 'location')
            ? {
                code: zod_1.z.ZodIssueCode.custom,
                path: ['location'],
                message: LEGACY_ADMIN_MODERATION_LOCATION_ALIAS_MESSAGE,
            }
            : null,
    ].filter((issue) => Boolean(issue));
    if (issues.length === 0)
        return;
    throw new zod_1.z.ZodError(issues);
};
const moderationListingTypeEnum = zod_1.z.enum(listingType_1.LISTING_TYPE_VALUES);
const adminModerationListingsQuerySchemaBase = common_1.commonSchemas.pagination.extend({
    ...common_1.commonSchemas.search.shape,
    status: zod_1.z.string().trim().min(1).max(50).optional(),
    sellerId: common_1.commonSchemas.objectId.optional(),
    categoryId: common_1.commonSchemas.objectId.optional(),
    brandId: common_1.commonSchemas.objectId.optional(),
    modelId: common_1.commonSchemas.objectId.optional(),
    locationId: common_1.commonSchemas.objectId.optional(),
    createdAfter: zod_1.z.string().datetime().optional(),
    createdBefore: zod_1.z.string().datetime().optional(),
    listingType: moderationListingTypeEnum.optional(),
    sortBy: zod_1.z.enum(['newest', 'oldest', 'price_high', 'price_low', 'most_viewed', 'risk_desc']).optional(),
    minPrice: zod_1.z.coerce.number().min(0).optional(),
    maxPrice: zod_1.z.coerce.number().min(0).optional(),
}).strict();
exports.adminModerationListingsQuerySchema = zod_1.z.preprocess((raw) => {
    rejectLegacyAdminModerationAliases(raw);
    return raw;
}, adminModerationListingsQuerySchemaBase);
const rejectLegacyAdminReportAliases = (raw) => {
    if (!hasOwn(raw, 'search'))
        return;
    throw new zod_1.z.ZodError([
        {
            code: zod_1.z.ZodIssueCode.custom,
            path: ['search'],
            message: LEGACY_ADMIN_REPORTS_SEARCH_ALIAS_MESSAGE,
        },
    ]);
};
const adminReportedAdsQuerySchemaBase = common_1.commonSchemas.pagination.extend({
    ...common_1.commonSchemas.search.shape,
    status: zod_1.z.string().trim().min(1).max(50).optional(),
    reason: zod_1.z.string().trim().min(1).max(120).optional(),
}).strict();
exports.adminReportedAdsQuerySchema = zod_1.z.preprocess((raw) => {
    rejectLegacyAdminReportAliases(raw);
    return raw;
}, adminReportedAdsQuerySchemaBase);
//# sourceMappingURL=adminModeration.validator.js.map