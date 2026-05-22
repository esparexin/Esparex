import { z } from 'zod';
import { commonSchemas } from './common';
import { LISTING_TYPE_VALUES } from '@esparex/shared';

const LEGACY_ADMIN_MODERATION_SEARCH_ALIAS_MESSAGE = '`search` is no longer accepted in admin listing moderation filters. Use `q` instead.';
const LEGACY_ADMIN_MODERATION_LOCATION_ALIAS_MESSAGE = '`location` is no longer accepted in admin listing moderation filters. Use `locationId` instead.';
const LEGACY_ADMIN_REPORTS_SEARCH_ALIAS_MESSAGE = '`search` is no longer accepted in admin report filters. Use `q` instead.';

const hasOwn = (value: unknown, key: string): boolean =>
    Boolean(value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, key));

const rejectLegacyAdminModerationAliases = (raw: unknown) => {
    const issues = [
        hasOwn(raw, 'search')
            ? {
                code: z.ZodIssueCode.custom,
                path: ['search'],
                message: LEGACY_ADMIN_MODERATION_SEARCH_ALIAS_MESSAGE,
            }
            : null,
        hasOwn(raw, 'location')
            ? {
                code: z.ZodIssueCode.custom,
                path: ['location'],
                message: LEGACY_ADMIN_MODERATION_LOCATION_ALIAS_MESSAGE,
            }
            : null,
    ].filter((issue): issue is NonNullable<typeof issue> => Boolean(issue));

    if (issues.length === 0) return;
    throw new z.ZodError(issues);
};

const moderationListingTypeEnum = z.enum(LISTING_TYPE_VALUES);

const adminModerationListingsQuerySchemaBase = commonSchemas.pagination.extend({
    ...commonSchemas.search.shape,
    status: z.string().trim().min(1).max(50).optional(),
    sellerId: commonSchemas.objectId.optional(),
    categoryId: commonSchemas.objectId.optional(),
    brandId: commonSchemas.objectId.optional(),
    modelId: commonSchemas.objectId.optional(),
    locationId: commonSchemas.objectId.optional(),
    createdAfter: z.string().datetime().optional(),
    createdBefore: z.string().datetime().optional(),
    listingType: moderationListingTypeEnum.optional(),
    sortBy: z.enum(['newest', 'oldest', 'price_high', 'price_low', 'most_viewed', 'risk_desc']).optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
}).strict();

export const adminModerationListingsQuerySchema = z.preprocess((raw) => {
    rejectLegacyAdminModerationAliases(raw);
    return raw;
}, adminModerationListingsQuerySchemaBase);

const rejectLegacyAdminReportAliases = (raw: unknown) => {
    if (!hasOwn(raw, 'search')) return;

    throw new z.ZodError([
        {
            code: z.ZodIssueCode.custom,
            path: ['search'],
            message: LEGACY_ADMIN_REPORTS_SEARCH_ALIAS_MESSAGE,
        },
    ]);
};

const adminReportedAdsQuerySchemaBase = commonSchemas.pagination.extend({
    ...commonSchemas.search.shape,
    status: z.string().trim().min(1).max(50).optional(),
    reason: z.string().trim().min(1).max(120).optional(),
}).strict();

export const adminReportedAdsQuerySchema = z.preprocess((raw) => {
    rejectLegacyAdminReportAliases(raw);
    return raw;
}, adminReportedAdsQuerySchemaBase);
