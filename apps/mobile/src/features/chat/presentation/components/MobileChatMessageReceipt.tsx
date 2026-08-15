import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { AppText, AppIcon } from '@esparex/mobile-ui';
import { base } from '@esparex/design-tokens';
import type { IMessageDTO } from '@esparex/contracts';

interface MobileChatMessageReceiptProps {
  message: IMessageDTO;
  isMine: boolean;
  onRetry?: (tempId: string, text: string) => void;
}

export const MobileChatMessageReceipt: React.FC<MobileChatMessageReceiptProps> = ({
  message,
  isMine,
  onRetry,
}) => {
  if (!isMine) return null;

  const status = message.deliveryStatus || (message.readAt ? 'read' : 'sent');

  if (status === 'sending') {
    return (
      <View className="flex-row items-center ml-1.5 opacity-80" accessibilityLabel="Message sending">
        <AppIcon name="Clock" size={11} color={base.brand[200] || '#93c5fd'} />
        <AppText variant="tiny" className="text-brand-100 ml-0.5">
          Sending...
        </AppText>
      </View>
    );
  }

  if (status === 'failed') {
    const handleRetryPress = () => {
      if (onRetry && (message.tempId || message.id)) {
        onRetry(message.tempId || message.id, message.text);
      }
    };

    return (
      <TouchableOpacity
        onPress={handleRetryPress}
        className="flex-row items-center ml-1.5 bg-red-500/20 px-1.5 py-0.5 rounded"
        accessibilityLabel="Failed to send message. Tap to retry"
        accessibilityRole="button"
      >
        <AppIcon name="AlertTriangle" size={11} color="#fca5a5" />
        <AppText variant="tiny" className="text-red-200 font-semibold ml-1">
          Failed · Retry
        </AppText>
      </TouchableOpacity>
    );
  }

  if (status === 'read') {
    return (
      <View className="flex-row items-center ml-1.5" accessibilityLabel="Message read">
        <AppIcon name="CheckCheck" size={12} color="#34d399" />
      </View>
    );
  }

  // Sent (single checkmark)
  return (
    <View className="flex-row items-center ml-1.5 opacity-90" accessibilityLabel="Message sent">
      <AppIcon name="Check" size={12} color={base.brand[100] || '#e0e7ff'} />
    </View>
  );
};
