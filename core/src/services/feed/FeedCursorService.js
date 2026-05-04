"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toCursorKey = exports.parseCursor = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const parseCursorObject = (raw) => {
    if (!raw || typeof raw !== 'object')
        return null;
    const record = raw;
    const createdAtValue = record.createdAt;
    const idValue = record.id;
    if (typeof createdAtValue !== 'string')
        return null;
    const createdAt = new Date(createdAtValue);
    if (Number.isNaN(createdAt.getTime()))
        return null;
    const normalizedId = typeof idValue === 'string' && mongoose_1.default.Types.ObjectId.isValid(idValue)
        ? new mongoose_1.default.Types.ObjectId(idValue).toHexString()
        : null;
    return {
        createdAt,
        id: normalizedId,
        mode: normalizedId ? 'compound' : 'legacy'
    };
};
const parseCursor = (cursor) => {
    if (!cursor)
        return null;
    if (typeof cursor === 'object') {
        return parseCursorObject(cursor);
    }
    if (typeof cursor !== 'string' || cursor.trim().length === 0) {
        return null;
    }
    const raw = cursor.trim();
    try {
        const parsedJson = JSON.parse(raw);
        const parsedObjectCursor = parseCursorObject(parsedJson);
        if (parsedObjectCursor)
            return parsedObjectCursor;
    }
    catch {
        // Backward compatibility path: timestamp-only cursor string.
    }
    const legacyDate = new Date(raw);
    if (Number.isNaN(legacyDate.getTime()))
        return null;
    return {
        createdAt: legacyDate,
        id: null,
        mode: 'legacy'
    };
};
exports.parseCursor = parseCursor;
const toCursorKey = (cursor) => {
    if (!cursor)
        return 'start';
    const createdAtKey = cursor.createdAt.toISOString().replace(/[^a-z0-9]/gi, '_');
    if (!cursor.id)
        return `legacy_${createdAtKey}`;
    return `${createdAtKey}_${cursor.id}`;
};
exports.toCursorKey = toCursorKey;
//# sourceMappingURL=FeedCursorService.js.map