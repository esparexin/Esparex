export function normalizeScreenSizeName(name: string): string {
    return (name || "").trim();
}

export function buildScreenSizeSlug(name: string): string {
    return (name || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}
