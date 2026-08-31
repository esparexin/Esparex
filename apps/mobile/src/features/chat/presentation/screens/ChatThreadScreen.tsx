import React, { useState, useCallback, useRef } from 'react';
import { View, FlatList, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { Screen, Container, AppText, AppInput, AppIcon } from '@esparex/mobile-ui';
import { base } from '@esparex/design-tokens';
import { useChatThread } from '../hooks/useChatThread';
import { useSendMessage } from '../hooks/useSendMessage';
import { useProfile } from '../../../user/presentation/hooks/useProfile';
import { MobileChatMessageReceipt } from '../components/MobileChatMessageReceipt';
import type { IMessageDTO } from '@esparex/contracts';
import { ErrorState } from '../../../common/components/ErrorState';

interface ChatThreadScreenProps {
  conversationId: string;
  currentUserId?: string;
  onBack?: () => void;
}

const QUICK_REPLIES = [
  'Is this still available?',
  "What's your best price?",
  'Where is the item located?',
  'Can you share more photos?',
];

export const ChatThreadScreen: React.FC<ChatThreadScreenProps> = ({
  conversationId,
  currentUserId: currentUserIdProp,
  onBack,
}) => {
  const { data: userProfile } = useProfile();
  const activeUserId = currentUserIdProp || userProfile?.id || '';
  const { data: messages, isError, refetch } = useChatThread(conversationId);
  const sendMessageMutation = useSendMessage();
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const handleSend = useCallback(() => {
    const trimmed = inputText.trim();
    if (!trimmed || sendMessageMutation.isPending) return;

    const currentText = trimmed;
    setInputText('');

    sendMessageMutation.mutate(
      { conversationId, text: currentText, senderId: activeUserId },
      {
        onSuccess: () => {
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        },
      }
    );
  }, [inputText, conversationId, activeUserId, sendMessageMutation]);

  const handleRetry = useCallback(
    (tempId: string, text: string) => {
      sendMessageMutation.mutate({
        conversationId,
        text,
        senderId: activeUserId,
        tempId,
      });
    },
    [conversationId, activeUserId, sendMessageMutation]
  );

  const renderMessageItem = useCallback(
    ({ item }: { item: IMessageDTO }) => {
      const isMine = item.senderId === activeUserId;
      const formattedTime = item.createdAt
        ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '';

      if (item.isSystemMessage) {
        return (
          <View className="items-center my-2 px-4">
            <View className="bg-slate-200 dark:bg-slate-800 rounded-full px-3 py-1">
              <AppText variant="caption" className="text-slate-600 dark:text-slate-400 text-xs">
                {item.text}
              </AppText>
            </View>
          </View>
        );
      }

      return (
        <View className={`my-1.5 flex-row ${isMine ? 'justify-end' : 'justify-start'}`}>
          <View
            className={`max-w-[78%] rounded-2xl px-4 py-2.5 ${
              isMine
                ? 'bg-brand-600 rounded-tr-none text-white'
                : 'bg-slate-200 dark:bg-slate-800 rounded-tl-none'
            }`}
          >
            <AppText
              variant="body"
              className={isMine ? 'text-white font-medium' : 'text-slate-900 dark:text-slate-100 font-medium'}
            >
              {item.text}
            </AppText>
            <View className="flex-row items-center justify-end mt-1">
              {formattedTime ? (
                <AppText
                  variant="tiny"
                  className={isMine ? 'text-brand-100' : 'text-slate-500 dark:text-slate-400'}
                >
                  {formattedTime}
                </AppText>
              ) : null}
              <MobileChatMessageReceipt message={item} isMine={isMine} onRetry={handleRetry} />
            </View>
          </View>
        </View>
      );
    },
    [activeUserId, handleRetry]
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
      <Container className="flex-1 bg-slate-50 dark:bg-slate-950">
        {/* Header */}
        <View className="flex-row items-center p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          {onBack && (
            <TouchableOpacity onPress={onBack} className="mr-3" accessibilityLabel="Back to chat list">
              <AppIcon name="ArrowLeft" size={20} color={base.brand[500]} />
            </TouchableOpacity>
          )}
          <AppText variant="h3" className="font-bold text-slate-900 dark:text-white flex-1">
            Chat Thread
          </AppText>
        </View>

        {/* Keyboard-aware Message Feed */}
        <KeyboardAvoidingView
          style={styles.kavContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <FlatList
            ref={flatListRef}
            data={messages || []}
            keyExtractor={(item) => item.tempId || item.id}
            renderItem={renderMessageItem}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            windowSize={10}
            maxToRenderPerBatch={10}
            initialNumToRender={15}
            removeClippedSubviews={true}
          />

          {/* Quick Reply Chips */}
          <View className="py-2 px-3 border-t border-border bg-card">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ gap: 8 }}
            >
              {QUICK_REPLIES.map((reply) => (
                <TouchableOpacity
                  key={reply}
                  onPress={() => setInputText(reply)}
                  className="bg-brand-50 dark:bg-brand-950/40 px-3 py-1.5 rounded-full border border-brand-200 dark:border-brand-800"
                  accessibilityRole="button"
                  accessibilityLabel={`Quick reply: ${reply}`}
                >
                  <AppText variant="caption" className="text-brand-700 dark:text-brand-300 font-medium text-caption">
                    {reply}
                  </AppText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Input Composer */}
          <View className="flex-row items-center p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <View className="flex-1 mr-2">
              <AppInput
                placeholder="Type a message..."
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={handleSend}
              />
            </View>
            <TouchableOpacity
              onPress={handleSend}
              disabled={!inputText.trim() || sendMessageMutation.isPending}
              className={`w-11 h-11 rounded-full items-center justify-center ${
                inputText.trim() ? 'bg-brand-600' : 'bg-slate-200 dark:bg-slate-800'
              }`}
              accessibilityLabel="Send message"
            >
              <AppIcon name="Send" size={18} color={inputText.trim() ? base.white : base.slate[400]} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Container>
    </Screen>
  );
};

const styles = StyleSheet.create({
  kavContainer: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 20 },
});
