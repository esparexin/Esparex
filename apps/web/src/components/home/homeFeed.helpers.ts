import type { Listing as Ad } from "@/lib/api/user/listings";

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

const isSameAdSnapshot = (left: Ad, right: Ad): boolean => {
    if (!left || !right) return false;
    
    // Core identity & metadata check
    if (getAdId(left) !== getAdId(right)) return false;
    if (left.title !== right.title) return false;
    if (left.price !== right.price) return false;
    if (left.status !== right.status) return false;
    
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
