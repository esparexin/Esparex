export const DANGEROUS_HTML_PATTERNS = /<script|<iframe|javascript:|onerror=|onload=/i;

export const SQL_INJECTION_PATTERNS = /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i;

export const containsInjectionPattern = (text: string): boolean => {
    return DANGEROUS_HTML_PATTERNS.test(text) || SQL_INJECTION_PATTERNS.test(text);
};
