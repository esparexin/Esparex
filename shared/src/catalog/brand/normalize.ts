export function normalizeBrandName(name: string): string {
    return (name || "").trim();
}

export function buildBrandSlug(name: string): string {
    return (name || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
