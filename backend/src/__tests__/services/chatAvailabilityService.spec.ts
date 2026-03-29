jest.mock('../../models/Conversation', () => ({
  Conversation: {
    updateMany: jest.fn(),
  },
}));

import { Conversation } from '../../models/Conversation';
import {
  isListingChatClosed,
  syncConversationAvailabilityForListing,
} from '../../services/chatAvailabilityService';

const mockedConversation = Conversation as unknown as {
  updateMany: jest.Mock;
};

describe('chatAvailabilityService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedConversation.updateMany.mockReturnValue(Promise.resolve({ modifiedCount: 1 }));
  });

  it('treats sold and locked listings as chat-closed', () => {
    expect(isListingChatClosed({ status: 'sold' })).toBe(true);
    expect(isListingChatClosed({ isChatLocked: true })).toBe(true);
    expect(isListingChatClosed({ status: 'live', isDeleted: false, isChatLocked: false })).toBe(false);
    expect(isListingChatClosed(null)).toBe(true);
  });

  it('syncs conversation closed-state for a listing id', async () => {
    const session = { id: 'session-1' };
    const sessionQuery = {
      session: jest.fn().mockReturnValue(Promise.resolve({ modifiedCount: 2 })),
    };
    mockedConversation.updateMany.mockReturnValue(sessionQuery);

    await syncConversationAvailabilityForListing(
      { _id: '507f191e810c19729de860ea', status: 'deactivated' },
      session as never
    );

    expect(mockedConversation.updateMany).toHaveBeenCalledWith(
      {
        adId: '507f191e810c19729de860ea',
        isAdClosed: { $ne: true },
      },
      {
        $set: { isAdClosed: true },
      }
    );
    expect(sessionQuery.session).toHaveBeenCalledWith(session);
  });

  it('skips sync when the listing id is missing', async () => {
    await syncConversationAvailabilityForListing({ status: 'live' });
    expect(mockedConversation.updateMany).not.toHaveBeenCalled();
  });
});
