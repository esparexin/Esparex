import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('../../../../../bootstrap', () => ({
  services: {
    chatService: {
      getMessages: jest.fn(),
      sendMessage: jest.fn(),
    },
  },
}));

jest.mock('lucide-react-native', () => {
  const { View } = require('react-native');
  return new Proxy(
    {},
    {
      get: () => View,
    }
  );
});

import { ChatThreadScreen } from '../ChatThreadScreen';
import { useChatThread } from '../../hooks/useChatThread';
import { useSendMessage } from '../../hooks/useSendMessage';
import { IMessageDTO } from '@esparex/contracts';

jest.mock('../../hooks/useChatThread');
jest.mock('../../hooks/useSendMessage');

const mockUseChatThread = useChatThread as jest.MockedFunction<typeof useChatThread>;
const mockUseSendMessage = useSendMessage as jest.MockedFunction<typeof useSendMessage>;

describe('ChatThreadScreen Component', () => {
  let queryClient: QueryClient;

  const sampleMessages: IMessageDTO[] = [
    {
      id: 'msg-10',
      conversationId: 'conv-99',
      senderId: 'usr-seller',
      text: 'Yes, original Honda City headlight is in stock.',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'msg-11',
      conversationId: 'conv-99',
      senderId: 'usr-me',
      text: 'Great, what is the best price?',
      createdAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    jest.clearAllMocks();
  });

  const renderScreen = (props = {}) =>
    render(
      <QueryClientProvider client={queryClient}>
        <ChatThreadScreen conversationId="conv-99" currentUserId="usr-me" {...props} />
      </QueryClientProvider>
    );

  it('renders chat thread message bubbles', () => {
    mockUseChatThread.mockReturnValue({
      data: sampleMessages,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    } as any);

    mockUseSendMessage.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
    } as any);

    const { getByText } = renderScreen();
    expect(getByText('Chat Thread')).toBeTruthy();
    expect(getByText('Yes, original Honda City headlight is in stock.')).toBeTruthy();
    expect(getByText('Great, what is the best price?')).toBeTruthy();
  });

  it('sends message when Send button is pressed', () => {
    const mockMutate = jest.fn();

    mockUseChatThread.mockReturnValue({
      data: sampleMessages,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    } as any);

    mockUseSendMessage.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    } as any);

    const { getByPlaceholderText, getByLabelText } = renderScreen();

    fireEvent.changeText(getByPlaceholderText('Type a message...'), 'Can you deliver by Friday?');
    fireEvent.press(getByLabelText('Send message'));

    expect(mockMutate).toHaveBeenCalledWith(
      { conversationId: 'conv-99', text: 'Can you deliver by Friday?' },
      expect.any(Object)
    );
  });
});
