import { z } from "zod";
export { coordinatesSchema } from "./coordinates.schema";
export declare const LocationLevelSchema: z.ZodEnum<["country", "state", "district", "city", "area", "village"]>;
export declare const LocationEventSourceSchema: z.ZodEnum<any>;
export declare const LocationEventReasonSchema: z.ZodEnum<any>;
export declare const LocationEventTypeSchema: z.ZodEnum<any>;
export declare const LogLocationEventSchema: z.ZodObject<{
    source: z.ZodEnum<any>;
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
    reason: z.ZodEnum<any>;
    eventType: z.ZodOptional<z.ZodEnum<any>>;
    locationId: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    [x: string]: any;
    source?: unknown;
    city?: unknown;
    state?: unknown;
    coordinates?: unknown;
    reason?: unknown;
    eventType?: unknown;
    locationId?: unknown;
}, {
    [x: string]: any;
    source?: unknown;
    city?: unknown;
    state?: unknown;
    coordinates?: unknown;
    reason?: unknown;
    eventType?: unknown;
    locationId?: unknown;
}>;
export declare const AppLocationSchema: z.ZodObject<{
    formattedAddress: z.ZodString;
    city: z.ZodString;
    state: z.ZodString;
    country: z.ZodString;
    source: z.ZodEnum<any>;
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
    [x: string]: any;
    formattedAddress?: unknown;
    city?: unknown;
    state?: unknown;
    country?: unknown;
    source?: unknown;
    locationId?: unknown;
    coordinates?: unknown;
    pincode?: unknown;
    level?: unknown;
    name?: unknown;
    display?: unknown;
    detectedAt?: unknown;
    isAuto?: unknown;
    isSnapped?: unknown;
}, {
    [x: string]: any;
    formattedAddress?: unknown;
    city?: unknown;
    state?: unknown;
    country?: unknown;
    source?: unknown;
    locationId?: unknown;
    coordinates?: unknown;
    pincode?: unknown;
    level?: unknown;
    name?: unknown;
    display?: unknown;
    detectedAt?: unknown;
    isAuto?: unknown;
    isSnapped?: unknown;
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
    level?: "city" | "state" | "country" | "district" | "area" | "village" | undefined;
    name?: string | undefined;
    coordinates?: {
        type: "Point";
        coordinates: [number, number];
    } | undefined;
    locationId?: string | undefined;
    city?: string | undefined;
    state?: string | undefined;
    isActive?: boolean | undefined;
    parentId?: string | null | undefined;
    country?: string | undefined;
    pincode?: string | undefined;
    display?: string | undefined;
    isSnapped?: boolean | undefined;
    verificationStatus?: "pending" | "rejected" | "verified" | undefined;
}, {
    path?: string[] | undefined;
    level?: "city" | "state" | "country" | "district" | "area" | "village" | undefined;
    name?: string | undefined;
    coordinates?: {
        type: "Point";
        coordinates: [number, number];
    } | undefined;
    locationId?: string | undefined;
    city?: string | undefined;
    state?: string | undefined;
    isActive?: boolean | undefined;
    parentId?: string | null | undefined;
    country?: string | undefined;
    pincode?: string | undefined;
    display?: string | undefined;
    isSnapped?: boolean | undefined;
    verificationStatus?: "pending" | "rejected" | "verified" | undefined;
}>;
export type LocationMeta = z.infer<typeof LocationMetaSchema>;
export type LogLocationEvent = z.infer<typeof LogLocationEventSchema>;
export type AppLocationSchemaValue = z.infer<typeof AppLocationSchema>;
