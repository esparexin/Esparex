/**
 * Centralized security patterns for injection detection and content filtering.
 * Used across frontend, backend, and security middleware layers.
 */

/**
 * Patterns that indicate potential XSS, script injection, or malicious HTML.
 */
export const DANGEROUS_HTML_PATTERNS = /<script|<iframe|javascript:|onerror=|onload=/i;

/**
 * Patterns that indicate potential SQL injection attempts.
 * Targets common SQL keywords used in unauthorized data extraction or manipulation.
 */
export const SQL_INJECTION_PATTERNS = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i;

/**
 * Helper to check if a string contains any dangerous injection patterns.
 * Returns true if the content is deemed unsafe.
 */
export const containsInjectionPattern = (text: string): boolean => {
    return DANGEROUS_HTML_PATTERNS.test(text) || SQL_INJECTION_PATTERNS.test(text);
};
