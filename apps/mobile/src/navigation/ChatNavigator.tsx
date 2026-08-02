import React, { useCallback } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ChatStackParamList, ROUTES } from './routes';
import { ConversationListScreen } from '../features/chat/presentation/screens/ConversationListScreen';
import { ChatThreadScreen } from '../features/chat/presentation/screens/ChatThreadScreen';

const Stack = createNativeStackNavigator<ChatStackParamList>();

// ---------------------------------------------------------------------------
// ChatNavigator — nested stack inside the Chat tab.
//
// CONVERSATION_LIST → select conversation → CHAT_THREAD (with header)
// ---------------------------------------------------------------------------

const ConversationListEntry = ({
  navigation,
}: NativeStackScreenProps<ChatStackParamList, typeof ROUTES.CONVERSATION_LIST>) => {
  const handleSelectConversation = useCallback(
    (conversationId: string) => {
      navigation.navigate(ROUTES.CHAT_THREAD, { conversationId });
    },
    [navigation],
  );

  return <ConversationListScreen onSelectConversation={handleSelectConversation} />;
};

const ChatThreadEntry = ({
  route,
  navigation,
}: NativeStackScreenProps<ChatStackParamList, typeof ROUTES.CHAT_THREAD>) => {
  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <ChatThreadScreen
      conversationId={route.params.conversationId}
      onBack={handleBack}
    />
  );
};

export const ChatNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name={ROUTES.CONVERSATION_LIST} component={ConversationListEntry} />
    <Stack.Screen name={ROUTES.CHAT_THREAD} component={ChatThreadEntry} />
  </Stack.Navigator>
);
