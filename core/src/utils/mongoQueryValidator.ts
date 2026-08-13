/**
 * 🛡️ MongoDB Query Operator Injection Safeguard (SSOT)
 * Strips raw user input of MongoDB operators ($ and .) to prevent query injection attacks.
 */

/**
 * Recursively strips keys starting with '$' or containing '.' from objects and arrays.
 * This prevents users from supplying objects like `{ "$ne": null }` or `{ "$gt": 0 }`
 * via query params or JSON request bodies.
 */
export function stripMongoOperators(input: unknown): unknown {
    if (input === null || typeof input !== 'object') {
        return input;
    }

    if (Array.isArray(input)) {
        return input.map((item: unknown) => stripMongoOperators(item));
    }

    const sanitized: Record<string, unknown> = {};
    const record = input as Record<string, unknown>;

    for (const key of Object.keys(record)) {
        if (key.startsWith('$') || key.includes('.')) {
            continue; // Drop dangerous operator key
        }
        sanitized[key] = stripMongoOperators(record[key]);
    }

    return sanitized;
}

/**
 * Builds a safe MongoDB filter object by selecting only allowed keys from user input
 * and stripping any query operator payloads.
 */
export function buildSafeQueryFilter(
    rawInput: Record<string, unknown>,
    allowedKeys: string[]
): Record<string, unknown> {
    const filter: Record<string, unknown> = {};
    const sanitizedInput = stripMongoOperators(rawInput) as Record<string, unknown>;

    for (const key of allowedKeys) {
        if (Object.prototype.hasOwnProperty.call(sanitizedInput, key) && sanitizedInput[key] !== undefined) {
            filter[key] = sanitizedInput[key];
        }
    }

    return filter;
}
