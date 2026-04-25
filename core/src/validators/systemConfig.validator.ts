import { z } from 'zod';

const optionalString = z.string().trim().optional();
const optionalUrl = z.string().trim().url().optional();
const optionalBoolean = z.boolean().optional();
const optionalPositiveInt = z.number().int().min(1).optional();
const optionalNonNegativeInt = z.number().int().min(0).optional();

const moderationThresholdsSchema = z.object({
    scamDetection: z.number().min(0).max(100).optional(),
    inappropriateContent: z.number().min(0).max(100).optional(),
    spamDetection: z.number().min(0).max(100).optional(),
    counterfeits: z.number().min(0).max(100).optional(),
    prohibitedItems: z.number().min(0).max(100).optional(),
}).strict();

const aiSectionSchema = z.object({
    moderation: z.object({
        enabled: optionalBoolean,
        autoFlag: optionalBoolean,
        autoBlock: optionalBoolean,
        confidenceThreshold: z.number().min(0).max(100).optional(),
        reportAutoHideThreshold: optionalPositiveInt,
        thresholds: moderationThresholdsSchema.optional(),
    }).strict().optional(),
    seo: z.object({
        enableTitleSEO: optionalBoolean,
        enableDescriptionSEO: optionalBoolean,
        titleProvider: z.enum(['openai', 'local', 'custom']).optional(),
        descriptionProvider: z.enum(['openai', 'local', 'custom']).optional(),
        openaiApiKey: optionalString,
        customApiEndpoint: optionalUrl,
        model: optionalString,
        temperature: z.number().min(0).max(2).optional(),
        maxTokens: z.number().int().min(1).max(4000).optional(),
    }).strict().optional(),
}).strict();

const platformSectionSchema = z.object({
    maintenance: z.object({
        enabled: optionalBoolean,
        message: optionalString,
        allowedIps: z.array(z.string().trim()).optional(),
        scheduledEnd: z.coerce.date().optional(),
        bypassToken: optionalString,
    }).strict().optional(),
    branding: z.object({
        platformName: optionalString,
        tagline: optionalString,
        primaryColor: optionalString,
        secondaryColor: optionalString,
        logoUrl: optionalUrl,
        faviconUrl: optionalUrl,
    }).strict().optional(),
}).strict();

const securitySectionSchema = z.object({
    twoFactor: z.object({
        enabled: optionalBoolean,
        issuer: optionalString,
    }).strict().optional(),
    sessionTimeoutMinutes: z.number().int().min(5).max(24 * 60).optional(),
    maxLoginAttempts: z.number().int().min(1).max(25).optional(),
    ipWhitelist: z.array(z.string().trim()).optional(),
}).strict();

const notificationsSectionSchema = z.object({
    email: z.object({
        enabled: optionalBoolean,
        provider: z.enum(['smtp', 'sendgrid', 'aws-ses']).optional(),
        senderName: optionalString,
        senderEmail: z.string().trim().email().optional(),
        host: optionalString,
        port: z.number().int().min(1).max(65535).optional(),
        username: optionalString,
        password: optionalString,
        encryption: z.enum(['none', 'ssl', 'tls']).optional(),
    }).strict().optional(),
    push: z.object({
        enabled: optionalBoolean,
        provider: z.enum(['firebase', 'onesignal']).optional(),
    }).strict().optional(),
}).strict();

const locationSectionSchema = z.object({
    defaultSearchRadius: optionalPositiveInt,
    maxSearchRadius: optionalPositiveInt,
    enableAutoComplete: optionalBoolean,
    autoCompleteMinChars: z.number().int().min(1).max(10).optional(),
    enableNearbySearch: optionalBoolean,
    enableReverseGeocoding: optionalBoolean,
    distanceUnit: z.enum(['km', 'miles']).optional(),
}).strict();

const integrationsSectionSchema = z.object({
    payment: z.object({
        razorpay: z.object({
            enabled: optionalBoolean,
            keyId: optionalString,
            keySecret: optionalString,
        }).strict().optional(),
        stripe: z.object({
            enabled: optionalBoolean,
            publishableKey: optionalString,
            secretKey: optionalString,
        }).strict().optional(),
    }).strict().optional(),
}).strict();

const listingSectionSchema = z.object({
    expiryDays: z.object({
        ad: optionalPositiveInt,
        service: optionalPositiveInt,
        spare_part: optionalPositiveInt,
    }).strict().optional(),
    thresholds: z.object({
        proSparePartLimit: optionalNonNegativeInt,
    }).strict().optional(),
}).strict();

export const systemConfigUpdateSchema = z.object({
    ai: aiSectionSchema.optional(),
    platform: platformSectionSchema.optional(),
    security: securitySectionSchema.optional(),
    notifications: notificationsSectionSchema.optional(),
    location: locationSectionSchema.optional(),
    integrations: integrationsSectionSchema.optional(),
    listing: listingSectionSchema.optional(),
    emailTemplates: z.array(z.unknown()).optional(),
    notificationTemplates: z.array(z.unknown()).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, {
    message: 'At least one config section is required',
});
