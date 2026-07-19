export function normalizeServiceTypeName(name: string): string {
    return (name || "").trim();
}

export function buildServiceTypeSlug(name: string): string {
    return (name || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
