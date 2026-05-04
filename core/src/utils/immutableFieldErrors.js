"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectImmutableFieldErrors = exports.hasOwnField = void 0;
const hasOwnField = (body, field) => Object.prototype.hasOwnProperty.call(body, field);
exports.hasOwnField = hasOwnField;
const collectImmutableFieldErrors = (body, fieldMessages) => Object.entries(fieldMessages)
    .filter(([field]) => (0, exports.hasOwnField)(body, field))
    .map(([field, message]) => ({
    field,
    message,
    code: 'IMMUTABLE_FIELD',
}));
exports.collectImmutableFieldErrors = collectImmutableFieldErrors;
//# sourceMappingURL=immutableFieldErrors.js.map