export function normalizeSparePartName(name: string): string {
    return (name || "").trim();
}

export function buildSparePartSlug(name: string): string {
    return (name || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
