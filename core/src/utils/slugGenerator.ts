import slugify from 'slugify';
import { nanoid } from 'nanoid';
import { Model } from 'mongoose';

type SlugModel = Model<unknown>;

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
export async function generateUniqueSlug(
    model: SlugModel,
    title: string,
    oldSlug?: string,
    excludeId?: string,
    fieldName = 'seoSlug',
): Promise<string> {
    if (!title) return nanoid(10);

    const baseSlug = slugify(title, {
        lower: true,
        strict: true,
        trim: true,
        replacement: '-',
        remove: /[*+~.()'"!:@]/g,
    });

    // Try a few times to find a non-colliding slug by checking the DB.
    const maxAttempts = 6;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const suffix = nanoid(5);
        const candidate = `${baseSlug}-${suffix}`;

        if (oldSlug && oldSlug === candidate) return oldSlug;

        const query: Record<string, unknown> = { [fieldName]: candidate };
        if (excludeId) query._id = { $ne: excludeId };

        try {
            const exists = await model.exists(query);
            if (!exists) return candidate;
        } catch {
            // If the DB check fails for any reason, fall back to generating
            // a more unique slug and return it. Avoid throwing here to keep
            // slug generation resilient during transient DB issues.
            return `${baseSlug}-${nanoid(8)}`;
        }
    }

    // If we exhausted attempts, return a longer random slug to ensure uniqueness.
    return `${baseSlug}-${nanoid(8)}`;
}
