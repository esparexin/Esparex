
/**
 * Logic for determining Ad Ownership.
 * 
 * Determines if the currently logged-in user is the owner of the given Ad.
 * 
 * @param ad - The ad object
 * @param user - The logged-in user object
 * @returns boolean
 */

type AdOwnerCandidate = {
    sellerId?: string | number;
};

type UserOwnerCandidate = {
    id?: string | number;
};

type OwnershipEntity = {
    sellerId?: string | number | null;
};

type OwnershipUser = {
    id?: string | number | null;
} | null;

export const canUserPerformAction = (
    entity: OwnershipEntity | null | undefined,
    user: OwnershipUser
): boolean => {
    if (!entity || !user) return false;
    if (!entity.sellerId || !user.id) return false;
    return String(entity.sellerId) === String(user.id);
};

export const isAdOwner = (ad: AdOwnerCandidate | null, user: UserOwnerCandidate | null): boolean => {
    return canUserPerformAction(ad, user);
};
