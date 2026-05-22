import { z } from "zod";

export const LegacySparePartSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1),
    type: z.enum(["PRIMARY", "SECONDARY"]).optional(),
});

export type LegacySparePart = z.infer<typeof LegacySparePartSchema>;
