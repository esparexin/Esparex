"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toObjectIdString = exports.toObjectId = exports.validateObjectIdOrThrow = exports.isValidObjectId = exports.normalizeObjectIdLike = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * Normalizes values that look like ObjectIds (string, object with id, object with _id)
 * into a standard string or undefined.
 */
const normalizeObjectIdLike = (value) => {
    if (typeof value === 'string')
        return value;
    if (!value || typeof value !== 'object')
        return undefined;
    const record = value;
    const idValue = record.id ?? record._id;
    if (typeof idValue === 'string')
        return idValue;
    if (idValue && typeof idValue === 'object' && 'toString' in idValue) {
        return idValue.toString();
    }
    return undefined;
};
exports.normalizeObjectIdLike = normalizeObjectIdLike;
/**
 * Strict validation of ObjectId format
 */
const isValidObjectId = (id) => {
    if (typeof id !== 'string')
        return false;
    return /^[0-9a-f]{24}$/i.test(id);
};
exports.isValidObjectId = isValidObjectId;
/**
 * Validates that a value is a valid 24-char hex ObjectId.
 * Throws a specific error if validation fails to prevent CastErrors at the DB layer.
 */
const validateObjectIdOrThrow = (fieldName, value) => {
    const id = (0, exports.normalizeObjectIdLike)(value);
    if (!id || !(0, exports.isValidObjectId)(id)) {
        throw new Error(`Invalid format for ${fieldName}: Expected 24-character hex ID, received "${String(value)}"`);
    }
    return id;
};
exports.validateObjectIdOrThrow = validateObjectIdOrThrow;
/**
 * Standard utility to convert a value to a Mongoose ObjectId or null.
 * Handles strings, ObjectIds, and objects with toString().
 */
const toObjectId = (value) => {
    if (!value)
        return null;
    if (value instanceof mongoose_1.default.Types.ObjectId)
        return value;
    if (typeof value === 'string' && mongoose_1.default.Types.ObjectId.isValid(value)) {
        return new mongoose_1.default.Types.ObjectId(value);
    }
    if (typeof value === 'object' &&
        typeof value.toString === 'function') {
        const maybeId = value.toString();
        if (mongoose_1.default.Types.ObjectId.isValid(maybeId)) {
            return new mongoose_1.default.Types.ObjectId(maybeId);
        }
    }
    return null;
};
exports.toObjectId = toObjectId;
/**
 * Converts a value to a hex string representing an ObjectId, or null.
 */
const toObjectIdString = (value) => {
    const oid = (0, exports.toObjectId)(value);
    return oid ? oid.toHexString() : null;
};
exports.toObjectIdString = toObjectIdString;
//# sourceMappingURL=idUtils.js.map