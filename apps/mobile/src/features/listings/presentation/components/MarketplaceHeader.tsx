import React from 'react';
import { View, Image, TouchableOpacity } from 'react-native';
import { AppText, AppIcon } from '@esparex/mobile-ui';
import { base } from '@esparex/design-tokens';

interface MarketplaceHeaderProps {
  selectedLocationDisplay: string;
  onOpenLocationModal: () => void;
}

export const MarketplaceHeader = ({
  selectedLocationDisplay,
  onOpenLocationModal,
}: MarketplaceHeaderProps) => {
  return (
    <View className="flex-row items-center justify-between px-4 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
      <Image
        source={require('../../../../../assets/logo.png')}
        style={{ width: 120, height: 28 }}
        resizeMode="contain"
        accessibilityRole="image"
        accessibilityLabel="Esparex Logo"
      />

      <TouchableOpacity
        onPress={onOpenLocationModal}
        className="flex-row items-center bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 max-w-[160px]"
        accessibilityRole="button"
        accessibilityLabel={`Current location: ${selectedLocationDisplay}. Tap to change location.`}
      >
        <AppIcon name="MapPin" size={13} color={base.brand[500]} />
        <AppText
          variant="caption"
          className="font-semibold text-slate-700 dark:text-slate-300 ml-1"
          numberOfLines={1}
        >
          {selectedLocationDisplay}
        </AppText>
      </TouchableOpacity>
    </View>
  );
};
