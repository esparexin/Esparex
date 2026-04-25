import mongoose from 'mongoose';

export interface HomeFeedCursor {
    createdAt: string;
    id: string;
}

export type LocationLevel = 'country' | 'state' | 'district' | 'city' | 'area' | 'village';

export interface HomeFeedCursor {
    createdAt: string;
    id: string;
}

export interface HomeFeedRequest {
    cursor?: string | Partial<HomeFeedCursor>;
    limit?: number;
    location?: string;
    locationId?: string;
    level?: LocationLevel;
    lat?: number;
    lng?: number;
    radiusKm?: number;
    category?: string;
    categoryId?: string;
}

export type ParsedHomeFeedCursor = {

    createdAt: Date;
    id: string | null;
    mode: 'compound' | 'legacy';
};

const parseCursorObject = (raw: unknown): ParsedHomeFeedCursor | null => {
    if (!raw || typeof raw !== 'object') return null;
    const record = raw as Record<string, unknown>;
    const createdAtValue = record.createdAt;
    const idValue = record.id;
    if (typeof createdAtValue !== 'string') return null;
    const createdAt = new Date(createdAtValue);
    if (Number.isNaN(createdAt.getTime())) return null;
    const normalizedId = typeof idValue === 'string' && mongoose.Types.ObjectId.isValid(idValue)
        ? new mongoose.Types.ObjectId(idValue).toHexString()
        : null;
    return {
        createdAt,
        id: normalizedId,
        mode: normalizedId ? 'compound' : 'legacy'
    };
};

export const parseCursor = (cursor: string | Partial<HomeFeedCursor> | undefined): ParsedHomeFeedCursor | null => {
    if (!cursor) return null;

    if (typeof cursor === 'object') {
        return parseCursorObject(cursor);
    }

    if (typeof cursor !== 'string' || cursor.trim().length === 0) {
        return null;
    }

    const raw = cursor.trim();
    try {
        const parsedJson = JSON.parse(raw) as unknown;
        const parsedObjectCursor = parseCursorObject(parsedJson);
        if (parsedObjectCursor) return parsedObjectCursor;
    } catch {
        // Backward compatibility path: timestamp-only cursor string.
    }

    const legacyDate = new Date(raw);
    if (Number.isNaN(legacyDate.getTime())) return null;
    return {
        createdAt: legacyDate,
        id: null,
        mode: 'legacy'
    };
};

export const toCursorKey = (cursor: ParsedHomeFeedCursor | null): string => {
    if (!cursor) return 'start';
    const createdAtKey = cursor.createdAt.toISOString().replace(/[^a-z0-9]/gi, '_');
    if (!cursor.id) return `legacy_${createdAtKey}`;
    return `${createdAtKey}_${cursor.id}`;
};
