import React from 'react';
import { Modal, View, TouchableOpacity, ModalProps } from 'react-native';
import { AppText } from '../atoms/AppText';
import { AppIcon } from '../atoms/AppIcon';
import { base } from '@esparex/design-tokens';

export interface AppModalSheetProps extends Omit<ModalProps, 'children'> {
  visible: boolean;
  onClose: () => void;
  title: string;
  maxHeightClass?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
}

export const AppModalSheet: React.FC<AppModalSheetProps> = ({
  visible,
  onClose,
  title,
  maxHeightClass = 'max-h-[85%]',
  headerRight,
  children,
  ...modalProps
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      accessibilityViewIsModal={true}
      {...modalProps}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className={`bg-surface rounded-t-3xl p-6 ${maxHeightClass} border-t border-border`}>
          {/* Header */}
          <View className="flex-row items-center justify-between pb-4 border-b border-border">
            <AppText variant="h3" className="font-bold text-foreground">
              {title}
            </AppText>
            <View className="flex-row items-center gap-2">
              {headerRight}
              <TouchableOpacity
                onPress={onClose}
                accessibilityLabel={`Close ${title}`}
                accessibilityRole="button"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <AppIcon name="X" size={20} color={base.slate[400]} />
              </TouchableOpacity>
            </View>
          </View>

          {children}
        </View>
      </View>
    </Modal>
  );
};
