import mongoose from 'mongoose';
import type { HomeFeedCursor, HomeFeedRequest } from '@esparex/contracts';

/**
 * Phase 3a (§5): the local `HomeFeedCursor` / `HomeFeedRequest` types are
 * relocated to `@esparex/contracts` (canonical owner per DECISION-GATE §3)
 * and imported here. Sibling feed services (`FeedCacheService`,
 * `FeedQueryService`) import `HomeFeedRequest` from this module and keep
 * working. Deletion of the local names is Phase 4 (§10).
 */
export type { HomeFeedCursor, HomeFeedRequest };

export type LocationLevel = 'country' | 'state' | 'district' | 'city' | 'area' | 'village';

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
