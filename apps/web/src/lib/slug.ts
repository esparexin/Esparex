export function generateAdSlug(title: string) {
    if (!title) return "";
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

export function parseListingSlugParam(param: string): { id: string; slug: string } {
    const match = param.match(/^(.*)-([0-9a-fA-F]{24})$/);
    if (!match || !match[2]) {
        return { id: param, slug: "" };
    }
    return {
        id: match[2],
        slug: match[1] || "",
    };
}

