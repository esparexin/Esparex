"use strict";
/**
 * Centralized security patterns for injection detection and content filtering.
 * Used across frontend, backend, and security middleware layers.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.containsInjectionPattern = exports.SQL_INJECTION_PATTERNS = exports.DANGEROUS_HTML_PATTERNS = void 0;
/**
 * Patterns that indicate potential XSS, script injection, or malicious HTML.
 */
exports.DANGEROUS_HTML_PATTERNS = /<script|<iframe|javascript:|onerror=|onload=/i;
/**
 * Patterns that indicate potential SQL injection attempts.
 * Targets common SQL keywords used in unauthorized data extraction or manipulation.
 */
exports.SQL_INJECTION_PATTERNS = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i;
/**
 * Helper to check if a string contains any dangerous injection patterns.
 * Returns true if the content is deemed unsafe.
 */
const containsInjectionPattern = (text) => {
    return exports.DANGEROUS_HTML_PATTERNS.test(text) || exports.SQL_INJECTION_PATTERNS.test(text);
};
exports.containsInjectionPattern = containsInjectionPattern;
//# sourceMappingURL=securityPatterns.js.map