"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeRankedFeed = exports.filterBeforeCursor = exports.extractObjectIdHex = exports.compareObjectIdHex = exports.sortByCreatedAtDesc = exports.toCreatedAtMs = exports.extractAdId = exports.PROMOTED_STREAK_CAP = exports.PROMOTED_RATIO_CAP = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
exports.PROMOTED_RATIO_CAP = 0.3;
exports.PROMOTED_STREAK_CAP = 2;
const extractAdId = (ad) => {
    const candidate = ad._id ?? ad.id;
    if (!candidate)
        return '';
    return String(candidate).trim();
};
exports.extractAdId = extractAdId;
const toCreatedAtMs = (ad) => {
    const parsed = new Date(String(ad.createdAt ?? 0)).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
};
exports.toCreatedAtMs = toCreatedAtMs;
const sortByCreatedAtDesc = (ads) => [...ads].sort((left, right) => (0, exports.toCreatedAtMs)(right) - (0, exports.toCreatedAtMs)(left));
exports.sortByCreatedAtDesc = sortByCreatedAtDesc;
const compareObjectIdHex = (left, right) => {
    if (left === right)
        return 0;
    return left < right ? -1 : 1;
};
exports.compareObjectIdHex = compareObjectIdHex;
const extractObjectIdHex = (ad) => {
    const raw = ad._id ?? ad.id;
    if (raw instanceof mongoose_1.default.Types.ObjectId) {
        return raw.toHexString();
    }
    if (typeof raw === 'string' && mongoose_1.default.Types.ObjectId.isValid(raw)) {
        return new mongoose_1.default.Types.ObjectId(raw).toHexString();
    }
    return null;
};
exports.extractObjectIdHex = extractObjectIdHex;
const filterBeforeCursor = (ads, cursor) => {
    if (!cursor)
        return ads;
    const cursorCreatedAtMs = cursor.createdAt.getTime();
    return ads.filter((ad) => {
        const createdAtMs = (0, exports.toCreatedAtMs)(ad);
        if (createdAtMs < cursorCreatedAtMs) {
            return true;
        }
        if (createdAtMs > cursorCreatedAtMs) {
            return false;
        }
        if (!cursor.id) {
            return false;
        }
        const adIdHex = (0, exports.extractObjectIdHex)(ad);
        if (!adIdHex)
            return false;
        return (0, exports.compareObjectIdHex)(adIdHex, cursor.id) < 0;
    });
};
exports.filterBeforeCursor = filterBeforeCursor;
const findNextUnique = (source, startIndex, seen) => {
    let index = startIndex;
    while (index < source.length) {
        const candidate = source[index];
        index += 1;
        if (!candidate)
            continue;
        const candidateId = (0, exports.extractAdId)(candidate);
        if (!candidateId || seen.has(candidateId))
            continue;
        return { nextIndex: index, ad: candidate };
    }
    return { nextIndex: source.length };
};
const hasMoreUnique = (source, startIndex, seen) => {
    const probe = findNextUnique(source, startIndex, seen);
    return Boolean(probe.ad);
};
const mergeRankedFeed = (spotlightAds, boostedAds, organicAds, limit) => {
    const promotedQueue = [...(0, exports.sortByCreatedAtDesc)(spotlightAds), ...(0, exports.sortByCreatedAtDesc)(boostedAds)];
    const organicQueue = (0, exports.sortByCreatedAtDesc)(organicAds);
    const promotedLimit = Math.floor(limit * exports.PROMOTED_RATIO_CAP);
    const merged = [];
    const seen = new Set();
    let promotedIndex = 0;
    let organicIndex = 0;
    let promotedStreak = 0;
    let promotedCount = 0;
    while (merged.length < limit && (promotedIndex < promotedQueue.length || organicIndex < organicQueue.length)) {
        const canTakePromoted = (promotedIndex < promotedQueue.length &&
            promotedCount < promotedLimit &&
            promotedStreak < exports.PROMOTED_STREAK_CAP);
        if (canTakePromoted) {
            const selection = findNextUnique(promotedQueue, promotedIndex, seen);
            promotedIndex = selection.nextIndex;
            if (selection.ad) {
                const adId = (0, exports.extractAdId)(selection.ad);
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
                const adId = (0, exports.extractAdId)(selection.ad);
                seen.add(adId);
                merged.push(selection.ad);
                promotedStreak = 0;
                continue;
            }
        }
        if (promotedIndex < promotedQueue.length &&
            promotedCount < promotedLimit &&
            promotedStreak < exports.PROMOTED_STREAK_CAP) {
            const selection = findNextUnique(promotedQueue, promotedIndex, seen);
            promotedIndex = selection.nextIndex;
            if (selection.ad) {
                const adId = (0, exports.extractAdId)(selection.ad);
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
        hasRemaining: hasMoreUnique(promotedQueue, promotedIndex, seen) ||
            hasMoreUnique(organicQueue, organicIndex, seen)
    };
};
exports.mergeRankedFeed = mergeRankedFeed;
//# sourceMappingURL=FeedRankerService.js.map