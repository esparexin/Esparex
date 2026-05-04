"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toTitleCase = exports.escapeRegExp = void 0;
/**
 * Escapes special characters in a string for use in a regular expression.
 * Used to prevent ReDoS attacks when creating RegExp from user input.
 *
 * @param string - The string to escape
 * @returns The escaped string safe for RegExp constructor
 */
const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
};
exports.escapeRegExp = escapeRegExp;
/**
 * Converts a string to Title Case (e.g. "hello world" -> "Hello World").
 */
const toTitleCase = (value) => {
    if (!value)
        return '';
    return value
        .split(' ')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
};
exports.toTitleCase = toTitleCase;
//# sourceMappingURL=stringUtils.js.map