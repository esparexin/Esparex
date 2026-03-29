import type { ClientSession } from 'mongoose';
import { AD_STATUS } from '@shared/enums/adStatus';
import { Conversation } from '../models/Conversation';
import logger from '../utils/logger';

export type ListingChatState = {
  _id?: unknown;
  status?: string | null;
  isDeleted?: boolean | null;
  isChatLocked?: boolean | null;
} | null | undefined;

export const CHAT_CLOSED_STATUSES = new Set<string>([
  AD_STATUS.SOLD,
  AD_STATUS.EXPIRED,
  AD_STATUS.DEACTIVATED,
  AD_STATUS.REJECTED,
  AD_STATUS.DELETED,
  AD_STATUS.SUSPENDED,
  AD_STATUS.BANNED,
  AD_STATUS.INACTIVE,
]);

const normalizeStatus = (value: unknown): string =>
  typeof value === 'string' ? value.trim().toLowerCase() : '';

export function isListingChatClosed(listing: ListingChatState): boolean {
  if (!listing) return true;

  return Boolean(
    listing.isDeleted ||
    listing.isChatLocked ||
    CHAT_CLOSED_STATUSES.has(normalizeStatus(listing.status))
  );
}

export async function syncConversationAvailabilityForListing(
  listing: ListingChatState,
  session?: ClientSession | null
): Promise<void> {
  const listingId = listing?._id != null ? String(listing._id) : '';
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
