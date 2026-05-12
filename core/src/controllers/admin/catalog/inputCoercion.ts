export const toOptionalString = (value: unknown): string | undefined => {
    if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed || undefined;
    }
    if (value && typeof value === 'object' && typeof (value as { toString?: () => string }).toString === 'function') {
        const stringValue = (value as { toString: () => string }).toString().trim();
        return stringValue && stringValue !== '[object Object]' ? stringValue : undefined;
    }
    return undefined;
};

export const toStringArray = (value: unknown): string[] | undefined => {
    if (!Array.isArray(value)) return undefined;
    const normalized = value
        .map((entry) => toOptionalString(entry))
        .filter((entry): entry is string => Boolean(entry));
    return normalized.length > 0 ? normalized : undefined;
};
