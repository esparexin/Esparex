"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminUpdateGeofenceSchema = exports.adminCreateGeofenceSchema = exports.adminVerifyLocationSchema = exports.adminUpdateLocationSchema = exports.adminCreateLocationSchema = exports.adminCreateAreaLocationSchema = exports.adminCreateCityLocationSchema = exports.adminCreateStateLocationSchema = exports.adminLocationAnalyticsQuerySchema = exports.adminLocationListQuerySchema = exports.ingestLocationSchema = exports.logLocationEventSchema = void 0;
const zod_1 = require("zod");
const location_schema_1 = require("@esparex/shared/schemas/location.schema");
const common_1 = require("./common");
exports.logLocationEventSchema = location_schema_1.LogLocationEventSchema.extend({
    locationId: common_1.commonSchemas.objectId.optional(),
});
exports.ingestLocationSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1),
    state: zod_1.z.string().trim().min(1),
    coordinates: zod_1.z.object({
        type: zod_1.z.literal('Point'),
        coordinates: zod_1.z.tuple([zod_1.z.number(), zod_1.z.number()])
    }),
    radius: zod_1.z.number().positive().optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional()
}).passthrough(); // Allow extra props based on what the ingest service takes natively
const adminLocationLevelSchema = zod_1.z.enum([
    'country',
    'state',
    'district',
    'city',
    'area',
    'village',
]);
const adminLocationLevelFilterSchema = zod_1.z.enum([
    'all',
    'country',
    'state',
    'district',
    'city',
    'area',
    'village',
]);
const latitudeSchema = zod_1.z.coerce.number().min(-90).max(90);
const longitudeSchema = zod_1.z.coerce.number().min(-180).max(180);
exports.adminLocationListQuerySchema = zod_1.z.object({
    q: zod_1.z.string().trim().max(200).optional(),
    status: zod_1.z.enum(['all', 'active', 'inactive']).optional(),
    state: zod_1.z.string().trim().max(100).optional(),
    level: adminLocationLevelFilterSchema.optional(),
    page: zod_1.z.coerce.number().int().min(1).optional(),
    limit: zod_1.z.coerce.number().int().min(1).max(100).optional(),
}).strict();
exports.adminLocationAnalyticsQuerySchema = zod_1.z.object({
    city: zod_1.z.string().trim().max(100).optional(),
    district: zod_1.z.string().trim().max(100).optional(),
    state: zod_1.z.string().trim().max(100).optional(),
    country: zod_1.z.string().trim().max(100).optional(),
}).strict();
const adminLocationMutationBaseSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2).max(100),
    level: adminLocationLevelSchema.optional(),
    parentId: common_1.commonSchemas.objectId.nullable().optional(),
    country: zod_1.z.string().trim().max(100).optional(),
    latitude: latitudeSchema,
    longitude: longitudeSchema,
    isActive: zod_1.z.boolean().optional(),
}).strict();
exports.adminCreateStateLocationSchema = adminLocationMutationBaseSchema.extend({
    level: zod_1.z.literal('state'),
});
exports.adminCreateCityLocationSchema = adminLocationMutationBaseSchema.extend({
    level: zod_1.z.literal('city'),
    stateId: common_1.commonSchemas.objectId,
});
exports.adminCreateAreaLocationSchema = adminLocationMutationBaseSchema.extend({
    level: zod_1.z.literal('area'),
    cityId: common_1.commonSchemas.objectId,
});
exports.adminCreateLocationSchema = adminLocationMutationBaseSchema.extend({
    level: adminLocationLevelSchema,
});
exports.adminUpdateLocationSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2).max(100).optional(),
    level: adminLocationLevelSchema.optional(),
    parentId: common_1.commonSchemas.objectId.nullable().optional(),
    country: zod_1.z.string().trim().max(100).optional(),
    latitude: latitudeSchema.optional(),
    longitude: longitudeSchema.optional(),
    isActive: zod_1.z.boolean().optional(),
}).strict()
    .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one location field must be provided',
})
    .superRefine((value, ctx) => {
    const hasLatitude = value.latitude !== undefined;
    const hasLongitude = value.longitude !== undefined;
    if (hasLatitude !== hasLongitude) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            path: [hasLatitude ? 'longitude' : 'latitude'],
            message: 'Latitude and longitude must be provided together',
        });
    }
});
exports.adminVerifyLocationSchema = zod_1.z.object({
    status: zod_1.z.enum(['verified', 'rejected']),
    reason: zod_1.z.string().trim().max(500).optional(),
}).strict().superRefine((value, ctx) => {
    if (value.status === 'rejected' && !value.reason) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            path: ['reason'],
            message: 'Reason is required when rejecting a location',
        });
    }
});
const geofenceCoordinatesSchema = zod_1.z.object({
    type: zod_1.z.literal('Polygon'),
    coordinates: zod_1.z
        .array(zod_1.z.array(zod_1.z.tuple([
        zod_1.z.number().min(-180).max(180),
        zod_1.z.number().min(-90).max(90),
    ])).min(4))
        .min(1),
}).strict().superRefine((val, ctx) => {
    // GeoJSON Polygon requirement: first and last coordinates must be identical
    val.coordinates.forEach((ring, ringIdx) => {
        const first = ring[0];
        const last = ring[ring.length - 1];
        if (!first || !last || first[0] !== last[0] || first[1] !== last[1]) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                path: ['coordinates', ringIdx, ring.length - 1],
                message: 'Polygon ring must be closed (first and last points must be identical)',
            });
        }
    });
});
exports.adminCreateGeofenceSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2).max(100),
    type: zod_1.z.literal('Polygon').optional(),
    coordinates: geofenceCoordinatesSchema,
    color: zod_1.z.string().trim().regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i).optional(),
    isActive: zod_1.z.boolean().optional(),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
}).strict();
exports.adminUpdateGeofenceSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(2).max(100).optional(),
    type: zod_1.z.literal('Polygon').optional(),
    coordinates: geofenceCoordinatesSchema.optional(),
    color: zod_1.z.string().trim().regex(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i).optional(),
    isActive: zod_1.z.boolean().optional(),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
}).strict().refine((value) => Object.keys(value).length > 0, {
    message: 'At least one geofence field must be provided',
});
//# sourceMappingURL=location.validator.js.map