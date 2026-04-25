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
