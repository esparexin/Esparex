import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useChatThread } from '../useChatThread';
import { useSendMessage } from '../useSendMessage';
import { services } from '../../../../../bootstrap';
import { IMessageDTO } from '@esparex/contracts';

jest.mock('../../../../../bootstrap', () => ({
  services: {
    chatService: {
      getMessages: jest.fn(),
      sendMessage: jest.fn(),
    },
  },
}));

const mockGetMessages = services.chatService.getMessages as jest.MockedFunction<
  typeof services.chatService.getMessages
>;
const mockSendMessage = services.chatService.sendMessage as jest.MockedFunction<
  typeof services.chatService.sendMessage
>;

describe('useChatThread & useSendMessage hooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const sampleMessages: IMessageDTO[] = [
    {
      id: 'msg-1',
      conversationId: 'conv-100',
      senderId: 'usr-me',
      text: 'Is the Honda bumper still available?',
      createdAt: new Date().toISOString(),
    },
  ];

  it('fetches thread messages for conversation', async () => {
    mockGetMessages.mockResolvedValueOnce(sampleMessages);

    const { result } = renderHook(() => useChatThread('conv-100'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(sampleMessages);
    expect(mockGetMessages).toHaveBeenCalledWith('conv-100');
  });

  it('sends message via useSendMessage mutation', async () => {
    const newMessage: IMessageDTO = {
      id: 'msg-2',
      conversationId: 'conv-100',
      senderId: 'usr-me',
      text: 'Can I pick it up tomorrow?',
      createdAt: new Date().toISOString(),
    };

    mockSendMessage.mockResolvedValueOnce(newMessage);

    const { result } = renderHook(() => useSendMessage(), { wrapper });

    act(() => {
      result.current.mutate({ conversationId: 'conv-100', text: 'Can I pick it up tomorrow?' });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockSendMessage).toHaveBeenCalledWith('conv-100', 'Can I pick it up tomorrow?');
  });
});
