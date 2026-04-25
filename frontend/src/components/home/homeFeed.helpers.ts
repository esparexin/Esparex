// Helper functions for HomeFeed without TypeScript types

const getAdId = (ad) => {
    const value = ad?.id;
    if (typeof value === "string" || typeof value === "number") {
        return String(value).trim();
    }
    return "";
};

const normalizeString = (value) =>
    typeof value === "string" ? value.trim() : "";

const toNumber = (value) =>
    typeof value === "number" && Number.isFinite(value) ? value : Number.NaN;

const toPrimaryImage = (ad) => {
    if (Array.isArray(ad.images) && typeof ad.images[0] === "string") {
        return ad.images[0].trim();
    }
    if (typeof ad.image === "string") {
        return ad.image.trim();
    }
    return "";
};

const getLocationSignature = (ad) => {
    const location = ad.location;
    if (!location || typeof location !== "object") return "";
    const record = location;
    return [
        normalizeString(record.city),
        normalizeString(record.state),
        normalizeString(record.display),
        normalizeString(record.address),
    ].join("|");
};

const isSameAdSnapshot = (left, right) => {
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

const replaceFeedPage = (currentAds, nextAds) => {
    if (currentAds.length === nextAds.length) {
        const isSameOrder = currentAds.every(
            (ad, index) => getAdId(ad) === getAdId(nextAds[index])
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

const appendUniqueFeedPage = (currentAds, nextAds) => {
    if (nextAds.length === 0) return currentAds;

    const seen = new Set(
        currentAds.map(getAdId).filter((value) => value.length > 0)
    );
    const additions = [];

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

// CommonJS export for Jest compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { replaceFeedPage, appendUniqueFeedPage };
}
