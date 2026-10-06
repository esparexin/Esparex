import type { ClientSession } from 'mongoose';
import { syncConversationAvailabilityForListing as syncAvailability } from '../domains/communications/application/services/ChatAvailabilityService';
import type {
    ChatAvailabilityPort,
    ChatAvailabilityListingState,
} from '../domains/communications/ports/ChatAvailabilityPort';

/**
 * Wired `ChatAvailabilityPort` (P1-5).
 *
 * `core/src/models/Ad.ts` routes its post-save / post-findOneAndUpdate
 * chat-availability sync through this composition export instead of importing
 * the communications domain application service directly from a Mongoose
 * model file. The port keeps the domain boundary clean: the model depends
 * only on the composition wiring, never on domain internals.
 */
export const chatAvailability: ChatAvailabilityPort = {
    syncConversationAvailabilityForListing: (
        listing: ChatAvailabilityListingState,
        session?: unknown
    ): Promise<void> =>
        syncAvailability(
            listing,
            (session as ClientSession | null | undefined) ?? undefined
        ),
};
