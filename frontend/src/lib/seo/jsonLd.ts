const SCRIPT_TAG_CLOSING_PATTERN = /<\/script/gi;

export const toSafeJsonLd = (payload: unknown): string =>
    JSON.stringify(payload).replace(SCRIPT_TAG_CLOSING_PATTERN, "<\\/script");
