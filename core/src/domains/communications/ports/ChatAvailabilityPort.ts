/**
 * Port for syncing conversation availability when a listing's chat-relevant
 * state changes (P1-5).
 *
 * `core/src/models/Ad.ts` used to import the domain application service
 * `ChatAvailabilityService.syncConversationAvailabilityForListing` directly
 * from a Mongoose model file. It now routes through this port, wired in
 * `core/src/composition/chatAvailability.ts`. The port is pure domain
 * (no mongoose): the session is typed `unknown` and cast at the wiring site.
 */

export interface ChatAvailabilityListingState {
    _id?: unknown;
    status?: string | null;
    isDeleted?: boolean | null;
    isChatLocked?: boolean | null;
}

export interface ChatAvailabilityPort {
    syncConversationAvailabilityForListing(
        listing: ChatAvailabilityListingState,
        session?: unknown
    ): Promise<void>;
}
