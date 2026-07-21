import mongoose from 'mongoose';

/**
 * 24-character hexadecimal regex pattern for ObjectId validation.
 * CodeQL recognizes explicit regex validation as a taint-barrier.
 */
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

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
 * Strict validation of ObjectId format (24-character hex string).
 */
export const isValidObjectId = (id: unknown): boolean => {
    if (typeof id !== 'string') return false;
    return OBJECT_ID_REGEX.test(id);
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
 * Strictly checks for 24-character hex string format before constructing ObjectId.
 */
export const toObjectId = (value: unknown): mongoose.Types.ObjectId | null => {
    if (!value) return null;
    if (value instanceof mongoose.Types.ObjectId) return value;

    if (typeof value === 'string' && OBJECT_ID_REGEX.test(value)) {
        return new mongoose.Types.ObjectId(value);
    }

    if (
        typeof value === 'object' &&
        typeof (value as { toString?: () => string }).toString === 'function'
    ) {
        const maybeId = (value as { toString: () => string }).toString();
        if (OBJECT_ID_REGEX.test(maybeId)) {
            return new mongoose.Types.ObjectId(maybeId);
        }
    }

    return null;
};

/**
 * Require valid ObjectId or throw error.
 * Preferred pattern for explicit CodeQL taint barrier in command handlers.
 */
export const requireObjectId = (value: unknown, fieldName: string = 'id'): mongoose.Types.ObjectId => {
    const oid = toObjectId(value);
    if (!oid) {
        throw new Error(`Invalid format for ${fieldName}: Expected 24-character hex ID, received "${String(value)}"`);
    }
    return oid;
};

/**
 * Converts a value to a hex string representing an ObjectId, or null.
 */
export const toObjectIdString = (value: unknown): string | null => {
    const oid = toObjectId(value);
    return oid ? oid.toHexString() : null;
};

/**
 * Generates a new 24-character hexadecimal ID (compatible with Mongoose ObjectId)
 * to allow ID generation in the application layer without leaking mongoose.
 */
export const generateId = (): string => {
    return new mongoose.Types.ObjectId().toHexString();
};
