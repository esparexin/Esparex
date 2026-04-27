"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.coordinatesSchema = exports.geoPointCoordinatesTupleSchema = void 0;
const zod_1 = require("zod");
const longitudeSchema = zod_1.z
    .number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180')
    .refine(Number.isFinite, 'Longitude must be a finite number');
const latitudeSchema = zod_1.z
    .number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90')
    .refine(Number.isFinite, 'Latitude must be a finite number');
exports.geoPointCoordinatesTupleSchema = zod_1.z
    .tuple([longitudeSchema, latitudeSchema])
    .superRefine((value, ctx) => {
    if (value[0] === 0 && value[1] === 0) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            message: 'Coordinates [0,0] are not allowed',
        });
    }
});
exports.coordinatesSchema = zod_1.z.object({
    type: zod_1.z.literal('Point'),
    coordinates: exports.geoPointCoordinatesTupleSchema,
});
//# sourceMappingURL=coordinates.schema.js.map