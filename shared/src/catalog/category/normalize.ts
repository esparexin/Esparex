export function normalizeCategoryName(name: string): string {
    return (name || "").trim();
}

export function normalizeToken(value: string): string {
    return (value || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export function singularize(token: string): string {
    if (token.endsWith('ies') && token.length > 4) return `${token.slice(0, -3)}y`;
    if (token.endsWith('s') && !token.endsWith('ss') && token.length > 3) return token.slice(0, -1);
    return token;
}

export function toCanonicalKey(value?: string): string | null {
    if (!value) return null;
    const normalized = normalizeToken(value);
    if (!normalized) return null;
    return singularize(normalized).replace(/-/g, '');
}

export function categoryKeys(slug?: string, name?: string): Set<string> {
    const keys = new Set<string>();
    const fromSlug = toCanonicalKey(slug);
    const fromName = toCanonicalKey(name);
    if (fromSlug) keys.add(fromSlug);
    if (fromName) keys.add(fromName);
    return keys;
}

export function keysOverlap(left: Set<string>, right: Set<string>): boolean {
    for (const key of left) {
        if (right.has(key)) return true;
    }
    return false;
}
