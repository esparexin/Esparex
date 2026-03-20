type UnknownRecord = Record<string, unknown>;

/**
 * Checks if value is a plain object record.
 */
const isObject = (item: unknown): item is UnknownRecord => (
    Boolean(item) && typeof item === 'object' && !Array.isArray(item)
);

/**
 * Deep merge two object-like values.
 */
export const deepMerge = (target: unknown, source: unknown): unknown => {
    if (!isObject(target) || !isObject(source)) {
        return source ?? target;
    }

    const output: UnknownRecord = { ...target };

    Object.keys(source).forEach((key) => {
        const sourceValue = source[key];
        const targetValue = target[key];

        if (isObject(sourceValue) && isObject(targetValue)) {
            output[key] = deepMerge(targetValue, sourceValue);
        } else {
            output[key] = sourceValue;
        }
    });

    return output;
};
