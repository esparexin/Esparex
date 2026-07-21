import sanitizeHtml from 'sanitize-html';

/**
 * Escapes special characters in a string for use in a regular expression.
 * Used to prevent ReDoS attacks when creating RegExp from user input.
 *
 * @param string - The string to escape
 * @returns The escaped string safe for RegExp constructor
 */
export const escapeRegExp = (string: string): string => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
};

/**
 * Converts a string to Title Case (e.g. "hello world" -> "Hello World").
 */
export const toTitleCase = (value?: string): string => {
    if (!value) return '';
    return value
        .split(' ')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
};

/**
 * Strips all HTML tags from plain-text fields (title, description, etc.).
 * Uses sanitize-html with a zero-allowlist policy — far more robust than regex
 * stripping, which leaves partial payloads like "script" after removing "<script>".
 *
 * @param text - Raw user input
 * @param maxLength - Optional character cap (default 5000)
 * @returns Sanitized plain text, trimmed
 */
export const sanitizePlainText = (text: string, maxLength = 5000): string =>
    sanitizeHtml(text, { allowedTags: [], allowedAttributes: {} })
        .trim()
        .slice(0, maxLength);

/**
 * Normalizes a slug value from user input before a database query:
 * trims whitespace and lowercases to match stored slug conventions.
 *
 * @param value - Raw slug string from request
 * @returns Normalized slug, or null if empty after trimming
 */
export const normalizeSlug = (value: string): string | null => {
    const normalized = value.trim().toLowerCase();
    return normalized.length > 0 ? normalized : null;
};
