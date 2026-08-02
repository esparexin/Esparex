import { ChatService } from '../ChatService';
import { IChatRepository } from '../IChatRepository';
import { IConversationDTO, IMessageDTO } from '@esparex/contracts';

describe('ChatService Unit Tests', () => {
  let mockRepo: jest.Mocked<IChatRepository>;
  let chatService: ChatService;

  const sampleConversation: IConversationDTO = {
    id: 'conv-10',
    ad: { id: 'ad-1', title: 'Honda City Clutch Plate' },
    buyer: { id: 'usr-1', name: 'Rohan' },
    seller: { id: 'usr-2', name: 'Auto Spares' },
    unreadBuyer: 0,
    unreadSeller: 1,
    isBlocked: false,
    isAdClosed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const sampleMessage: IMessageDTO = {
    id: 'msg-1',
    conversationId: 'conv-10',
    senderId: 'usr-1',
    text: 'Hello, is this item available?',
    createdAt: new Date().toISOString(),
  };

  beforeEach(() => {
    mockRepo = {
      getConversations: jest.fn(),
      getConversationById: jest.fn(),
      getMessages: jest.fn(),
      sendMessage: jest.fn(),
      markRead: jest.fn(),
    };
    chatService = new ChatService(mockRepo);
  });

  it('delegates getConversations call to repository', async () => {
    mockRepo.getConversations.mockResolvedValueOnce([sampleConversation]);

    const result = await chatService.getConversations();
    expect(result).toEqual([sampleConversation]);
    expect(mockRepo.getConversations).toHaveBeenCalledTimes(1);
  });

  it('delegates getMessages call to repository', async () => {
    mockRepo.getMessages.mockResolvedValueOnce([sampleMessage]);

    const result = await chatService.getMessages('conv-10');
    expect(result).toEqual([sampleMessage]);
    expect(mockRepo.getMessages).toHaveBeenCalledWith('conv-10');
  });

  it('delegates sendMessage call to repository', async () => {
    mockRepo.sendMessage.mockResolvedValueOnce(sampleMessage);

    const result = await chatService.sendMessage('conv-10', 'Hello, is this item available?');
    expect(result).toEqual(sampleMessage);
    expect(mockRepo.sendMessage).toHaveBeenCalledWith('conv-10', 'Hello, is this item available?');
  });
});
