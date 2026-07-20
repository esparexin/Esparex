function normalizeName(name: string): string {
    return (name || "").trim();
}

function buildSlug(name: string): string {
    return (name || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export { normalizeName, buildSlug };
