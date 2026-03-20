/**
 * Universal utility to resolve a category ID from various input sources.
 * Supports:
 * - Direct ObjectId string
 * - Simple string (slug or name)
 * - Object with id or _id field
 */
export function resolveCategoryId(input: any): string | undefined {
    if (!input) return undefined;

    // 1. Direct string
    if (typeof input === 'string') {
        return input.trim();
    }

    // 2. Object with id or _id
    if (typeof input === 'object') {
        const id = input.id || input._id;
        if (typeof id === 'string') return id.trim();
        if (id && typeof id.toString === 'function') return id.toString();
    }

    return undefined;
}
