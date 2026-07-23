export const MONGOOSE_OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;

export function sanitizeMongoObjectId(value: unknown): string | undefined {
  if (typeof value !== "string" && typeof value !== "number") return undefined;

  const str = String(value).trim();

  if (!MONGOOSE_OBJECT_ID_REGEX.test(str)) return undefined;

  return str;
}

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

