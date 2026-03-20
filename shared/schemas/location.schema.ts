import { z } from "zod";
import { coordinatesSchema } from "./coordinates.schema";

export const LocationMetaSchema = z.object({
    locationId: z.string().optional(),
    parentId: z.string().nullable().optional(),
    path: z.array(z.string()).optional(),
    name: z.string().optional(), // Specific area/city name
    display: z.string().optional(), // Join name (e.g. Andheri East, Mumbai)
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    level: z.enum(['country', 'state', 'district', 'city', 'area', 'village']).optional(),
    isActive: z.boolean().optional(),
    verificationStatus: z.enum(['pending', 'verified', 'rejected']).optional(),
    coordinates: coordinatesSchema.optional(),
});

export type LocationMeta = z.infer<typeof LocationMetaSchema>;
