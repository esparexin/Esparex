import { z } from "zod";
export { coordinatesSchema } from "./coordinates.schema";
export declare const LocationLevelSchema: z.ZodEnum<["country", "state", "district", "city", "area", "village"]>;
export declare const LocationEventSourceSchema: z.ZodEnum<["auto", "ip", "manual", "default"]>;
export declare const LocationEventReasonSchema: z.ZodEnum<["manual_override", "gps_denied", "permission_denied", "timeout", "insecure_context", "ip_fallback", "manual_select", "gps_allowed", "fallback"]>;
export declare const LocationEventTypeSchema: z.ZodEnum<["location_search", "ad_view", "ad_post"]>;
export declare const LogLocationEventSchema: z.ZodObject<{
    source: z.ZodEnum<["auto", "ip", "manual", "default"]>;
    city: z.ZodString;
    state: z.ZodString;
    coordinates: z.ZodOptional<z.ZodObject<{
        type: z.ZodLiteral<"Point">;
        coordinates: z.ZodEffects<z.ZodTuple<[z.ZodEffects<z.ZodNumber, number, number>, z.ZodEffects<z.ZodNumber, number, number>], null>, [number, number], [number, number]>;
    }, "strip", z.ZodTypeAny, {
        type: "Point";
        coordinates: [number, number];
    }, {
        type: "Point";
        coordinates: [number, number];
    }>>;
    reason: z.ZodEnum<["manual_override", "gps_denied", "permission_denied", "timeout", "insecure_context", "ip_fallback", "manual_select", "gps_allowed", "fallback"]>;
    eventType: z.ZodOptional<z.ZodEnum<["location_search", "ad_view", "ad_post"]>>;
    locationId: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    source: "default" | "auto" | "ip" | "manual";
    state: string;
    city: string;
    reason: "manual_override" | "gps_denied" | "permission_denied" | "timeout" | "insecure_context" | "ip_fallback" | "manual_select" | "gps_allowed" | "fallback";
    coordinates?: {
        type: "Point";
        coordinates: [number, number];
    } | undefined;
    locationId?: string | undefined;
    eventType?: "location_search" | "ad_view" | "ad_post" | undefined;
}, {
    source: "default" | "auto" | "ip" | "manual";
    state: string;
    city: string;
    reason: "manual_override" | "gps_denied" | "permission_denied" | "timeout" | "insecure_context" | "ip_fallback" | "manual_select" | "gps_allowed" | "fallback";
    coordinates?: {
        type: "Point";
        coordinates: [number, number];
    } | undefined;
    locationId?: string | undefined;
    eventType?: "location_search" | "ad_view" | "ad_post" | undefined;
}>;
export declare const AppLocationSchema: z.ZodObject<{
    formattedAddress: z.ZodString;
    city: z.ZodString;
    state: z.ZodString;
    country: z.ZodString;
    source: z.ZodEnum<["auto", "ip", "manual", "default"]>;
    locationId: z.ZodOptional<z.ZodString>;
    coordinates: z.ZodOptional<z.ZodObject<{
        type: z.ZodLiteral<"Point">;
        coordinates: z.ZodEffects<z.ZodTuple<[z.ZodEffects<z.ZodNumber, number, number>, z.ZodEffects<z.ZodNumber, number, number>], null>, [number, number], [number, number]>;
    }, "strip", z.ZodTypeAny, {
        type: "Point";
        coordinates: [number, number];
    }, {
        type: "Point";
        coordinates: [number, number];
    }>>;
    pincode: z.ZodOptional<z.ZodString>;
    level: z.ZodOptional<z.ZodEnum<["country", "state", "district", "city", "area", "village"]>>;
    name: z.ZodOptional<z.ZodString>;
    display: z.ZodOptional<z.ZodString>;
    detectedAt: z.ZodOptional<z.ZodNumber>;
    isAuto: z.ZodOptional<z.ZodBoolean>;
    isSnapped: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    source: "default" | "auto" | "ip" | "manual";
    country: string;
    state: string;
    city: string;
    formattedAddress: string;
    level?: "country" | "state" | "district" | "city" | "area" | "village" | undefined;
    name?: string | undefined;
    coordinates?: {
        type: "Point";
        coordinates: [number, number];
    } | undefined;
    pincode?: string | undefined;
    locationId?: string | undefined;
    display?: string | undefined;
    detectedAt?: number | undefined;
    isAuto?: boolean | undefined;
    isSnapped?: boolean | undefined;
}, {
    source: "default" | "auto" | "ip" | "manual";
    country: string;
    state: string;
    city: string;
    formattedAddress: string;
    level?: "country" | "state" | "district" | "city" | "area" | "village" | undefined;
    name?: string | undefined;
    coordinates?: {
        type: "Point";
        coordinates: [number, number];
    } | undefined;
    pincode?: string | undefined;
    locationId?: string | undefined;
    display?: string | undefined;
    detectedAt?: number | undefined;
    isAuto?: boolean | undefined;
    isSnapped?: boolean | undefined;
}>;
export declare const LocationMetaSchema: z.ZodObject<{
    locationId: z.ZodOptional<z.ZodString>;
    parentId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    path: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    name: z.ZodOptional<z.ZodString>;
    display: z.ZodOptional<z.ZodString>;
    city: z.ZodOptional<z.ZodString>;
    state: z.ZodOptional<z.ZodString>;
    country: z.ZodOptional<z.ZodString>;
    pincode: z.ZodOptional<z.ZodString>;
    level: z.ZodOptional<z.ZodEnum<["country", "state", "district", "city", "area", "village"]>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    verificationStatus: z.ZodOptional<z.ZodEnum<["pending", "verified", "rejected"]>>;
    coordinates: z.ZodOptional<z.ZodObject<{
        type: z.ZodLiteral<"Point">;
        coordinates: z.ZodEffects<z.ZodTuple<[z.ZodEffects<z.ZodNumber, number, number>, z.ZodEffects<z.ZodNumber, number, number>], null>, [number, number], [number, number]>;
    }, "strip", z.ZodTypeAny, {
        type: "Point";
        coordinates: [number, number];
    }, {
        type: "Point";
        coordinates: [number, number];
    }>>;
    isSnapped: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    path?: string[] | undefined;
    level?: "country" | "state" | "district" | "city" | "area" | "village" | undefined;
    name?: string | undefined;
    coordinates?: {
        type: "Point";
        coordinates: [number, number];
    } | undefined;
    isActive?: boolean | undefined;
    country?: string | undefined;
    state?: string | undefined;
    city?: string | undefined;
    pincode?: string | undefined;
    locationId?: string | undefined;
    display?: string | undefined;
    isSnapped?: boolean | undefined;
    parentId?: string | null | undefined;
    verificationStatus?: "pending" | "rejected" | "verified" | undefined;
}, {
    path?: string[] | undefined;
    level?: "country" | "state" | "district" | "city" | "area" | "village" | undefined;
    name?: string | undefined;
    coordinates?: {
        type: "Point";
        coordinates: [number, number];
    } | undefined;
    isActive?: boolean | undefined;
    country?: string | undefined;
    state?: string | undefined;
    city?: string | undefined;
    pincode?: string | undefined;
    locationId?: string | undefined;
    display?: string | undefined;
    isSnapped?: boolean | undefined;
    parentId?: string | null | undefined;
    verificationStatus?: "pending" | "rejected" | "verified" | undefined;
}>;
export type LocationMeta = z.infer<typeof LocationMetaSchema>;
export type LogLocationEvent = z.infer<typeof LogLocationEventSchema>;
export type AppLocationSchemaValue = z.infer<typeof AppLocationSchema>;
//# sourceMappingURL=location.schema.d.ts.map