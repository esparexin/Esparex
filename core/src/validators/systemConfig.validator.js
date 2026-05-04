"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.systemConfigUpdateSchema = void 0;
const zod_1 = require("zod");
const optionalString = zod_1.z.string().trim().optional();
const optionalUrl = zod_1.z.string().trim().url().optional();
const optionalBoolean = zod_1.z.boolean().optional();
const optionalPositiveInt = zod_1.z.number().int().min(1).optional();
const optionalNonNegativeInt = zod_1.z.number().int().min(0).optional();
const moderationThresholdsSchema = zod_1.z.object({
    scamDetection: zod_1.z.number().min(0).max(100).optional(),
    inappropriateContent: zod_1.z.number().min(0).max(100).optional(),
    spamDetection: zod_1.z.number().min(0).max(100).optional(),
    counterfeits: zod_1.z.number().min(0).max(100).optional(),
    prohibitedItems: zod_1.z.number().min(0).max(100).optional(),
}).strict();
const aiSectionSchema = zod_1.z.object({
    moderation: zod_1.z.object({
        enabled: optionalBoolean,
        autoFlag: optionalBoolean,
        autoBlock: optionalBoolean,
        confidenceThreshold: zod_1.z.number().min(0).max(100).optional(),
        reportAutoHideThreshold: optionalPositiveInt,
        thresholds: moderationThresholdsSchema.optional(),
    }).strict().optional(),
    seo: zod_1.z.object({
        enableTitleSEO: optionalBoolean,
        enableDescriptionSEO: optionalBoolean,
        titleProvider: zod_1.z.enum(['openai', 'local', 'custom']).optional(),
        descriptionProvider: zod_1.z.enum(['openai', 'local', 'custom']).optional(),
        openaiApiKey: optionalString,
        customApiEndpoint: optionalUrl,
        model: optionalString,
        temperature: zod_1.z.number().min(0).max(2).optional(),
        maxTokens: zod_1.z.number().int().min(1).max(4000).optional(),
    }).strict().optional(),
}).strict();
const platformSectionSchema = zod_1.z.object({
    maintenance: zod_1.z.object({
        enabled: optionalBoolean,
        message: optionalString,
        allowedIps: zod_1.z.array(zod_1.z.string().trim()).optional(),
        scheduledEnd: zod_1.z.coerce.date().optional(),
        bypassToken: optionalString,
    }).strict().optional(),
    branding: zod_1.z.object({
        platformName: optionalString,
        tagline: optionalString,
        primaryColor: optionalString,
        secondaryColor: optionalString,
        logoUrl: optionalUrl,
        faviconUrl: optionalUrl,
    }).strict().optional(),
}).strict();
const securitySectionSchema = zod_1.z.object({
    twoFactor: zod_1.z.object({
        enabled: optionalBoolean,
        issuer: optionalString,
    }).strict().optional(),
    sessionTimeoutMinutes: zod_1.z.number().int().min(5).max(24 * 60).optional(),
    maxLoginAttempts: zod_1.z.number().int().min(1).max(25).optional(),
    ipWhitelist: zod_1.z.array(zod_1.z.string().trim()).optional(),
}).strict();
const notificationsSectionSchema = zod_1.z.object({
    email: zod_1.z.object({
        enabled: optionalBoolean,
        provider: zod_1.z.enum(['smtp', 'sendgrid', 'aws-ses']).optional(),
        senderName: optionalString,
        senderEmail: zod_1.z.string().trim().email().optional(),
        host: optionalString,
        port: zod_1.z.number().int().min(1).max(65535).optional(),
        username: optionalString,
        password: optionalString,
        encryption: zod_1.z.enum(['none', 'ssl', 'tls']).optional(),
    }).strict().optional(),
    push: zod_1.z.object({
        enabled: optionalBoolean,
        provider: zod_1.z.enum(['firebase', 'onesignal']).optional(),
    }).strict().optional(),
}).strict();
const locationSectionSchema = zod_1.z.object({
    defaultSearchRadius: optionalPositiveInt,
    maxSearchRadius: optionalPositiveInt,
    enableAutoComplete: optionalBoolean,
    autoCompleteMinChars: zod_1.z.number().int().min(1).max(10).optional(),
    enableNearbySearch: optionalBoolean,
    enableReverseGeocoding: optionalBoolean,
    distanceUnit: zod_1.z.enum(['km', 'miles']).optional(),
}).strict();
const integrationsSectionSchema = zod_1.z.object({
    payment: zod_1.z.object({
        razorpay: zod_1.z.object({
            enabled: optionalBoolean,
            keyId: optionalString,
            keySecret: optionalString,
        }).strict().optional(),
        stripe: zod_1.z.object({
            enabled: optionalBoolean,
            publishableKey: optionalString,
            secretKey: optionalString,
        }).strict().optional(),
    }).strict().optional(),
}).strict();
const listingSectionSchema = zod_1.z.object({
    expiryDays: zod_1.z.object({
        ad: optionalPositiveInt,
        service: optionalPositiveInt,
        spare_part: optionalPositiveInt,
    }).strict().optional(),
    thresholds: zod_1.z.object({
        proSparePartLimit: optionalNonNegativeInt,
    }).strict().optional(),
}).strict();
exports.systemConfigUpdateSchema = zod_1.z.object({
    ai: aiSectionSchema.optional(),
    platform: platformSectionSchema.optional(),
    security: securitySectionSchema.optional(),
    notifications: notificationsSectionSchema.optional(),
    location: locationSectionSchema.optional(),
    integrations: integrationsSectionSchema.optional(),
    listing: listingSectionSchema.optional(),
    emailTemplates: zod_1.z.array(zod_1.z.unknown()).optional(),
    notificationTemplates: zod_1.z.array(zod_1.z.unknown()).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, {
    message: 'At least one config section is required',
});
//# sourceMappingURL=systemConfig.validator.js.map