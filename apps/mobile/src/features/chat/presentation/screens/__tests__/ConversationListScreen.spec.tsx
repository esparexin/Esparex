import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';

jest.mock('../../../../../bootstrap', () => ({
  services: {
    chatService: {
      getConversations: jest.fn(),
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

import { ConversationListScreen } from '../ConversationListScreen';
import { useConversations } from '../../hooks/useConversations';
import { IConversationDTO } from '@esparex/contracts';

jest.mock('../../hooks/useConversations');

const mockUseConversations = useConversations as jest.MockedFunction<typeof useConversations>;

describe('ConversationListScreen Component', () => {
  const sampleConversation: IConversationDTO = {
    id: 'conv-101',
    ad: { id: 'ad-55', title: 'Hyundai Creta Alloy Wheel 17 inch' },
    buyer: { id: 'usr-buyer', name: 'Vikas Kumar' },
    seller: { id: 'usr-me', name: 'My Spare Store' },
    lastMessage: 'Can you ship to Bangalore?',
    lastMessageAt: new Date().toISOString(),
    unreadBuyer: 1,
    unreadSeller: 0,
    isBlocked: false,
    isAdClosed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders conversations list items', () => {
    mockUseConversations.mockReturnValue({
      data: [sampleConversation],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    } as any);

    const { getByText } = render(<ConversationListScreen />);
    expect(getByText('Messages & Chats')).toBeTruthy();
    expect(getByText('My Spare Store')).toBeTruthy();
    expect(getByText('Hyundai Creta Alloy Wheel 17 inch')).toBeTruthy();
    expect(getByText('Can you ship to Bangalore?')).toBeTruthy();
  });

  it('triggers onSelectConversation callback when pressed', () => {
    mockUseConversations.mockReturnValue({
      data: [sampleConversation],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    } as any);

    const onSelectConversation = jest.fn();
    const { getByText } = render(
      <ConversationListScreen onSelectConversation={onSelectConversation} />
    );

    fireEvent.press(getByText('My Spare Store'));
    expect(onSelectConversation).toHaveBeenCalledWith('conv-101');
  });

  it('renders empty state when user has no conversations', () => {
    mockUseConversations.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
      isRefetching: false,
    } as any);

    const { getByText } = render(<ConversationListScreen />);
    expect(getByText('No Messages Yet')).toBeTruthy();
  });
});
