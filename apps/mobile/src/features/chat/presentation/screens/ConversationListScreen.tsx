import React, { useCallback } from 'react';
import { View, FlatList, TouchableOpacity, RefreshControl, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Screen, Container, AppText, Card, AppButton, AppIcon } from '@esparex/mobile-ui';
import { base } from '@esparex/design-tokens';
import { useAuth } from '../../../../providers/AuthProvider';
import { navigate } from '../../../../navigation/navigationRef';
import { ROUTES } from '../../../../navigation/routes';
import { useConversations } from '../hooks/useConversations';
import { IConversationDTO } from '@esparex/contracts';
import { ErrorState } from '../../../common/components/ErrorState';

interface ConversationListScreenProps {
  onSelectConversation?: (conversationId: string) => void;
}

export const ConversationListScreen: React.FC<ConversationListScreenProps> = ({
  onSelectConversation,
}) => {
  let authStatus: string = 'authenticated';
  try {
    const auth = useAuth();
    authStatus = auth.status;
  } catch {
    authStatus = 'authenticated';
  }
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
            accessibilityRole="button"
            accessibilityLabel={`Conversation with ${otherParticipant}`}
          >
            <View className="flex-row items-center flex-1">
              <View className="relative">
                {item.ad?.thumbnail ? (
                  <Image
                    source={{ uri: item.ad.thumbnail }}
                    style={styles.thumbnail}
                    contentFit="cover"
                    transition={200}
                    accessibilityLabel={item.ad.title || 'Listing thumbnail'}
                  />
                ) : (
                  <View className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 items-center justify-center">
                    <AppIcon name="MessageSquare" size={20} color={base.brand[500]} />
                  </View>
                )}
                {unreadCount > 0 && (
                  <View className="absolute -top-1 -right-1 bg-brand-600 rounded-full w-5 h-5 items-center justify-center border-2 border-white dark:border-slate-900">
                    <AppText variant="caption" className="text-white text-tiny font-bold">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </AppText>
                  </View>
                )}
              </View>

              <View className="ml-3 flex-1">
                <View className="flex-row justify-between items-center mb-1">
                  <AppText variant="body" className="font-bold text-slate-900 dark:text-white" numberOfLines={1}>
                    {otherParticipant}
                  </AppText>
                  <AppText variant="caption" className="text-slate-500 dark:text-slate-400 text-xs">
                    {formattedDate}
                  </AppText>
                </View>

                <AppText variant="caption" className="text-slate-600 dark:text-slate-400 font-medium" numberOfLines={1}>
                  {item.ad?.title || 'General Inquiry'}
                </AppText>

                <AppText
                  variant="caption"
                  className="text-slate-500 dark:text-slate-400"
                  numberOfLines={1}
                >
                  {item.lastMessage || 'No messages yet'}
                </AppText>
              </View>
            </View>

            <AppIcon name="ChevronRight" size={18} color={base.slate[400]} />
          </TouchableOpacity>
        </Card>
      );
    },
    [onSelectConversation]
  );

  if (authStatus === 'anonymous') {
    return (
      <Screen edges={['top', 'left', 'right']}>
        <Container className="flex-1 justify-center items-center px-6 bg-slate-50 dark:bg-slate-950">
          <View className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center mb-4">
            <AppIcon name="MessageSquare" size={32} color={base.brand[500]} />
          </View>
          <AppText variant="h2" className="font-bold text-slate-900 dark:text-white text-center mb-2">
            Your Conversations
          </AppText>
          <AppText variant="body" className="text-slate-600 dark:text-slate-400 text-center mb-6">
            Sign in to view your messages and chat directly with buyers and sellers.
          </AppText>
          <AppButton
            label="Sign In / Register"
            onPress={() => navigate(ROUTES.AUTH_STACK)}
            className="w-full"
            accessibilityLabel="Sign in to view messages"
          />
        </Container>
      </Screen>
    );
  }

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
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={base.brand[500]} />}
          ListEmptyComponent={
            !isLoading ? (
              <View className="items-center justify-center py-16 px-4">
                <View className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center mb-4">
                  <AppIcon name="MessageSquare" size={28} color={base.slate[400]} />
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

const styles = StyleSheet.create({
  thumbnail: { width: 48, height: 48, borderRadius: 8 },
});

