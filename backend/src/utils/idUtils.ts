import mongoose from 'mongoose';

/**
 * Normalizes values that look like ObjectIds (string, object with id, object with _id)
 * into a standard string or undefined.
 */
export const normalizeObjectIdLike = (value: unknown): string | undefined => {
    if (typeof value === 'string') return value;
    if (!value || typeof value !== 'object') return undefined;
    const record = value as Record<string, unknown>;
    const idValue = record.id ?? record._id;
    if (typeof idValue === 'string') return idValue;
    if (idValue && typeof idValue === 'object' && 'toString' in idValue) {
        return idValue.toString();
    }
    return undefined;
};

/**
 * Strict validation of ObjectId format
 */
export const isValidObjectId = (id: unknown): boolean => {
    if (typeof id !== 'string') return false;
    return /^[0-9a-f]{24}$/i.test(id);
};

/**
 * Validates that a value is a valid 24-char hex ObjectId.
 * Throws a specific error if validation fails to prevent CastErrors at the DB layer.
 */
export const validateObjectIdOrThrow = (fieldName: string, value: unknown): string => {
    const id = normalizeObjectIdLike(value);
    if (!id || !isValidObjectId(id)) {
        throw new Error(`Invalid format for ${fieldName}: Expected 24-character hex ID, received "${String(value)}"`);
    }
    return id;
};

/**
 * Standard utility to convert a value to a Mongoose ObjectId or null.
 * Handles strings, ObjectIds, and objects with toString().
 */
export const toObjectId = (value: unknown): mongoose.Types.ObjectId | null => {
    if (!value) return null;
    if (value instanceof mongoose.Types.ObjectId) return value;
    if (typeof value === 'string' && mongoose.Types.ObjectId.isValid(value)) {
        return new mongoose.Types.ObjectId(value);
    }
    if (
        typeof value === 'object' &&
        typeof (value as { toString?: () => string }).toString === 'function'
    ) {
        const maybeId = (value as { toString: () => string }).toString();
        if (mongoose.Types.ObjectId.isValid(maybeId)) {
            return new mongoose.Types.ObjectId(maybeId);
        }
    }
    return null;
};

/**
 * Converts a value to a hex string representing an ObjectId, or null.
 */
export const toObjectIdString = (value: unknown): string | null => {
    const oid = toObjectId(value);
    return oid ? oid.toHexString() : null;
};
