import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { AppText, AppIcon } from '@esparex/mobile-ui';
import { base } from '@esparex/design-tokens';

interface RecentSearchesSectionProps {
  recentSearches: string[];
  onSelect: (keyword: string) => void;
  onRemove: (keyword: string) => void;
  onClearAll: () => void;
}

export const RecentSearchesSection: React.FC<RecentSearchesSectionProps> = ({
  recentSearches,
  onSelect,
  onRemove,
  onClearAll,
}) => {
  if (recentSearches.length === 0) return null;

  return (
    <View className="mb-6">
      <View className="flex-row items-center justify-between mb-2.5">
        <AppText variant="caption" className="text-foreground-subtle uppercase font-semibold tracking-wider">
          Recent Searches
        </AppText>
        <TouchableOpacity
          onPress={onClearAll}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Clear all recent searches"
        >
          <AppText variant="caption" className="text-brand-600 font-semibold">
            Clear All
          </AppText>
        </TouchableOpacity>
      </View>

      <View className="flex-row flex-wrap gap-2">
        {recentSearches.map((item) => (
          <View
            key={item}
            className="flex-row items-center bg-muted px-3 py-1.5 rounded-full border border-border"
          >
            <TouchableOpacity
              onPress={() => onSelect(item)}
              className="flex-row items-center"
              accessibilityRole="button"
              accessibilityLabel={`Search for ${item}`}
            >
              <AppIcon name="Clock" size={13} color={base.slate[500]} />
              <AppText variant="caption" className="text-foreground-secondary font-medium ml-1.5 mr-1">
                {item}
              </AppText>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onRemove(item)}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${item} from recent searches`}
            >
              <AppIcon name="X" size={12} color={base.slate[400]} />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
};
