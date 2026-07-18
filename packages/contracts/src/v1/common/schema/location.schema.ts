import { z } from "zod";
import { coordinatesSchema } from "./coordinates.schema";

export { coordinatesSchema } from "./coordinates.schema";

export const LocationLevelSchema = z.enum([
    "country",
    "state",
    "district",
    "city",
    "area",
    "village",
]);


export const LocationEventSourceSchema = z.enum(['app', 'gps', 'manual', 'ip', 'network', 'cache', 'unknown']);
export const LocationEventReasonSchema = z.enum(['initial', 'refresh', 'correction', 'permission_denied', 'timeout', 'fallback', 'manual']);
export const LocationEventTypeSchema = z.enum(['set', 'update', 'clear', 'detect']);

export const LogLocationEventSchema = z.object({
    source: LocationEventSourceSchema,
    city: z.string().trim().min(1),
    state: z.string().trim().min(1),
    coordinates: coordinatesSchema.optional(),
    reason: LocationEventReasonSchema,
    eventType: LocationEventTypeSchema.optional(),
    locationId: z.string().trim().min(1).optional(),
}).strict();

export const AppLocationSchema = z.object({
    formattedAddress: z.string().trim().min(1),
    city: z.string().trim().min(1),
    state: z.string().trim().min(1),
    country: z.string().trim().min(1),
    source: LocationEventSourceSchema,
    locationId: z.string().trim().min(1).optional(),
    coordinates: coordinatesSchema.optional(),
    pincode: z.string().trim().min(1).optional(),
    level: LocationLevelSchema.optional(),
    name: z.string().trim().min(1).optional(),
    display: z.string().trim().min(1).optional(),
    detectedAt: z.number().finite().optional(),
    isAuto: z.boolean().optional(),
    isSnapped: z.boolean().optional(),
});

export const LocationMetaSchema = z.object({
    locationId: z.string().optional(),
    parentId: z.string().nullable().optional(),
    path: z.array(z.string()).optional(),
    name: z.string().optional(), // Specific area/city name
    display: z.string().optional(), // Join name (e.g. Andheri East, Mumbai)
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    pincode: z.string().optional(),
    level: LocationLevelSchema.optional(),
    isActive: z.boolean().optional(),
    verificationStatus: z.enum(['pending', 'verified', 'rejected']).optional(),
    coordinates: coordinatesSchema.optional(),
    isSnapped: z.boolean().optional(),
});

export type LocationMeta = z.infer<typeof LocationMetaSchema>;
export type LogLocationEvent = z.infer<typeof LogLocationEventSchema>;
export type AppLocationSchemaValue = z.infer<typeof AppLocationSchema>;
