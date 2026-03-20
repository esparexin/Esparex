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
