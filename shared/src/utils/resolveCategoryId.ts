/**
 * Universal utility to resolve a category ID from various input sources.
 * Supports:
 * - Direct ObjectId string
 * - Simple string (slug or name)
 * - Object with id or _id field
 */
export function resolveCategoryId(input: unknown): string | undefined {
    if (!input) return undefined;

    // 1. Direct string
    if (typeof input === 'string') {
        return input.trim();
    }

    // 2. Object with id or _id
    if (typeof input === 'object' && input !== null) {
        const anyInput = input as any;
        const id = anyInput.id || anyInput._id;
        if (typeof id === 'string') return id.trim();
        if (id && typeof id.toString === 'function') return id.toString();
    }

    return undefined;
}
