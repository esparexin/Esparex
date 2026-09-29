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
      <View className="flex-row items-center ml-1.5" accessibilityLabel="Message sending">
        <AppIcon name="Clock" size={11} color={base.white} />
        <AppText variant="tiny" className="text-white font-medium ml-0.5">
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
        className="flex-row items-center ml-1.5 bg-destructive px-1.5 py-0.5 rounded"
        accessibilityLabel="Failed to send message. Tap to retry"
        accessibilityRole="button"
      >
        <AppIcon name="AlertTriangle" size={11} color={base.white} />
        <AppText variant="tiny" className="text-white font-semibold ml-1">
          Failed · Retry
        </AppText>
      </TouchableOpacity>
    );
  }

  if (status === 'read') {
    return (
      <View className="flex-row items-center ml-1.5" accessibilityLabel="Message read">
        <AppIcon name="CheckCheck" size={12} color={base.white} />
      </View>
    );
  }

  // Sent (single checkmark)
  return (
    <View className="flex-row items-center ml-1.5" accessibilityLabel="Message sent">
      <AppIcon name="Check" size={12} color={base.white} />
    </View>
  );
};
