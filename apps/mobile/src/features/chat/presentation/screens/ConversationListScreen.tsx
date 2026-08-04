import React, { useCallback } from 'react';
import { View, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { Screen, Container, AppText, Card, AppIcon } from '@esparex/mobile-ui';
import { useConversations } from '../hooks/useConversations';
import { IConversationDTO } from '@esparex/contracts';
import { ErrorState } from '../../../common/components/ErrorState';

interface ConversationListScreenProps {
  onSelectConversation?: (conversationId: string) => void;
}

export const ConversationListScreen: React.FC<ConversationListScreenProps> = ({
  onSelectConversation,
}) => {
  const { data: conversations, isLoading, isError, refetch, isRefetching } = useConversations();

  const renderConversationItem = useCallback(
    ({ item }: { item: IConversationDTO }) => {
      const otherParticipant = item.seller.name || item.buyer.name || 'Chat User';
      const unreadCount = item.unreadBuyer || item.unreadSeller || 0;
      const formattedDate = item.lastMessageAt
        ? new Date(item.lastMessageAt).toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
          })
        : '';

      return (
        <Card className="mb-3 p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <TouchableOpacity
            onPress={() => onSelectConversation?.(item.id)}
            className="flex-row items-center justify-between"
          >
            {/* Thumbnail / Avatar */}
            <View className="relative mr-3">
              {item.ad.thumbnail ? (
                <Image
                  source={{ uri: item.ad.thumbnail }}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                  transition={150}
                  style={{ width: 48, height: 48, borderRadius: 8 }}
                  accessibilityLabel={`Thumbnail for ${item.ad.title}`}
                />
              ) : (
                <View className="w-12 h-12 rounded-full bg-sky-100 dark:bg-sky-900/40 items-center justify-center">
                  <AppIcon name="MessageSquare" size={20} color="#0ea5e9" />
                </View>
              )}
              {unreadCount > 0 && (
                <View className="absolute -top-1 -right-1 bg-red-500 rounded-full w-5 h-5 items-center justify-center">
                  <AppText variant="caption" className="text-white text-[10px] font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </AppText>
                </View>
              )}
            </View>

            {/* Conversation Details */}
            <View className="flex-1 mr-2">
              <View className="flex-row items-center justify-between mb-1">
                <AppText
                  variant="body"
                  className="font-bold text-slate-900 dark:text-white"
                  numberOfLines={1}
                >
                  {otherParticipant}
                </AppText>
                {formattedDate ? (
                  <AppText variant="caption" className="text-slate-400 text-xs">
                    {formattedDate}
                  </AppText>
                ) : null}
              </View>

              <AppText variant="caption" className="text-sky-600 dark:text-sky-400 font-medium mb-1">
                {item.ad.title}
              </AppText>

              <AppText
                variant="caption"
                className="text-slate-500 dark:text-slate-400"
                numberOfLines={1}
              >
                {item.lastMessage || 'No messages yet'}
              </AppText>
            </View>

            <AppIcon name="ChevronRight" size={18} color="#94a3b8" />
          </TouchableOpacity>
        </Card>
      );
    },
    [onSelectConversation]
  );

  if (isError) {
    return (
      <Screen>
        <ErrorState onRetry={refetch} />
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'left', 'right']}>
      <Container className="flex-1 bg-slate-50 dark:bg-slate-950 p-4">
        {/* Header */}
        <View className="mb-4">
          <AppText variant="h2" className="font-bold text-slate-900 dark:text-white">
            Messages & Chats
          </AppText>
        </View>

        {/* Conversation List */}
        <FlatList
          data={conversations || []}
          keyExtractor={(item) => item.id}
          renderItem={renderConversationItem}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={
            !isLoading ? (
              <View className="items-center justify-center py-16 px-4">
                <View className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center mb-4">
                  <AppIcon name="MessageSquare" size={28} color="#94a3b8" />
                </View>
                <AppText variant="h3" className="font-bold text-slate-800 dark:text-slate-200 mb-1">
                  No Messages Yet
                </AppText>
                <AppText variant="caption" className="text-slate-500 text-center">
                  Start inquiring about spare parts or listings to see your chats here.
                </AppText>
              </View>
            ) : null
          }
        />
      </Container>
    </Screen>
  );
};
