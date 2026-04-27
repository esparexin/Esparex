"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SavedSearchCreateSchema = void 0;
const zod_1 = require("zod");
const objectIdLike = zod_1.z
    .string()
    .trim()
    .regex(/^[a-fA-F0-9]{24}$/, "Invalid ObjectId");
exports.SavedSearchCreateSchema = zod_1.z
    .object({
    query: zod_1.z.string().trim().max(120).optional(),
    categoryId: objectIdLike.optional(),
    locationId: objectIdLike.optional(),
    priceMin: zod_1.z.number().min(0).optional(),
    priceMax: zod_1.z.number().min(0).optional(),
})
    .refine((payload) => Boolean((payload.query && payload.query.length > 0) ||
    payload.categoryId ||
    payload.locationId ||
    typeof payload.priceMin === "number" ||
    typeof payload.priceMax === "number"), { message: "At least one search filter is required." })
    .refine((payload) => typeof payload.priceMin !== "number" ||
    typeof payload.priceMax !== "number" ||
    payload.priceMin <= payload.priceMax, { message: "priceMin must be less than or equal to priceMax." });
//# sourceMappingURL=savedSearch.schema.js.map