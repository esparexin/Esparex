jest.mock('../../models/Conversation', () => ({
  Conversation: {
    find: jest.fn(),
    countDocuments: jest.fn(),
  },
}));

jest.mock('../../models/ChatMessage', () => ({
  ChatMessage: {
    distinct: jest.fn(),
  },
}));

jest.mock('../../models/ChatReport', () => ({
  ChatReport: {
    distinct: jest.fn(),
  },
}));

jest.mock('../../models/Ad', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    distinct: jest.fn(),
  },
}));

jest.mock('../../models/User', () => ({
  User: {
    find: jest.fn(),
  },
}));

import { Conversation } from '../../models/Conversation';
import { ChatMessage } from '../../models/ChatMessage';
import { ChatReport } from '../../models/ChatReport';
import Ad from '../../models/Ad';
import { User } from '../../models/User';
import { adminListConversations } from '../../services/chatService';

const mockedConversation = Conversation as unknown as {
  find: jest.Mock;
  countDocuments: jest.Mock;
};

const mockedChatMessage = ChatMessage as unknown as {
  distinct: jest.Mock;
};

const mockedChatReport = ChatReport as unknown as {
  distinct: jest.Mock;
};

const mockedAd = Ad as unknown as {
  find: jest.Mock;
  distinct: jest.Mock;
};

const mockedUser = User as unknown as {
  find: jest.Mock;
};

function createLeanChain<T>(result: T) {
  return {
    select: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(result),
  };
}

function createConversationQueryChain(result: unknown[]) {
  return {
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    then: (resolve: (value: unknown[]) => unknown) => Promise.resolve(resolve(result)),
  };
}

describe('adminListConversations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedChatMessage.distinct.mockResolvedValue([]);
    mockedChatReport.distinct.mockResolvedValue([]);
    mockedAd.distinct.mockResolvedValue([]);
  });

  it('applies search matches for buyer, seller, and ad ids in the shared conversation query', async () => {
    const matchedUserId = '507f191e810c19729de860ea';
    const matchedAdId = '507f191e810c19729de860eb';

    mockedUser.find.mockReturnValue(
      createLeanChain([{ _id: matchedUserId }])
    );
    mockedAd.find.mockReturnValue(
      createLeanChain([{ _id: matchedAdId }])
    );

    mockedConversation.find.mockReturnValue(
      createConversationQueryChain([
        {
          _id: '507f191e810c19729de860ec',
          buyerId: { name: 'Buyer' },
          sellerId: { name: 'Seller' },
          adId: { title: 'Screen Repair' },
          updatedAt: '2026-03-27T00:00:00.000Z',
        },
      ])
    );
    mockedConversation.countDocuments.mockResolvedValue(1);

    const result = await adminListConversations('all', 0.8, 2, 20, 'screen');

    expect(mockedUser.find).toHaveBeenCalledWith({
      $or: [
        { name: expect.any(RegExp) },
        { mobile: expect.any(RegExp) },
      ],
    });
    expect(mockedAd.find).toHaveBeenCalledWith({ title: expect.any(RegExp) });
    expect(mockedConversation.find).toHaveBeenCalledWith({
      $and: [
        {
          $or: [
            { buyerId: { $in: [matchedUserId] } },
            { sellerId: { $in: [matchedUserId] } },
            { adId: { $in: [matchedAdId] } },
          ],
        },
      ],
    });
    expect(mockedConversation.countDocuments).toHaveBeenCalledWith({
      $and: [
        {
          $or: [
            { buyerId: { $in: [matchedUserId] } },
            { sellerId: { $in: [matchedUserId] } },
            { adId: { $in: [matchedAdId] } },
          ],
        },
      ],
    });
    expect(result.total).toBe(1);
    expect(result.convs[0]).toMatchObject({
      id: '507f191e810c19729de860ec',
      buyerName: 'Buyer',
      sellerName: 'Seller',
      adTitle: 'Screen Repair',
    });
  });
});
