"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateUniqueSlug = generateUniqueSlug;
const slugify_1 = __importDefault(require("slugify"));
const nanoid_1 = require("nanoid");
/**
 * Generates a unique SEO-friendly slug with DB-checked retries to avoid
 * duplicate-key race conditions when saving documents that have a unique
 * `seoSlug` index.
 *
 * @param model - Mongoose Model to check for collisions (expects `seoSlug` field)
 * @param title - Source text (e.g., ad title)
 * @param oldSlug - Optional existing slug (returns early if unchanged)
 * @param excludeId - Optional _id to exclude from collision checks (useful on updates)
 */
async function generateUniqueSlug(model, title, oldSlug, excludeId, fieldName = 'seoSlug') {
    if (!title)
        return (0, nanoid_1.nanoid)(10);
    const baseSlug = (0, slugify_1.default)(title, {
        lower: true,
        strict: true,
        trim: true,
        replacement: '-',
        remove: /[*+~.()'"!:@]/g,
    });
    // Try a few times to find a non-colliding slug by checking the DB.
    const maxAttempts = 6;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const suffix = (0, nanoid_1.nanoid)(5);
        const candidate = `${baseSlug}-${suffix}`;
        if (oldSlug && oldSlug === candidate)
            return oldSlug;
        const query = { [fieldName]: candidate };
        if (excludeId)
            query._id = { $ne: excludeId };
        try {
            const exists = await model.exists(query);
            if (!exists)
                return candidate;
        }
        catch {
            // If the DB check fails for any reason, fall back to generating
            // a more unique slug and return it. Avoid throwing here to keep
            // slug generation resilient during transient DB issues.
            return `${baseSlug}-${(0, nanoid_1.nanoid)(8)}`;
        }
    }
    // If we exhausted attempts, return a longer random slug to ensure uniqueness.
    return `${baseSlug}-${(0, nanoid_1.nanoid)(8)}`;
}
//# sourceMappingURL=slugGenerator.js.map