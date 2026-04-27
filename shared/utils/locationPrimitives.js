"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildLocationSlug = exports.normalizeLocationNameForSearch = exports.normalizeLocationLevel = exports.LOCATION_LEVELS = void 0;
const slugify_1 = __importDefault(require("slugify"));
exports.LOCATION_LEVELS = ['country', 'state', 'district', 'city', 'area', 'village'];
const asString = (value) => {
    if (typeof value === 'string')
        return value;
    if (value === null || value === undefined)
        return '';
    return String(value);
};
const normalizeLocationLevel = (value) => {
    const normalized = asString(value).toLowerCase();
    if (!normalized)
        return undefined;
    return exports.LOCATION_LEVELS.includes(normalized)
        ? normalized
        : undefined;
};
exports.normalizeLocationLevel = normalizeLocationLevel;
const normalizeLocationNameForSearch = (value) => {
    const source = asString(value);
    return (0, slugify_1.default)(source, {
        lower: true,
        strict: true,
        trim: true,
        replacement: ''
    });
};
exports.normalizeLocationNameForSearch = normalizeLocationNameForSearch;
const buildLocationSlug = (...parts) => (0, slugify_1.default)(parts
    .map((part) => asString(part))
    .filter((part) => Boolean(part))
    .join('-'), {
    lower: true,
    strict: true,
    trim: true
});
exports.buildLocationSlug = buildLocationSlug;
//# sourceMappingURL=locationPrimitives.js.map