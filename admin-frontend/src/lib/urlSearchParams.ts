type SearchParamSource = {
    toString(): string;
};

export type SearchParamValue = string | number | null | undefined;

export function normalizeSearchParamValue(value: string | null | undefined): string {
    return typeof value === "string" ? value.trim() : "";
}

export function parsePositiveIntParam(value: string | null | undefined, fallback = 1): number {
    const parsed = Number.parseInt(value ?? "", 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function updateSearchParams(
    source: SearchParamSource,
    updates: Record<string, SearchParamValue>
): URLSearchParams {
    const next = new URLSearchParams(source.toString());

    Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === undefined) {
            next.delete(key);
            return;
        }

        const normalized = typeof value === "string" ? value.trim() : String(value);
        if (normalized.length === 0) {
            next.delete(key);
            return;
        }

        next.set(key, normalized);
    });

    return next;
}

export function buildUrlWithSearchParams(pathname: string, params: URLSearchParams): string {
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
}
