import { z } from 'zod';

const longitudeSchema = z
    .number()
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180')
    .refine(Number.isFinite, 'Longitude must be a finite number');

const latitudeSchema = z
    .number()
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90')
    .refine(Number.isFinite, 'Latitude must be a finite number');

export const geoPointCoordinatesTupleSchema = z
    .tuple([longitudeSchema, latitudeSchema])
    .superRefine((value, ctx) => {
        if (value[0] === 0 && value[1] === 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Coordinates [0,0] are not allowed',
            });
        }
    });

export const coordinatesSchema = z.object({
    type: z.literal('Point'),
    coordinates: geoPointCoordinatesTupleSchema,
});

export type Coordinates = z.infer<typeof coordinatesSchema>;
