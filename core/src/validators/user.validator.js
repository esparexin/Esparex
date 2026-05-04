"use strict";
/**
 * User Validation Schemas
 *
 * Zod schemas for validating user-related requests
 *
 * @module validators/user.validator
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAccountSchema = exports.registerFcmTokenSchema = exports.addAdminBadgeSchema = exports.updateTrustScoreSchema = exports.updateUserVerificationSchema = exports.updateUserStatusSchema = exports.userIdParamSchema = exports.getUsersQuerySchema = exports.updateUserProfileSchema = exports.registerUserSchema = void 0;
const zod_1 = require("zod");
const common_1 = require("./common");
const roles_1 = require("@core/constants/enums/roles");
const userStatus_1 = require("@core/constants/enums/userStatus");
const mobileVisibility_1 = require("@esparex/shared/constants/mobileVisibility");
const LEGACY_ADMIN_USERS_SEARCH_ALIAS_MESSAGE = '`search` is no longer accepted in admin user filters. Use `q` instead.';
const LEGACY_PROFILE_PHONE_ALIAS_MESSAGE = '`phone` is no longer accepted in profile updates. Mobile number changes are not supported here.';
const IMMUTABLE_PROFILE_MOBILE_MESSAGE = '`mobile` is read-only in profile updates and cannot be changed here.';
const hasOwn = (value, key) => Boolean(value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, key));
const rejectLegacyAdminUsersAliases = (raw) => {
    if (!hasOwn(raw, 'search'))
        return;
    throw new zod_1.z.ZodError([
        {
            code: zod_1.z.ZodIssueCode.custom,
            path: ['search'],
            message: LEGACY_ADMIN_USERS_SEARCH_ALIAS_MESSAGE,
        },
    ]);
};
const rejectProfileMutationAliases = (raw) => {
    const issues = [];
    if (hasOwn(raw, 'phone')) {
        issues.push({
            code: zod_1.z.ZodIssueCode.custom,
            path: ['phone'],
            message: LEGACY_PROFILE_PHONE_ALIAS_MESSAGE,
        });
    }
    if (hasOwn(raw, 'mobile')) {
        issues.push({
            code: zod_1.z.ZodIssueCode.custom,
            path: ['mobile'],
            message: IMMUTABLE_PROFILE_MOBILE_MESSAGE,
        });
    }
    if (issues.length === 0)
        return;
    throw new zod_1.z.ZodError(issues);
};
/**
 * User role enum
 */
const userRoleEnum = zod_1.z.enum(roles_1.ROLE_VALUES);
/**
 * User status enum
 */
const userStatusEnum = zod_1.z.enum([
    userStatus_1.USER_STATUS.LIVE,
    userStatus_1.USER_STATUS.SUSPENDED,
    userStatus_1.USER_STATUS.BANNED,
    userStatus_1.USER_STATUS.DELETED,
    userStatus_1.USER_STATUS.INACTIVE,
]);
const actionableUserStatusEnum = zod_1.z.enum([
    userStatus_1.USER_STATUS.LIVE,
    userStatus_1.USER_STATUS.SUSPENDED,
    userStatus_1.USER_STATUS.BANNED,
]);
/**
 * Mobile visibility enum
 */
const mobileVisibilityEnum = zod_1.z.enum(mobileVisibility_1.MOBILE_VISIBILITY_VALUES);
// VALIDATION SSOT NOTE:
// This schema mirrors shared/schemas/coordinates.schema.ts.
// Direct import avoided due to Zod instance boundary across monorepo packages.
// Behavior matches the canonical SSOT (lng-first, isFinite, bounds-checked).
const geoJsonPointSchema = zod_1.z.object({
    type: zod_1.z.literal('Point'),
    coordinates: zod_1.z
        .tuple([
        zod_1.z.number().min(-180).max(180).refine(Number.isFinite, 'Longitude must be a finite number'),
        zod_1.z.number().min(-90).max(90).refine(Number.isFinite, 'Latitude must be a finite number'),
    ])
        .refine(([lng, lat]) => !(lng === 0 && lat === 0), 'Coordinates [0,0] are not allowed'),
}).strict();
/**
 * Register User Schema (OTP-based)
 */
exports.registerUserSchema = zod_1.z.object({
    mobile: common_1.commonSchemas.mobile,
    name: (0, common_1.sanitizeString)(2, 100).optional(),
    email: common_1.commonSchemas.email.optional(),
}).strict();
/**
 * Update User Profile Schema
 */
/**
 * Update User Profile Schema
 */
const updateUserProfileSchemaBase = zod_1.z.object({
    name: (0, common_1.sanitizeString)(2, 50).optional(),
    email: common_1.commonSchemas.email.optional(),
    // Profile photo (controller maps profilePhoto to avatar)
    profilePhoto: zod_1.z.string().url("Invalid profile photo URL").optional(),
    avatar: zod_1.z.string().url().optional(), // Support both just in case
    mobileVisibility: mobileVisibilityEnum.optional(),
    notificationSettings: zod_1.z.preprocess((val) => {
        if (typeof val === 'string') {
            try {
                return JSON.parse(val);
            }
            catch {
                return val;
            }
        }
        return val;
    }, zod_1.z.object({
        newMessages: zod_1.z.boolean().optional(),
        adUpdates: zod_1.z.boolean().optional(),
        promotions: zod_1.z.boolean().optional(),
        emailNotifications: zod_1.z.boolean().optional(),
        pushNotifications: zod_1.z.boolean().optional(),
        dailyDigest: zod_1.z.boolean().optional(),
        instantAlerts: zod_1.z.boolean().optional(),
        email: zod_1.z.boolean().optional(),
        sms: zod_1.z.boolean().optional(),
        push: zod_1.z.boolean().optional(),
        marketing: zod_1.z.boolean().optional()
    })).optional(),
    // Location
    locationId: zod_1.z.string().optional(),
    city: zod_1.z.string().optional(),
    state: zod_1.z.string().optional(),
    coordinates: geoJsonPointSchema.optional(),
    id: zod_1.z.string().optional()
});
exports.updateUserProfileSchema = zod_1.z.preprocess((raw) => {
    rejectProfileMutationAliases(raw);
    return raw;
}, updateUserProfileSchemaBase);
/**
 * Get Users Query Schema (Admin)
 */
const getUsersQuerySchemaBase = common_1.commonSchemas.pagination.extend({
    ...common_1.commonSchemas.sort.shape,
    ...common_1.commonSchemas.search.shape,
    role: userRoleEnum.optional(),
    status: userStatusEnum.optional(),
    isVerified: zod_1.z.string().transform(val => val === 'true').optional(),
    isPhoneVerified: zod_1.z.string().transform(val => val === 'true').optional(),
    isEmailVerified: zod_1.z.string().transform(val => val === 'true').optional(),
    minTrustScore: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(0).max(100)).optional(),
    maxTrustScore: zod_1.z.string().transform(Number).pipe(zod_1.z.number().min(0).max(100)).optional(),
});
exports.getUsersQuerySchema = zod_1.z.preprocess((raw) => {
    rejectLegacyAdminUsersAliases(raw);
    return raw;
}, getUsersQuerySchemaBase);
/**
 * User ID Param Schema
 */
exports.userIdParamSchema = zod_1.z.object({
    id: common_1.commonSchemas.objectId,
});
/**
 * Update User Status Schema (Admin)
 */
exports.updateUserStatusSchema = zod_1.z.object({
    status: actionableUserStatusEnum,
    reason: (0, common_1.sanitizeString)(undefined, 500).optional(),
}).strict();
exports.updateUserVerificationSchema = zod_1.z.object({
    isVerified: zod_1.z.boolean(),
}).strict();
/**
 * Update Trust Score Schema (Admin)
 */
exports.updateTrustScoreSchema = zod_1.z.object({
    trustScore: zod_1.z.number().int().min(0).max(100),
    reason: (0, common_1.sanitizeString)(undefined, 500).optional(),
}).strict();
/**
 * Add Admin Badge Schema
 */
exports.addAdminBadgeSchema = zod_1.z.object({
    badge: zod_1.z.enum(['TRUSTED_SELLER', 'HIGH_RISK', 'MONITORING', 'BLACKLISTED']),
    reason: (0, common_1.sanitizeString)(undefined, 500).optional(),
}).strict();
/**
 * Register FCM Token Schema
 */
exports.registerFcmTokenSchema = zod_1.z.object({
    token: zod_1.z.string().min(10),
    platform: zod_1.z.enum(['web', 'android', 'ios']).default('web'),
}).strict();
/**
 * Delete Account Schema
 */
exports.deleteAccountSchema = zod_1.z.object({
    reason: zod_1.z.enum([
        'not_useful',
        'privacy_concerns',
        'too_many_emails',
        'found_alternative',
        'other'
    ]),
    feedback: (0, common_1.sanitizeString)(undefined, 500).optional(),
}).strict();
exports.default = {
    registerUserSchema: exports.registerUserSchema,
    updateUserProfileSchema: exports.updateUserProfileSchema,
    getUsersQuerySchema: exports.getUsersQuerySchema,
    userIdParamSchema: exports.userIdParamSchema,
    updateUserStatusSchema: exports.updateUserStatusSchema,
    updateUserVerificationSchema: exports.updateUserVerificationSchema,
    updateTrustScoreSchema: exports.updateTrustScoreSchema,
    addAdminBadgeSchema: exports.addAdminBadgeSchema,
    registerFcmTokenSchema: exports.registerFcmTokenSchema,
    deleteAccountSchema: exports.deleteAccountSchema,
};
//# sourceMappingURL=user.validator.js.map