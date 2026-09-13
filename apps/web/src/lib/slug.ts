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
    const match = trimmed.match(/^(.*)-([0-9a-fA-F]{24})$/);
    if (match && match[2]) {
        return {
            id: match[2],
            slug: match[1] || "",
            identifier: match[2],
        };
    }
    const isRawObjectId = /^[0-9a-fA-F]{24}$/.test(trimmed);
    return {
        id: isRawObjectId ? trimmed : "",
        slug: isRawObjectId ? "" : trimmed,
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
