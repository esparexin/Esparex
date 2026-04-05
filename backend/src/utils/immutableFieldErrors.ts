export const hasOwnField = (body: Record<string, unknown>, field: string) =>
    Object.prototype.hasOwnProperty.call(body, field);

export const collectImmutableFieldErrors = (
    body: Record<string, unknown>,
    fieldMessages: Record<string, string>
) => Object.entries(fieldMessages)
    .filter(([field]) => hasOwnField(body, field))
    .map(([field, message]) => ({
        field,
        message,
        code: 'IMMUTABLE_FIELD',
    }));
