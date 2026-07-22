import { LISTING_STATUS } from '@esparex/contracts';
import type { LifecycleStatus } from '@esparex/contracts';
import type { ClientSession } from 'mongoose';
import { Conversation } from '../../../../models/Conversation';
import logger from '../../../../utils/logger';

export type ListingChatState = {
  _id?: unknown;
  status?: string | null;
  isDeleted?: boolean | null;
  isChatLocked?: boolean | null;
} | null | undefined;

export const CHAT_CLOSED_STATUSES = new Set<LifecycleStatus>([
  LISTING_STATUS.SOLD,
  LISTING_STATUS.EXPIRED,
  LISTING_STATUS.DEACTIVATED,
  LISTING_STATUS.REJECTED,
  LISTING_STATUS.DELETED,
  LISTING_STATUS.SUSPENDED,
  LISTING_STATUS.BANNED,
  LISTING_STATUS.INACTIVE,
]);

const normalizeStatus = (value: unknown): string =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

export function isListingChatClosed(listing: ListingChatState): boolean {
  if (!listing) return true;

  return Boolean(
    listing.isDeleted ||
    listing.isChatLocked ||
    CHAT_CLOSED_STATUSES.has(normalizeStatus(listing.status) as LifecycleStatus)
  );
}

export async function syncConversationAvailabilityForListing(
  listing: ListingChatState,
  session?: ClientSession | null
): Promise<void> {
  const listingId = listing?._id != undefined ? String(listing._id) : '';
  if (!listingId) return;

  const isClosed = isListingChatClosed(listing);

  try {
    const query = Conversation.updateMany(
      {
        adId: listingId,
        isAdClosed: { $ne: isClosed },
      },
      {
        $set: { isAdClosed: isClosed },
      }
    );

    if (session) {
      query.session(session);
    }

    await query;
  } catch (error) {
    logger.error('[ChatAvailability] Failed to sync conversation availability', {
      listingId,
      isClosed,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
