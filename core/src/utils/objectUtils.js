"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deepMerge = void 0;
/**
 * Checks if value is a plain object record.
 */
const isObject = (item) => (Boolean(item) && typeof item === 'object' && !Array.isArray(item));
/**
 * Deep merge two object-like values.
 */
const deepMerge = (target, source) => {
    if (!isObject(target) || !isObject(source)) {
        return source ?? target;
    }
    const output = { ...target };
    Object.keys(source).forEach((key) => {
        const sourceValue = source[key];
        const targetValue = target[key];
        if (isObject(sourceValue) && isObject(targetValue)) {
            output[key] = (0, exports.deepMerge)(targetValue, sourceValue);
        }
        else {
            output[key] = sourceValue;
        }
    });
    return output;
};
exports.deepMerge = deepMerge;
//# sourceMappingURL=objectUtils.js.map