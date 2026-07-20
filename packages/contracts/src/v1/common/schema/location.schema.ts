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


import { LOCATION_EVENT_SOURCES, LOCATION_EVENT_REASONS, LOCATION_EVENT_TYPES } from "../constants/locationEvents";

export const LocationEventSourceSchema = z.enum(LOCATION_EVENT_SOURCES);
export const LocationEventReasonSchema = z.enum(LOCATION_EVENT_REASONS);
export const LocationEventTypeSchema = z.enum(LOCATION_EVENT_TYPES);

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

export const ListingLocationSchema = z.object({
    display: z.string().trim().min(1),
    locationId: z.string().trim().min(1).optional(),
    city: z.string().trim().min(1),
    state: z.string().trim().min(1),
    country: z.string().trim().min(1),
    coordinates: coordinatesSchema.optional(),
});
