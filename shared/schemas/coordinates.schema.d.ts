import { z } from 'zod';
export declare const geoPointCoordinatesTupleSchema: z.ZodEffects<z.ZodTuple<[z.ZodEffects<z.ZodNumber, number, number>, z.ZodEffects<z.ZodNumber, number, number>], null>, [number, number], [number, number]>;
export declare const coordinatesSchema: z.ZodObject<{
    type: z.ZodLiteral<"Point">;
    coordinates: z.ZodEffects<z.ZodTuple<[z.ZodEffects<z.ZodNumber, number, number>, z.ZodEffects<z.ZodNumber, number, number>], null>, [number, number], [number, number]>;
}, "strip", z.ZodTypeAny, {
    type: "Point";
    coordinates: [number, number];
}, {
    type: "Point";
    coordinates: [number, number];
}>;
export type Coordinates = z.infer<typeof coordinatesSchema>;
//# sourceMappingURL=coordinates.schema.d.ts.map