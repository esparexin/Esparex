import { z } from 'zod';
import { commonSchemas } from '../middleware/validateRequest';
import {
    LOCATION_EVENT_REASONS,
    LOCATION_EVENT_SOURCES,
} from '../constants/locationEvents';

export const logLocationEventSchema = z.object({
    source: z.enum(LOCATION_EVENT_SOURCES),
    city: z.string().trim().min(1),
    state: z.string().trim().min(1),
    coordinates: z.object({
        type: z.literal('Point'),
        coordinates: z.tuple([z.number(), z.number()])
    }).optional(),
    reason: z.enum(LOCATION_EVENT_REASONS),
    eventType: z.enum(['location_search', 'ad_view', 'ad_post']).optional(),
    locationId: commonSchemas.objectId.optional()
}).strict();

export const ingestLocationSchema = z.object({
    name: z.string().trim().min(1),
    state: z.string().trim().min(1),
    coordinates: z.object({
        type: z.literal('Point'),
        coordinates: z.tuple([z.number(), z.number()])
    }),
    radius: z.number().positive().optional(),
    tags: z.array(z.string()).optional()
}).passthrough(); // Allow extra props based on what the ingest service takes natively

const adminLocationLevelSchema = z.enum([
    'country',
    'state',
    'district',
    'city',
    'area',
    'village',
]);

const adminLocationLevelFilterSchema = z.enum([
    'all',
    'country',
    'state',
    'district',
    'city',
    'area',
    'village',
]);

const latitudeSchema = z.coerce.number().min(-90).max(90);
const longitudeSchema = z.coerce.number().min(-180).max(180);

export const adminLocationListQuerySchema = z.object({
    search: z.string().trim().max(200).optional(),
    status: z.enum(['all', 'active', 'inactive']).optional(),
    state: z.string().trim().max(100).optional(),
    level: adminLocationLevelFilterSchema.optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
}).strict();

export const adminLocationAnalyticsQuerySchema = z.object({
    city: z.string().trim().max(100).optional(),
    district: z.string().trim().max(100).optional(),
    state: z.string().trim().max(100).optional(),
    country: z.string().trim().max(100).optional(),
}).strict();

const adminLocationMutationBaseSchema = z.object({
    name: z.string().trim().min(2).max(100),
    level: adminLocationLevelSchema.optional(),
    parentId: commonSchemas.objectId.nullable().optional(),
    country: z.string().trim().max(100).optional(),
    latitude: latitudeSchema,
    longitude: longitudeSchema,
    isActive: z.boolean().optional(),
}).strict();

export const adminCreateStateLocationSchema = adminLocationMutationBaseSchema.extend({
    level: z.literal('state').optional(),
});

export const adminCreateCityLocationSchema = adminLocationMutationBaseSchema.extend({
    level: z.literal('city').optional(),
    stateId: commonSchemas.objectId,
});

export const adminCreateAreaLocationSchema = adminLocationMutationBaseSchema.extend({
    level: z.literal('area').optional(),
    cityId: commonSchemas.objectId,
});

export const adminCreateLocationSchema = adminLocationMutationBaseSchema.extend({
    level: adminLocationLevelSchema,
});

export const adminUpdateLocationSchema = z.object({
    name: z.string().trim().min(2).max(100).optional(),
    level: adminLocationLevelSchema.optional(),
    parentId: commonSchemas.objectId.nullable().optional(),
    country: z.string().trim().max(100).optional(),
    latitude: latitudeSchema.optional(),
    longitude: longitudeSchema.optional(),
    isActive: z.boolean().optional(),
}).strict()
    .refine((value) => Object.keys(value).length > 0, {
        message: 'At least one location field must be provided',
    })
    .superRefine((value, ctx) => {
        const hasLatitude = value.latitude !== undefined;
        const hasLongitude = value.longitude !== undefined;
        if (hasLatitude !== hasLongitude) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                path: [hasLatitude ? 'longitude' : 'latitude'],
                message: 'Latitude and longitude must be provided together',
            });
        }
    });

export const adminVerifyLocationSchema = z.object({
    status: z.enum(['verified', 'rejected']),
    reason: z.string().trim().max(500).optional(),
}).strict().superRefine((value, ctx) => {
    if (value.status === 'rejected' && !value.reason) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['reason'],
            message: 'Reason is required when rejecting a location',
        });
    }
});

const geofenceCoordinatesSchema = z.object({
    type: z.literal('Polygon'),
    coordinates: z
        .array(
            z.array(
                z.tuple([
                    z.number().min(-180).max(180),
                    z.number().min(-90).max(90),
                ])
            ).min(4)
        )
        .min(1),
}).strict();

export const adminCreateGeofenceSchema = z.object({
    name: z.string().trim().min(2).max(100),
    type: z.literal('Polygon').optional(),
    coordinates: geofenceCoordinatesSchema,
    color: z.string().trim().regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i).optional(),
    isActive: z.boolean().optional(),
    metadata: z.record(z.unknown()).optional(),
}).strict();

export const adminUpdateGeofenceSchema = z.object({
    name: z.string().trim().min(2).max(100).optional(),
    type: z.literal('Polygon').optional(),
    coordinates: geofenceCoordinatesSchema.optional(),
    color: z.string().trim().regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i).optional(),
    isActive: z.boolean().optional(),
    metadata: z.record(z.unknown()).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, {
    message: 'At least one geofence field must be provided',
});
