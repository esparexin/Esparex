/**
 * User Validation Schemas
 * 
 * Zod schemas for validating user-related requests
 * 
 * @module validators/user.validator
 */

import { z } from 'zod';
import { commonSchemas, sanitizeString } from '../middleware/validateRequest';
import { ROLE_VALUES } from '../../../shared/enums/roles';
import { USER_STATUS } from '../../../shared/enums/userStatus';
import { MOBILE_VISIBILITY_VALUES } from '../../../shared/constants/mobileVisibility';

/**
 * User role enum
 */
const userRoleEnum = z.enum(ROLE_VALUES);

/**
 * User status enum
 */
const userStatusEnum = z.enum([
    USER_STATUS.LIVE,
    USER_STATUS.SUSPENDED,
    USER_STATUS.BANNED,
    USER_STATUS.DELETED,
    USER_STATUS.INACTIVE,
]);

const actionableUserStatusEnum = z.enum([
    USER_STATUS.LIVE,
    USER_STATUS.SUSPENDED,
    USER_STATUS.BANNED,
]);

/**
 * Mobile visibility enum
 */
const mobileVisibilityEnum = z.enum(MOBILE_VISIBILITY_VALUES as [string, ...string[]]);
// VALIDATION SSOT NOTE:
// This schema mirrors shared/schemas/coordinates.schema.ts.
// Direct import avoided due to Zod instance boundary across monorepo packages.
// Behavior matches the canonical SSOT (lng-first, isFinite, bounds-checked).
const geoJsonPointSchema = z.object({
    type: z.literal('Point'),
    coordinates: z
        .tuple([
            z.number().min(-180).max(180).refine(Number.isFinite, 'Longitude must be a finite number'),
            z.number().min(-90).max(90).refine(Number.isFinite, 'Latitude must be a finite number'),
        ])
        .refine(
            ([lng, lat]) => !(lng === 0 && lat === 0),
            'Coordinates [0,0] are not allowed'
        ),
}).strict();

/**
 * Register User Schema (OTP-based)
 */
export const registerUserSchema = z.object({
    mobile: commonSchemas.mobile,
    name: sanitizeString(2, 100).optional(),
    email: commonSchemas.email.optional(),
}).strict();

/**
 * Update User Profile Schema
 */
/**
 * Update User Profile Schema
 */
export const updateUserProfileSchema = z.object({
    name: sanitizeString(2, 50).optional(),
    email: commonSchemas.email.optional(),

    // Mobile (Frontend often sends phone/mobile)
    phone: z.string().optional(),
    mobile: z.string().optional(),

    // Profile Photo (Controller expects profilePhoto, maps to avatar)
    profilePhoto: z.string().url("Invalid profile photo URL").optional(),
    avatar: z.string().url().optional(), // Support both just in case

    mobileVisibility: mobileVisibilityEnum.optional(),

    notificationSettings: z.preprocess((val) => {
        if (typeof val === 'string') {
            try { return JSON.parse(val); } catch { return val; }
        }
        return val;
    }, z.object({
        newMessages: z.boolean().optional(),
        adUpdates: z.boolean().optional(),
        promotions: z.boolean().optional(),
        emailNotifications: z.boolean().optional(),
        pushNotifications: z.boolean().optional(),
        dailyDigest: z.boolean().optional(),
        instantAlerts: z.boolean().optional(),
        email: z.boolean().optional(),
        sms: z.boolean().optional(),
        push: z.boolean().optional(),
        marketing: z.boolean().optional()
    })).optional(),

    // Location
    locationId: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    coordinates: geoJsonPointSchema.optional(),
    id: z.string().optional()
});

/**
 * Get Users Query Schema (Admin)
 */
export const getUsersQuerySchema = commonSchemas.pagination.extend({
    ...commonSchemas.sort.shape,
    ...commonSchemas.search.shape,

    role: userRoleEnum.optional(),
    status: userStatusEnum.optional(),
    isVerified: z.string().transform(val => val === 'true').optional(),
    isPhoneVerified: z.string().transform(val => val === 'true').optional(),
    isEmailVerified: z.string().transform(val => val === 'true').optional(),

    minTrustScore: z.string().transform(Number).pipe(z.number().min(0).max(100)).optional(),
    maxTrustScore: z.string().transform(Number).pipe(z.number().min(0).max(100)).optional(),
});

/**
 * User ID Param Schema
 */
export const userIdParamSchema = z.object({
    id: commonSchemas.objectId,
});

/**
 * Update User Status Schema (Admin)
 */
export const updateUserStatusSchema = z.object({
    status: actionableUserStatusEnum,
    reason: sanitizeString(undefined, 500).optional(),
}).strict();

export const updateUserVerificationSchema = z.object({
    isVerified: z.boolean(),
}).strict();

/**
 * Update Trust Score Schema (Admin)
 */
export const updateTrustScoreSchema = z.object({
    trustScore: z.number().int().min(0).max(100),
    reason: sanitizeString(undefined, 500).optional(),
}).strict();

/**
 * Add Admin Badge Schema
 */
export const addAdminBadgeSchema = z.object({
    badge: z.enum(['TRUSTED_SELLER', 'HIGH_RISK', 'MONITORING', 'BLACKLISTED']),
    reason: sanitizeString(undefined, 500).optional(),
}).strict();

/**
 * Register FCM Token Schema
 */
export const registerFcmTokenSchema = z.object({
    token: z.string().min(10),
    platform: z.enum(['web', 'android', 'ios']).default('web'),
}).strict();

/**
 * Delete Account Schema
 */
export const deleteAccountSchema = z.object({
    reason: z.enum([
        'not_useful',
        'privacy_concerns',
        'too_many_emails',
        'found_alternative',
        'other'
    ]),
    feedback: sanitizeString(undefined, 500).optional(),
}).strict();

export default {
    registerUserSchema,
    updateUserProfileSchema,
    getUsersQuerySchema,
    userIdParamSchema,
    updateUserStatusSchema,
    updateUserVerificationSchema,
    updateTrustScoreSchema,
    addAdminBadgeSchema,
    registerFcmTokenSchema,
    deleteAccountSchema,
};
