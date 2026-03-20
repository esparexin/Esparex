
/**
 * Decision logic for Bottom Action Bar actions.
 * 
 * Determines which actions are available to the user based on their context (owner vs visitor, sold status).
 * Returns strict variation strings to be consumed by the UI.
 * 
 * @param isOwner - Boolean result from isAdOwner
 * @param isSold - Boolean result from isAdSold
 * @returns 'owner' | 'visitor' | 'sold-owner'
 */

export type ActionBarVariant = 'owner' | 'visitor' | 'sold-owner' | 'pending-owner' | 'hidden';

export const getActionBarVariant = (isOwner: boolean, isSold: boolean, status?: string): ActionBarVariant => {
    if (isOwner) {
        if (status === "pending") {
            return 'pending-owner';
        }
        if (isSold) {
            // Owner viewing their own sold ad -> Show "Marked as Sold" status bar
            return 'sold-owner'; // Logic maps to existing UI variant which handles sold state
        }
        if (status === "live") {
            return 'owner';
        }
        return 'hidden';
    }

    // Visitor logic
    return 'visitor';
};

// Also export specific feature flags if needed
export const canCall = (isOwner: boolean) => !isOwner;
export const canEdit = (isOwner: boolean, isSold: boolean) => isOwner && !isSold;
export const canPromote = (isOwner: boolean, isSold: boolean, status?: string) => isOwner && !isSold && status === "live";
