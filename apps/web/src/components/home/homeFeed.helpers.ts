import type { UserListing as Ad } from "@/lib/api/user/listings";

const getAdId = (ad: Ad): string => {
    const value = ad?.id;
    if (typeof value === "string" || typeof value === "number") {
        return String(value).trim();
    }
    return "";
};

const toPrimaryImage = (ad: Ad): string => {
    return ad?.images?.[0] || "";
};

const getLocationSignature = (ad: Ad): string => {
    const loc = ad?.location;
    if (!loc) return "";
    return [loc.city, loc.state, loc.country].filter(Boolean).join("-").toLowerCase();
};

const getListingTypeSignature = (ad: Ad): string => {
    const record = ad as Record<string, unknown>;
    return typeof record.listingType === "string" ? record.listingType.toLowerCase() : "";
};

const getConditionSignature = (ad: Ad): string => {
    const record = ad as Record<string, unknown>;
    const specs = record.specs as Record<string, unknown> | undefined;
    const specsCondition =
        specs && typeof specs.deviceCondition === "string"
            ? specs.deviceCondition
            : specs && typeof specs.condition === "string"
              ? specs.condition
              : "";
    const direct =
        typeof record.deviceCondition === "string"
            ? record.deviceCondition
            : typeof record.condition === "string"
              ? record.condition
              : "";
    return `${direct}|${specsCondition}`.toLowerCase();
};

const isSameAdSnapshot = (left: Ad, right: Ad): boolean => {
    if (!left || !right) return false;
    
    // Core identity & metadata check
    if (getAdId(left) !== getAdId(right)) return false;
    if (left.title !== right.title) return false;
    if (left.price !== right.price) return false;
    if (left.status !== right.status) return false;
    if (getListingTypeSignature(left) !== getListingTypeSignature(right)) return false;
    if (getConditionSignature(left) !== getConditionSignature(right)) return false;
    
    // Visuals & Location
    if (toPrimaryImage(left) !== toPrimaryImage(right)) return false;
    if (getLocationSignature(left) !== getLocationSignature(right)) return false;

    return true;
};

export const replaceFeedPage = (currentAds: Ad[], nextAds: Ad[]): Ad[] => {
    // If lengths differ, we definitely replace
    if (currentAds.length !== nextAds.length) return nextAds;

    const hasChanged = currentAds.some((ad, index) => {
        const nextAd = nextAds[index];
        return !nextAd || !isSameAdSnapshot(ad, nextAd);
    });

    return hasChanged ? nextAds : currentAds;
};

export const appendUniqueFeedPage = (currentAds: Ad[], nextAds: Ad[]): Ad[] => {
    if (!nextAds.length) return currentAds;

    const existingIds = new Set(
        currentAds.map(getAdId).filter((value) => value.length > 0)
    );

    const newAds = nextAds.filter((ad) => !existingIds.has(getAdId(ad)));

    if (newAds.length === 0) return currentAds;

    return [...currentAds, ...newAds];
};
