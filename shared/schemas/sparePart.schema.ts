import { z } from "zod";

export const SparePartSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(1),
    type: z.enum(["PRIMARY", "SECONDARY"]).optional(),
});

export type SparePart = z.infer<typeof SparePartSchema>;
