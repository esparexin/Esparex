import { z } from "zod";
export { coordinatesSchema } from "./coordinates.schema";
export declare const LocationLevelSchema: z.ZodEnum<{
    country: "country";
    state: "state";
    district: "district";
    city: "city";
    area: "area";
    village: "village";
}>;
export declare const LocationEventSourceSchema: z.ZodEnum<{
    default: "default";
    auto: "auto";
    manual: "manual";
    ip: "ip";
}>;
export declare const LocationEventReasonSchema: z.ZodEnum<{
    timeout: "timeout";
    manual_override: "manual_override";
    gps_denied: "gps_denied";
    permission_denied: "permission_denied";
    insecure_context: "insecure_context";
    ip_fallback: "ip_fallback";
    manual_select: "manual_select";
    gps_allowed: "gps_allowed";
    fallback: "fallback";
}>;
export declare const LocationEventTypeSchema: z.ZodEnum<{
    location_search: "location_search";
    ad_view: "ad_view";
    ad_post: "ad_post";
}>;
export declare const LogLocationEventSchema: z.ZodObject<{
    source: z.ZodEnum<{
        default: "default";
        auto: "auto";
        manual: "manual";
        ip: "ip";
    }>;
    city: z.ZodString;
    state: z.ZodString;
    coordinates: z.ZodOptional<z.ZodObject<{
        type: z.ZodLiteral<"Point">;
        coordinates: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
    }, z.core.$strip>>;
    reason: z.ZodEnum<{
        timeout: "timeout";
        manual_override: "manual_override";
        gps_denied: "gps_denied";
        permission_denied: "permission_denied";
        insecure_context: "insecure_context";
        ip_fallback: "ip_fallback";
        manual_select: "manual_select";
        gps_allowed: "gps_allowed";
        fallback: "fallback";
    }>;
    eventType: z.ZodOptional<z.ZodEnum<{
        location_search: "location_search";
        ad_view: "ad_view";
        ad_post: "ad_post";
    }>>;
    locationId: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export declare const AppLocationSchema: z.ZodObject<{
    formattedAddress: z.ZodString;
    city: z.ZodString;
    state: z.ZodString;
    country: z.ZodString;
    source: z.ZodEnum<{
        default: "default";
        auto: "auto";
        manual: "manual";
        ip: "ip";
    }>;
    locationId: z.ZodOptional<z.ZodString>;
    coordinates: z.ZodOptional<z.ZodObject<{
        type: z.ZodLiteral<"Point">;
        coordinates: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
    }, z.core.$strip>>;
    pincode: z.ZodOptional<z.ZodString>;
    level: z.ZodOptional<z.ZodEnum<{
        country: "country";
        state: "state";
        district: "district";
        city: "city";
        area: "area";
        village: "village";
    }>>;
    name: z.ZodOptional<z.ZodString>;
    display: z.ZodOptional<z.ZodString>;
    detectedAt: z.ZodOptional<z.ZodNumber>;
    isAuto: z.ZodOptional<z.ZodBoolean>;
}, z.core.$strip>;
export declare const LocationMetaSchema: z.ZodObject<{
    locationId: z.ZodOptional<z.ZodString>;
    parentId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    path: z.ZodOptional<z.ZodArray<z.ZodString>>;
    name: z.ZodOptional<z.ZodString>;
    display: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    state: z.ZodOptional<z.ZodString>;
    country: z.ZodOptional<z.ZodString>;
    pincode: z.ZodOptional<z.ZodString>;
    level: z.ZodOptional<z.ZodEnum<{
        country: "country";
        state: "state";
        district: "district";
        city: "city";
        area: "area";
        village: "village";
    }>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    verificationStatus: z.ZodOptional<z.ZodEnum<{
        pending: "pending";
        rejected: "rejected";
        verified: "verified";
    }>>;
    coordinates: z.ZodOptional<z.ZodObject<{
        type: z.ZodLiteral<"Point">;
        coordinates: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type LocationMeta = z.infer<typeof LocationMetaSchema>;
export type LogLocationEvent = z.infer<typeof LogLocationEventSchema>;
export type AppLocationSchemaValue = z.infer<typeof AppLocationSchema>;
