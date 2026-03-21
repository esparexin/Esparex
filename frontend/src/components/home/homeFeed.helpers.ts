import type { Ad } from "@/api/user/ads";

const getAdId = (ad: Ad): string => {
    const value = ad?.id;
    if (typeof value === "string" || typeof value === "number") {
        return String(value).trim();
    }
    return "";
};

const normalizeString = (value: unknown): string =>
    typeof value === "string" ? value.trim() : "";

const toNumber = (value: unknown): number =>
    typeof value === "number" && Number.isFinite(value) ? value : Number.NaN;

const toPrimaryImage = (ad: Ad): string => {
    if (Array.isArray(ad.images) && typeof ad.images[0] === "string") {
        return ad.images[0].trim();
    }
    if (typeof ad.image === "string") {
        return ad.image.trim();
    }
    return "";
};

const getLocationSignature = (ad: Ad): string => {
    const location = ad.location;
    if (!location || typeof location !== "object") return "";
    const record = location as Record<string, unknown>;
    return [
        normalizeString(record.city),
        normalizeString(record.state),
        normalizeString(record.display),
        normalizeString(record.address),
    ].join("|");
};

const isSameAdSnapshot = (left: Ad, right: Ad): boolean => {
    return (
        normalizeString(left.title) === normalizeString(right.title) &&
        normalizeString(left.description) === normalizeString(right.description) &&
        toNumber(left.price) === toNumber(right.price) &&
        normalizeString(left.status) === normalizeString(right.status) &&
        normalizeString(left.updatedAt) === normalizeString(right.updatedAt) &&
        normalizeString(left.createdAt) === normalizeString(right.createdAt) &&
        normalizeString(left.sellerName) === normalizeString(right.sellerName) &&
        normalizeString(left.time) === normalizeString(right.time) &&
        Boolean(left.isSpotlight) === Boolean(right.isSpotlight) &&
        toPrimaryImage(left) === toPrimaryImage(right) &&
        getLocationSignature(left) === getLocationSignature(right)
    );
};

export const replaceFeedPage = (currentAds: Ad[], nextAds: Ad[]): Ad[] => {
    if (currentAds.length === nextAds.length) {
        const isSameOrder = currentAds.every(
            (ad, index) => getAdId(ad) === getAdId(nextAds[index] as Ad)
        );
        if (isSameOrder) {
            const hasChanged = currentAds.some((ad, index) => {
                const nextAd = nextAds[index];
                return !nextAd || !isSameAdSnapshot(ad, nextAd);
            });
            return hasChanged ? nextAds : currentAds;
        }
    }

    return nextAds;
};

export const appendUniqueFeedPage = (currentAds: Ad[], nextAds: Ad[]): Ad[] => {
    if (nextAds.length === 0) return currentAds;

    const seen = new Set(
        currentAds.map(getAdId).filter((value) => value.length > 0)
    );
    const additions: Ad[] = [];

    for (const ad of nextAds) {
        const id = getAdId(ad);
        if (id && seen.has(id)) continue;
        if (id) {
            seen.add(id);
        }
        additions.push(ad);
    }

    if (additions.length === 0) {
        return currentAds;
    }

    return [...currentAds, ...additions];
};
