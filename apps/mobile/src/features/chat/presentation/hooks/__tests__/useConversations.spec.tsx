import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useConversations } from '../useConversations';
import { services } from '../../../../../bootstrap';
import { IConversationDTO } from '@esparex/contracts';

jest.mock('../../../../../providers/AuthProvider', () => ({
  useAuth: () => ({ status: 'authenticated' }),
}));

jest.mock('../../../../../bootstrap', () => ({
  services: {
    chatService: {
      getConversations: jest.fn(),
    },
  },
}));

const mockGetConversations = services.chatService.getConversations as jest.MockedFunction<
  typeof services.chatService.getConversations
>;

describe('useConversations hook', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  const sampleConversations: IConversationDTO[] = [
    {
      id: 'conv-1',
      ad: { id: 'ad-100', title: 'Brake Disc Pair Honda City' },
      buyer: { id: 'usr-buyer', name: 'Rahul Sharma' },
      seller: { id: 'usr-seller', name: 'Auto Parts India' },
      lastMessage: 'Is this price negotiable?',
      lastMessageAt: new Date().toISOString(),
      unreadBuyer: 0,
      unreadSeller: 2,
      isBlocked: false,
      isAdClosed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  it('fetches conversations list via chatService', async () => {
    mockGetConversations.mockResolvedValueOnce(sampleConversations);

    const { result } = renderHook(() => useConversations(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(sampleConversations);
    expect(mockGetConversations).toHaveBeenCalledTimes(1);
  });
});
