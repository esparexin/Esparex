/**
 * Normalizes an ID that could be a string or a MongoDB-style object { id, _id }
 */
export const normalizeObjectIdLike = (value: unknown): string => {
    if (typeof value === "string") return value;
    if (value && typeof value === "object") {
        const record = value as { id?: string; _id?: string };
        return record.id || record._id || "";
    }
    return "";
};
