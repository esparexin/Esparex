import React, { useCallback } from 'react';
import { View, FlatList, TouchableOpacity, RefreshControl, Linking } from 'react-native';
import { Screen, Container, AppText, Card, AppIcon } from '@esparex/mobile-ui';
import { base } from '@esparex/design-tokens';
import { useNotifications } from '../hooks/useNotifications';
import { useMarkNotificationRead } from '../hooks/useMarkNotificationRead';
import { AppNotification } from '../../domain/Notification';
import { ErrorState } from '../../../common/components/ErrorState';

export const NotificationScreen = () => {
  const { data: notifications, isLoading, isError, refetch, isRefetching } = useNotifications();
  const markReadMutation = useMarkNotificationRead();

  const handleMarkAllRead = useCallback(() => {
    markReadMutation.mutate(undefined);
  }, [markReadMutation]);

  const handleItemPress = useCallback(
    (item: AppNotification) => {
      if (!item.isRead) {
        markReadMutation.mutate(item.id);
      }
      const conversationId = (item.data?.conversationId || (item.data?.targetScreen === 'CHAT' ? item.data?.conversationId : undefined)) as string | undefined;
      const listingId = (item.data?.listingId || item.data?.adId) as string | undefined;
      if (conversationId) {
        void Linking.openURL(`esparex://chat/thread/${conversationId}`).catch(() => {});
      } else if (listingId) {
        void Linking.openURL(`esparex://listing/${listingId}`).catch(() => {});
      }
    },
    [markReadMutation]
  );

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'CHAT':
        return 'MessageSquare';
      case 'AD_STATUS':
        return 'Tag';
      case 'PRICE_DROP':
        return 'TrendingDown';
      case 'SMART_ALERT':
        return 'Bell';
      default:
        return 'Info';
    }
  };

  const renderNotificationItem = useCallback(
    ({ item }: { item: AppNotification }) => {
      const formattedDate = item.createdAt
        ? new Date(item.createdAt).toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })
        : '';

      return (
        <Card
          className={`mb-3 p-4 border-slate-200 dark:border-slate-800 ${
            item.isRead ? 'bg-white dark:bg-slate-900' : 'bg-sky-50/50 dark:bg-sky-950/20'
          }`}
        >
          <TouchableOpacity
            onPress={() => handleItemPress(item)}
            className="flex-row items-start justify-between"
          >
            {/* Icon */}
            <View
              className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                item.isRead ? 'bg-slate-100 dark:bg-slate-800' : 'bg-sky-100 dark:bg-sky-900/50'
              }`}
            >
              <AppIcon name={getNotificationIcon(item.type)} size={18} color={base.brand[500]} />
            </View>

            {/* Notification Body */}
            <View className="flex-1 mr-2">
              <View className="flex-row items-center justify-between mb-1">
                <AppText
                  variant="body"
                  className={`font-bold ${item.isRead ? 'text-slate-800 dark:text-slate-200' : 'text-slate-900 dark:text-white'}`}
                >
                  {item.title}
                </AppText>
                {!item.isRead && (
                  <View className="w-2 h-2 rounded-full bg-sky-500 ml-2" />
                )}
              </View>

              <AppText variant="caption" className="text-slate-600 dark:text-slate-400 mb-1">
                {item.body}
              </AppText>

              {formattedDate ? (
                <AppText variant="caption" className="text-slate-400 text-xs">
                  {formattedDate}
                </AppText>
              ) : null}
            </View>
          </TouchableOpacity>
        </Card>
      );
    },
    [handleItemPress]
  );

  if (isError) {
    return (
      <Screen>
        <ErrorState onRetry={refetch} />
      </Screen>
    );
  }

  const hasUnread = notifications?.some((n) => !n.isRead);

  return (
    <Screen edges={['top', 'left', 'right']}>
      <Container className="flex-1 bg-slate-50 dark:bg-slate-950 p-4">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4">
          <AppText variant="h2" className="font-bold text-slate-900 dark:text-white">
            Notifications
          </AppText>
          {hasUnread && (
            <TouchableOpacity onPress={handleMarkAllRead} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full">
              <AppText variant="caption" className="font-semibold text-sky-600 dark:text-sky-400">
                Mark all read
              </AppText>
            </TouchableOpacity>
          )}
        </View>

        {/* Notifications List */}
        <FlatList
          data={notifications || []}
          keyExtractor={(item) => item.id}
          renderItem={renderNotificationItem}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          removeClippedSubviews={true}
          windowSize={5}
          maxToRenderPerBatch={8}
          initialNumToRender={10}
          ListEmptyComponent={
            !isLoading ? (
              <View className="items-center justify-center py-16 px-4">
                <View className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center mb-4">
                  <AppIcon name="Bell" size={28} color={base.slate[400]} />
                </View>
                <AppText variant="h3" className="font-bold text-slate-800 dark:text-slate-200 mb-1">
                  No Notifications
                </AppText>
                <AppText variant="caption" className="text-slate-500 text-center">
                  You&apos;re all caught up! Updates regarding your ads, chats, and account will appear here.
                </AppText>
              </View>
            ) : null
          }
        />
      </Container>
    </Screen>
  );
};
