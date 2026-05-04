"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.promoteAdSchema = void 0;
const zod_1 = require("zod");
exports.promoteAdSchema = zod_1.z.object({
    days: zod_1.z.number()
        .int("Days must be an integer")
        .min(1, "Days must be at least 1")
        .max(365, "Days cannot exceed 365"), // Reasonable upper limit
    type: zod_1.z.enum(['spotlight', 'top_listing', 'urgent']).optional().default('spotlight'),
    planType: zod_1.z.string().optional(), // Frontend sends this
    amount: zod_1.z.number().optional() // Frontend sends this
}).strict();
//# sourceMappingURL=promotion.validator.js.map