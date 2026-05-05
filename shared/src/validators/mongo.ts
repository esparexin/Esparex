export const MONGOOSE_OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;

export function sanitizeMongoObjectId(value: unknown): string | undefined {
  if (typeof value !== "string" && typeof value !== "number") return undefined;

  const str = String(value).trim();

  if (!MONGOOSE_OBJECT_ID_REGEX.test(str)) return undefined;

  return str;
}
