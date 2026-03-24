export const normalizeOptionalObjectId = (value: unknown): string | undefined => {
    if (typeof value === "string" || typeof value === "number") {
        const trimmed = String(value).trim();
        return trimmed.length > 0 ? trimmed : undefined;
    }
    if (value && typeof value === "object") {
        const record = value as Record<string, unknown>;
        const candidate = record.id ?? record._id ?? record.value;
        if (typeof candidate === "string" || typeof candidate === "number") {
            const trimmed = String(candidate).trim();
            return trimmed.length > 0 ? trimmed : undefined;
        }
    }
    return undefined;
};
