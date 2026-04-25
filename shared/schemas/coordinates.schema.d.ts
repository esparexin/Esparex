import { z } from 'zod';
export declare const geoPointCoordinatesTupleSchema: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
export declare const coordinatesSchema: z.ZodObject<{
    type: z.ZodLiteral<"Point">;
    coordinates: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
}, z.core.$strip>;
export type Coordinates = z.infer<typeof coordinatesSchema>;
