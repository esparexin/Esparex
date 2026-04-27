"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocationMetaSchema = exports.AppLocationSchema = exports.LogLocationEventSchema = exports.LocationEventTypeSchema = exports.LocationEventReasonSchema = exports.LocationEventSourceSchema = exports.LocationLevelSchema = exports.coordinatesSchema = void 0;
const zod_1 = require("zod");
const locationEvents_1 = require("../constants/locationEvents");
const coordinates_schema_1 = require("./coordinates.schema");
var coordinates_schema_2 = require("./coordinates.schema");
Object.defineProperty(exports, "coordinatesSchema", { enumerable: true, get: function () { return coordinates_schema_2.coordinatesSchema; } });
exports.LocationLevelSchema = zod_1.z.enum([
    "country",
    "state",
    "district",
    "city",
    "area",
    "village",
]);
exports.LocationEventSourceSchema = zod_1.z.enum(locationEvents_1.LOCATION_EVENT_SOURCES);
exports.LocationEventReasonSchema = zod_1.z.enum(locationEvents_1.LOCATION_EVENT_REASONS);
exports.LocationEventTypeSchema = zod_1.z.enum(locationEvents_1.LOCATION_EVENT_TYPES);
exports.LogLocationEventSchema = zod_1.z.object({
    source: exports.LocationEventSourceSchema,
    city: zod_1.z.string().trim().min(1),
    state: zod_1.z.string().trim().min(1),
    coordinates: coordinates_schema_1.coordinatesSchema.optional(),
    reason: exports.LocationEventReasonSchema,
    eventType: exports.LocationEventTypeSchema.optional(),
    locationId: zod_1.z.string().trim().min(1).optional(),
}).strict();
exports.AppLocationSchema = zod_1.z.object({
    formattedAddress: zod_1.z.string().trim().min(1),
    city: zod_1.z.string().trim().min(1),
    state: zod_1.z.string().trim().min(1),
    country: zod_1.z.string().trim().min(1),
    source: exports.LocationEventSourceSchema,
    locationId: zod_1.z.string().trim().min(1).optional(),
    coordinates: coordinates_schema_1.coordinatesSchema.optional(),
    pincode: zod_1.z.string().trim().min(1).optional(),
    level: exports.LocationLevelSchema.optional(),
    name: zod_1.z.string().trim().min(1).optional(),
    display: zod_1.z.string().trim().min(1).optional(),
    detectedAt: zod_1.z.number().finite().optional(),
    isAuto: zod_1.z.boolean().optional(),
    isSnapped: zod_1.z.boolean().optional(),
});
exports.LocationMetaSchema = zod_1.z.object({
    locationId: zod_1.z.string().optional(),
    parentId: zod_1.z.string().nullable().optional(),
    path: zod_1.z.array(zod_1.z.string()).optional(),
    name: zod_1.z.string().optional(), // Specific area/city name
    display: zod_1.z.string().optional(), // Join name (e.g. Andheri East, Mumbai)
    city: zod_1.z.string().optional(),
    state: zod_1.z.string().optional(),
    country: zod_1.z.string().optional(),
    pincode: zod_1.z.string().optional(),
    level: exports.LocationLevelSchema.optional(),
    isActive: zod_1.z.boolean().optional(),
    verificationStatus: zod_1.z.enum(['pending', 'verified', 'rejected']).optional(),
    coordinates: coordinates_schema_1.coordinatesSchema.optional(),
    isSnapped: zod_1.z.boolean().optional(),
});
//# sourceMappingURL=location.schema.js.map