import mongoose from 'mongoose';
import { ParsedHomeFeedCursor } from './FeedCursorService';

export const PROMOTED_RATIO_CAP = 0.3;
export const PROMOTED_STREAK_CAP = 2;

export type FeedAdRecord = Record<string, unknown> & {
    _id?: unknown;
    id?: unknown;
    sellerId?: unknown;
    createdAt?: unknown;
    isSpotlight?: boolean;
    isBoosted?: boolean;
};

export type FeedMergeResult = {
    ads: FeedAdRecord[];
    hasRemaining: boolean;
};

export const extractAdId = (ad: FeedAdRecord): string => {
    const candidate = ad._id ?? ad.id;
    if (!candidate) return '';
    return String(candidate).trim();
};

export const toCreatedAtMs = (ad: FeedAdRecord): number => {
    const parsed = new Date(String(ad.createdAt ?? 0)).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
};

export const sortByCreatedAtDesc = (ads: FeedAdRecord[]): FeedAdRecord[] =>
    [...ads].sort((left, right) => toCreatedAtMs(right) - toCreatedAtMs(left));

export const compareObjectIdHex = (left: string, right: string): number => {
    if (left === right) return 0;
    return left < right ? -1 : 1;
};

export const extractObjectIdHex = (ad: FeedAdRecord): string | null => {
    const raw = ad._id ?? ad.id;
    if (raw instanceof mongoose.Types.ObjectId) {
        return raw.toHexString();
    }
    if (typeof raw === 'string' && mongoose.Types.ObjectId.isValid(raw)) {
        return new mongoose.Types.ObjectId(raw).toHexString();
    }
    return null;
};

export const filterBeforeCursor = (ads: FeedAdRecord[], cursor: ParsedHomeFeedCursor | null): FeedAdRecord[] => {
    if (!cursor) return ads;
    const cursorCreatedAtMs = cursor.createdAt.getTime();

    return ads.filter((ad) => {
        const createdAtMs = toCreatedAtMs(ad);
        if (createdAtMs < cursorCreatedAtMs) {
            return true;
        }
        if (createdAtMs > cursorCreatedAtMs) {
            return false;
        }

        if (!cursor.id) {
            return false;
        }

        const adIdHex = extractObjectIdHex(ad);
        if (!adIdHex) return false;
        return compareObjectIdHex(adIdHex, cursor.id) < 0;
    });
};

const findNextUnique = (
    source: FeedAdRecord[],
    startIndex: number,
    seen: Set<string>
): { nextIndex: number; ad?: FeedAdRecord } => {
    let index = startIndex;
    while (index < source.length) {
        const candidate = source[index];
        index += 1;
        if (!candidate) continue;
        const candidateId = extractAdId(candidate);
        if (!candidateId || seen.has(candidateId)) continue;
        return { nextIndex: index, ad: candidate };
    }
    return { nextIndex: source.length };
};

const hasMoreUnique = (source: FeedAdRecord[], startIndex: number, seen: Set<string>): boolean => {
    const probe = findNextUnique(source, startIndex, seen);
    return Boolean(probe.ad);
};

export const mergeRankedFeed = (
    spotlightAds: FeedAdRecord[],
    boostedAds: FeedAdRecord[],
    organicAds: FeedAdRecord[],
    limit: number
): FeedMergeResult => {
    const promotedQueue = [...sortByCreatedAtDesc(spotlightAds), ...sortByCreatedAtDesc(boostedAds)];
    const organicQueue = sortByCreatedAtDesc(organicAds);

    const promotedLimit = Math.floor(limit * PROMOTED_RATIO_CAP);
    const merged: FeedAdRecord[] = [];
    const seen = new Set<string>();
    let promotedIndex = 0;
    let organicIndex = 0;
    let promotedStreak = 0;
    let promotedCount = 0;

    while (merged.length < limit && (promotedIndex < promotedQueue.length || organicIndex < organicQueue.length)) {
        const canTakePromoted = (
            promotedIndex < promotedQueue.length &&
            promotedCount < promotedLimit &&
            promotedStreak < PROMOTED_STREAK_CAP
        );

        if (canTakePromoted) {
            const selection = findNextUnique(promotedQueue, promotedIndex, seen);
            promotedIndex = selection.nextIndex;
            if (selection.ad) {
                const adId = extractAdId(selection.ad);
                seen.add(adId);
                merged.push(selection.ad);
                promotedCount += 1;
                promotedStreak += 1;
                continue;
            }
        }

        if (organicIndex < organicQueue.length) {
            const selection = findNextUnique(organicQueue, organicIndex, seen);
            organicIndex = selection.nextIndex;
            if (selection.ad) {
                const adId = extractAdId(selection.ad);
                seen.add(adId);
                merged.push(selection.ad);
                promotedStreak = 0;
                continue;
            }
        }

        if (
            promotedIndex < promotedQueue.length &&
            promotedCount < promotedLimit &&
            promotedStreak < PROMOTED_STREAK_CAP
        ) {
            const selection = findNextUnique(promotedQueue, promotedIndex, seen);
            promotedIndex = selection.nextIndex;
            if (selection.ad) {
                const adId = extractAdId(selection.ad);
                seen.add(adId);
                merged.push(selection.ad);
                promotedCount += 1;
                promotedStreak += 1;
                continue;
            }
        }

        break;
    }

    return {
        ads: merged,
        hasRemaining:
            hasMoreUnique(promotedQueue, promotedIndex, seen) ||
            hasMoreUnique(organicQueue, organicIndex, seen)
    };
};
