/**
 * Plan Payload Schema — shared validation for admin plan create/update API.
 *
 * This schema validates the NESTED payload shape that the admin frontend sends
 * (after formToPayload() transforms flat form values).  It is the canonical
 * contract between the admin UI and the plan CRUD controllers.
 *
 * Plan model structure is mirrored here:
 *   limits.{ maxAds, maxServices, maxParts, smartAlerts, spotlightCredits }
 *   features.{ priorityWeight, businessBadge, canEditAd, showOnHomePage }
 *   smartAlertConfig.{ maxAlerts, matchFrequency, radiusLimitKm, notificationChannels }
 */
import { z } from 'zod';
export declare const BasePlanPayloadSchema: z.ZodObject<{
    code: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    type: z.ZodEnum<["AD_PACK", "SPOTLIGHT", "SMART_ALERT"]>;
    userType: z.ZodEnum<["normal", "business", "both"]>;
    price: z.ZodNumber;
    currency: z.ZodDefault<z.ZodString>;
    durationDays: z.ZodOptional<z.ZodNumber>;
    isDefault: z.ZodOptional<z.ZodBoolean>;
    active: z.ZodOptional<z.ZodBoolean>;
    limits: z.ZodOptional<z.ZodObject<{
        maxAds: z.ZodOptional<z.ZodNumber>;
        maxServices: z.ZodOptional<z.ZodNumber>;
        maxParts: z.ZodOptional<z.ZodNumber>;
        smartAlerts: z.ZodOptional<z.ZodNumber>;
        spotlightCredits: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        maxAds?: number | undefined;
        maxServices?: number | undefined;
        maxParts?: number | undefined;
        smartAlerts?: number | undefined;
        spotlightCredits?: number | undefined;
    }, {
        maxAds?: number | undefined;
        maxServices?: number | undefined;
        maxParts?: number | undefined;
        smartAlerts?: number | undefined;
        spotlightCredits?: number | undefined;
    }>>;
    features: z.ZodOptional<z.ZodObject<{
        priorityWeight: z.ZodOptional<z.ZodNumber>;
        businessBadge: z.ZodOptional<z.ZodBoolean>;
        canEditAd: z.ZodOptional<z.ZodBoolean>;
        showOnHomePage: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        priorityWeight?: number | undefined;
        businessBadge?: boolean | undefined;
        canEditAd?: boolean | undefined;
        showOnHomePage?: boolean | undefined;
    }, {
        priorityWeight?: number | undefined;
        businessBadge?: boolean | undefined;
        canEditAd?: boolean | undefined;
        showOnHomePage?: boolean | undefined;
    }>>;
    smartAlertConfig: z.ZodOptional<z.ZodObject<{
        maxAlerts: z.ZodNumber;
        matchFrequency: z.ZodEnum<["instant", "hourly", "daily"]>;
        radiusLimitKm: z.ZodNumber;
        notificationChannels: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        maxAlerts: number;
        matchFrequency: "instant" | "hourly" | "daily";
        radiusLimitKm: number;
        notificationChannels: string[];
    }, {
        maxAlerts: number;
        matchFrequency: "instant" | "hourly" | "daily";
        radiusLimitKm: number;
        notificationChannels: string[];
    }>>;
}, "strip", z.ZodTypeAny, {
    code: string;
    type: "SMART_ALERT" | "AD_PACK" | "SPOTLIGHT";
    name: string;
    userType: "business" | "normal" | "both";
    price: number;
    currency: string;
    description?: string | undefined;
    active?: boolean | undefined;
    durationDays?: number | undefined;
    isDefault?: boolean | undefined;
    limits?: {
        maxAds?: number | undefined;
        maxServices?: number | undefined;
        maxParts?: number | undefined;
        smartAlerts?: number | undefined;
        spotlightCredits?: number | undefined;
    } | undefined;
    features?: {
        priorityWeight?: number | undefined;
        businessBadge?: boolean | undefined;
        canEditAd?: boolean | undefined;
        showOnHomePage?: boolean | undefined;
    } | undefined;
    smartAlertConfig?: {
        maxAlerts: number;
        matchFrequency: "instant" | "hourly" | "daily";
        radiusLimitKm: number;
        notificationChannels: string[];
    } | undefined;
}, {
    code: string;
    type: "SMART_ALERT" | "AD_PACK" | "SPOTLIGHT";
    name: string;
    userType: "business" | "normal" | "both";
    price: number;
    description?: string | undefined;
    active?: boolean | undefined;
    currency?: string | undefined;
    durationDays?: number | undefined;
    isDefault?: boolean | undefined;
    limits?: {
        maxAds?: number | undefined;
        maxServices?: number | undefined;
        maxParts?: number | undefined;
        smartAlerts?: number | undefined;
        spotlightCredits?: number | undefined;
    } | undefined;
    features?: {
        priorityWeight?: number | undefined;
        businessBadge?: boolean | undefined;
        canEditAd?: boolean | undefined;
        showOnHomePage?: boolean | undefined;
    } | undefined;
    smartAlertConfig?: {
        maxAlerts: number;
        matchFrequency: "instant" | "hourly" | "daily";
        radiusLimitKm: number;
        notificationChannels: string[];
    } | undefined;
}>;
/** Full create schema */
export declare const PlanPayloadSchema: z.ZodObject<{
    code: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    type: z.ZodEnum<["AD_PACK", "SPOTLIGHT", "SMART_ALERT"]>;
    userType: z.ZodEnum<["normal", "business", "both"]>;
    price: z.ZodNumber;
    currency: z.ZodDefault<z.ZodString>;
    durationDays: z.ZodOptional<z.ZodNumber>;
    isDefault: z.ZodOptional<z.ZodBoolean>;
    active: z.ZodOptional<z.ZodBoolean>;
    limits: z.ZodOptional<z.ZodObject<{
        maxAds: z.ZodOptional<z.ZodNumber>;
        maxServices: z.ZodOptional<z.ZodNumber>;
        maxParts: z.ZodOptional<z.ZodNumber>;
        smartAlerts: z.ZodOptional<z.ZodNumber>;
        spotlightCredits: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        maxAds?: number | undefined;
        maxServices?: number | undefined;
        maxParts?: number | undefined;
        smartAlerts?: number | undefined;
        spotlightCredits?: number | undefined;
    }, {
        maxAds?: number | undefined;
        maxServices?: number | undefined;
        maxParts?: number | undefined;
        smartAlerts?: number | undefined;
        spotlightCredits?: number | undefined;
    }>>;
    features: z.ZodOptional<z.ZodObject<{
        priorityWeight: z.ZodOptional<z.ZodNumber>;
        businessBadge: z.ZodOptional<z.ZodBoolean>;
        canEditAd: z.ZodOptional<z.ZodBoolean>;
        showOnHomePage: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        priorityWeight?: number | undefined;
        businessBadge?: boolean | undefined;
        canEditAd?: boolean | undefined;
        showOnHomePage?: boolean | undefined;
    }, {
        priorityWeight?: number | undefined;
        businessBadge?: boolean | undefined;
        canEditAd?: boolean | undefined;
        showOnHomePage?: boolean | undefined;
    }>>;
    smartAlertConfig: z.ZodOptional<z.ZodObject<{
        maxAlerts: z.ZodNumber;
        matchFrequency: z.ZodEnum<["instant", "hourly", "daily"]>;
        radiusLimitKm: z.ZodNumber;
        notificationChannels: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        maxAlerts: number;
        matchFrequency: "instant" | "hourly" | "daily";
        radiusLimitKm: number;
        notificationChannels: string[];
    }, {
        maxAlerts: number;
        matchFrequency: "instant" | "hourly" | "daily";
        radiusLimitKm: number;
        notificationChannels: string[];
    }>>;
}, "strip", z.ZodTypeAny, {
    code: string;
    type: "SMART_ALERT" | "AD_PACK" | "SPOTLIGHT";
    name: string;
    userType: "business" | "normal" | "both";
    price: number;
    currency: string;
    description?: string | undefined;
    active?: boolean | undefined;
    durationDays?: number | undefined;
    isDefault?: boolean | undefined;
    limits?: {
        maxAds?: number | undefined;
        maxServices?: number | undefined;
        maxParts?: number | undefined;
        smartAlerts?: number | undefined;
        spotlightCredits?: number | undefined;
    } | undefined;
    features?: {
        priorityWeight?: number | undefined;
        businessBadge?: boolean | undefined;
        canEditAd?: boolean | undefined;
        showOnHomePage?: boolean | undefined;
    } | undefined;
    smartAlertConfig?: {
        maxAlerts: number;
        matchFrequency: "instant" | "hourly" | "daily";
        radiusLimitKm: number;
        notificationChannels: string[];
    } | undefined;
}, {
    code: string;
    type: "SMART_ALERT" | "AD_PACK" | "SPOTLIGHT";
    name: string;
    userType: "business" | "normal" | "both";
    price: number;
    description?: string | undefined;
    active?: boolean | undefined;
    currency?: string | undefined;
    durationDays?: number | undefined;
    isDefault?: boolean | undefined;
    limits?: {
        maxAds?: number | undefined;
        maxServices?: number | undefined;
        maxParts?: number | undefined;
        smartAlerts?: number | undefined;
        spotlightCredits?: number | undefined;
    } | undefined;
    features?: {
        priorityWeight?: number | undefined;
        businessBadge?: boolean | undefined;
        canEditAd?: boolean | undefined;
        showOnHomePage?: boolean | undefined;
    } | undefined;
    smartAlertConfig?: {
        maxAlerts: number;
        matchFrequency: "instant" | "hourly" | "daily";
        radiusLimitKm: number;
        notificationChannels: string[];
    } | undefined;
}>;
/** Partial update schema */
export declare const PartialPlanPayloadSchema: z.ZodObject<{
    code: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    type: z.ZodOptional<z.ZodEnum<["AD_PACK", "SPOTLIGHT", "SMART_ALERT"]>>;
    userType: z.ZodOptional<z.ZodEnum<["normal", "business", "both"]>>;
    price: z.ZodOptional<z.ZodNumber>;
    currency: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    durationDays: z.ZodOptional<z.ZodOptional<z.ZodNumber>>;
    isDefault: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
    active: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
    limits: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        maxAds: z.ZodOptional<z.ZodNumber>;
        maxServices: z.ZodOptional<z.ZodNumber>;
        maxParts: z.ZodOptional<z.ZodNumber>;
        smartAlerts: z.ZodOptional<z.ZodNumber>;
        spotlightCredits: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        maxAds?: number | undefined;
        maxServices?: number | undefined;
        maxParts?: number | undefined;
        smartAlerts?: number | undefined;
        spotlightCredits?: number | undefined;
    }, {
        maxAds?: number | undefined;
        maxServices?: number | undefined;
        maxParts?: number | undefined;
        smartAlerts?: number | undefined;
        spotlightCredits?: number | undefined;
    }>>>;
    features: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        priorityWeight: z.ZodOptional<z.ZodNumber>;
        businessBadge: z.ZodOptional<z.ZodBoolean>;
        canEditAd: z.ZodOptional<z.ZodBoolean>;
        showOnHomePage: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        priorityWeight?: number | undefined;
        businessBadge?: boolean | undefined;
        canEditAd?: boolean | undefined;
        showOnHomePage?: boolean | undefined;
    }, {
        priorityWeight?: number | undefined;
        businessBadge?: boolean | undefined;
        canEditAd?: boolean | undefined;
        showOnHomePage?: boolean | undefined;
    }>>>;
    smartAlertConfig: z.ZodOptional<z.ZodOptional<z.ZodObject<{
        maxAlerts: z.ZodNumber;
        matchFrequency: z.ZodEnum<["instant", "hourly", "daily"]>;
        radiusLimitKm: z.ZodNumber;
        notificationChannels: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        maxAlerts: number;
        matchFrequency: "instant" | "hourly" | "daily";
        radiusLimitKm: number;
        notificationChannels: string[];
    }, {
        maxAlerts: number;
        matchFrequency: "instant" | "hourly" | "daily";
        radiusLimitKm: number;
        notificationChannels: string[];
    }>>>;
}, "strip", z.ZodTypeAny, {
    code?: string | undefined;
    type?: "SMART_ALERT" | "AD_PACK" | "SPOTLIGHT" | undefined;
    name?: string | undefined;
    description?: string | undefined;
    userType?: "business" | "normal" | "both" | undefined;
    active?: boolean | undefined;
    price?: number | undefined;
    currency?: string | undefined;
    durationDays?: number | undefined;
    isDefault?: boolean | undefined;
    limits?: {
        maxAds?: number | undefined;
        maxServices?: number | undefined;
        maxParts?: number | undefined;
        smartAlerts?: number | undefined;
        spotlightCredits?: number | undefined;
    } | undefined;
    features?: {
        priorityWeight?: number | undefined;
        businessBadge?: boolean | undefined;
        canEditAd?: boolean | undefined;
        showOnHomePage?: boolean | undefined;
    } | undefined;
    smartAlertConfig?: {
        maxAlerts: number;
        matchFrequency: "instant" | "hourly" | "daily";
        radiusLimitKm: number;
        notificationChannels: string[];
    } | undefined;
}, {
    code?: string | undefined;
    type?: "SMART_ALERT" | "AD_PACK" | "SPOTLIGHT" | undefined;
    name?: string | undefined;
    description?: string | undefined;
    userType?: "business" | "normal" | "both" | undefined;
    active?: boolean | undefined;
    price?: number | undefined;
    currency?: string | undefined;
    durationDays?: number | undefined;
    isDefault?: boolean | undefined;
    limits?: {
        maxAds?: number | undefined;
        maxServices?: number | undefined;
        maxParts?: number | undefined;
        smartAlerts?: number | undefined;
        spotlightCredits?: number | undefined;
    } | undefined;
    features?: {
        priorityWeight?: number | undefined;
        businessBadge?: boolean | undefined;
        canEditAd?: boolean | undefined;
        showOnHomePage?: boolean | undefined;
    } | undefined;
    smartAlertConfig?: {
        maxAlerts: number;
        matchFrequency: "instant" | "hourly" | "daily";
        radiusLimitKm: number;
        notificationChannels: string[];
    } | undefined;
}>;
export type PlanPayload = z.infer<typeof PlanPayloadSchema>;
export type PartialPlanPayload = z.infer<typeof PartialPlanPayloadSchema>;
