import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { AppText, AppIcon } from '@esparex/mobile-ui';
import { base } from '@esparex/design-tokens';

export const TRENDING_KEYWORDS = [
  'iPhone 13 Screen',
  'MacBook Battery',
  'OLED Display',
  'Motherboard',
  'Charging Flex',
  'Camera Lens',
];

interface TrendingSearchesSectionProps {
  onSelect: (keyword: string) => void;
}

export const TrendingSearchesSection: React.FC<TrendingSearchesSectionProps> = ({ onSelect }) => {
  return (
    <View className="mb-6">
      <View className="flex-row items-center mb-2.5">
        <AppIcon name="TrendingUp" size={14} color={base.brand[600]} />
        <AppText variant="caption" className="text-foreground-subtle uppercase font-semibold tracking-wider ml-1.5">
          Trending Searches
        </AppText>
      </View>

      <View className="flex-row flex-wrap gap-2">
        {TRENDING_KEYWORDS.map((item) => (
          <TouchableOpacity
            key={item}
            onPress={() => onSelect(item)}
            className="flex-row items-center bg-brand-50 dark:bg-brand-950/40 px-3 py-1.5 rounded-full border border-brand-200 dark:border-brand-800"
            accessibilityRole="button"
            accessibilityLabel={`Search trending ${item}`}
          >
            <AppText variant="caption" className="text-brand-700 dark:text-brand-300 font-medium">
              {item}
            </AppText>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};
