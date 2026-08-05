import React, { useState, useCallback, useRef } from 'react';
import { View, FlatList, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Screen, Container, AppText, AppInput, AppIcon } from '@esparex/mobile-ui';
import { useChatThread } from '../hooks/useChatThread';
import { useSendMessage } from '../hooks/useSendMessage';
import { IMessageDTO } from '@esparex/contracts';
import { ErrorState } from '../../../common/components/ErrorState';

interface ChatThreadScreenProps {
  conversationId: string;
  currentUserId?: string;
  onBack?: () => void;
}

export const ChatThreadScreen: React.FC<ChatThreadScreenProps> = ({
  conversationId,
  currentUserId = 'usr-me',
  onBack,
}) => {
  const { data: messages, isLoading, isError, refetch } = useChatThread(conversationId);
  const sendMessageMutation = useSendMessage();
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const handleSend = useCallback(() => {
    const trimmed = inputText.trim();
    if (!trimmed || sendMessageMutation.isPending) return;

    sendMessageMutation.mutate(
      { conversationId, text: trimmed },
      {
        onSuccess: () => {
          setInputText('');
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        },
      }
    );
  }, [inputText, conversationId, sendMessageMutation]);

  const renderMessageItem = useCallback(
    ({ item }: { item: IMessageDTO }) => {
      const isMine = item.senderId === currentUserId;
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
                ? 'bg-sky-500 rounded-tr-none text-white'
                : 'bg-slate-200 dark:bg-slate-800 rounded-tl-none'
            }`}
          >
            <AppText
              variant="body"
              className={isMine ? 'text-white font-medium' : 'text-slate-900 dark:text-slate-100 font-medium'}
            >
              {item.text}
            </AppText>
            {formattedTime ? (
              <AppText
                variant="caption"
                className={`text-[10px] text-right mt-1 ${
                  isMine ? 'text-sky-100' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {formattedTime}
              </AppText>
            ) : null}
          </View>
        </View>
      );
    },
    [currentUserId]
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
              <AppIcon name="ArrowLeft" size={20} color="#0ea5e9" />
            </TouchableOpacity>
          )}
          <AppText variant="h3" className="font-bold text-slate-900 dark:text-white flex-1">
            Chat Thread
          </AppText>
        </View>

        {/* Keyboard-aware Message Feed */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <FlatList
            ref={flatListRef}
            data={messages || []}
            keyExtractor={(item) => item.id}
            renderItem={renderMessageItem}
            contentContainerStyle={{ padding: 16, paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            windowSize={10}
            maxToRenderPerBatch={10}
            initialNumToRender={15}
            removeClippedSubviews={true}
          />

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
                inputText.trim() ? 'bg-sky-500' : 'bg-slate-200 dark:bg-slate-800'
              }`}
              accessibilityLabel="Send message"
            >
              <AppIcon name="Send" size={18} color={inputText.trim() ? '#ffffff' : '#94a3b8'} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Container>
    </Screen>
  );
};
