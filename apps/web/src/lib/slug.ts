export function generateAdSlug(title: string) {
    if (!title) return "";
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

/**
 * Canonical URL Slug-and-ID Parser (Single Source of Truth)
 *
 * Deconstructs canonical route params formatted as `${slug}-${objectId}` into their
 * constituent slug and 24-character hexadecimal ObjectId components.
 *
 * Supports:
 * - Canonical slug-id: "iphone-13-screen-65d123456789012345678901" -> { id: "65d1...", slug: "iphone-13-screen", identifier: "65d1..." }
 * - Raw ObjectId: "65d123456789012345678901" -> { id: "65d1...", slug: "", identifier: "65d1..." }
 * - Raw slug identifier: "apple" -> { id: "", slug: "apple", identifier: "apple" }
 */
export function parseSlugIdParam(param: string): { id: string; slug: string; identifier: string } {
    const trimmed = (param || "").trim();
    if (!trimmed) {
        return { id: "", slug: "", identifier: "" };
    }
    // Match 24-character hexadecimal ObjectId at end of slug: ...-([0-9a-fA-F]{24})
    const hexMatch = trimmed.match(/^(.*)-([0-9a-fA-F]{24})$/);
    if (hexMatch && hexMatch[2]) {
        return {
            id: hexMatch[2],
            slug: hexMatch[1] || "",
            identifier: hexMatch[2],
        };
    }
    const isRawObjectId = /^[0-9a-fA-F]{24}$/.test(trimmed);
    if (isRawObjectId) {
        return {
            id: trimmed,
            slug: "",
            identifier: trimmed,
        };
    }
    // Match numeric ID suffix formatted as slug-id (e.g. "iphone-13-12345")
    const numericMatch = trimmed.match(/^(.*)-(\d{4,})$/);
    if (numericMatch && numericMatch[2]) {
        return {
            id: numericMatch[2],
            slug: numericMatch[1] || "",
            identifier: numericMatch[2],
        };
    }
    return {
        id: "",
        slug: trimmed,
        identifier: trimmed,
    };
}

/**
 * Backward-compatible alias for listing routes.
 */
export const parseListingSlugParam = (param: string): { id: string; slug: string } => {
    const parsed = parseSlugIdParam(param);
    return { id: parsed.id || parsed.identifier, slug: parsed.slug };
};
