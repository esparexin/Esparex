import React from 'react';
import { View, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { AppText, AppIcon } from '@esparex/mobile-ui';
import { base } from '@esparex/design-tokens';
import { ListingQueryParams } from '@esparex/contracts';

interface FilterBarProps {
  filters: ListingQueryParams;
  activeFilterCount: number;
  onOpenFilterModal: () => void;
  onClearFilters: () => void;
  onRemoveCondition?: () => void;
  onRemovePrice?: () => void;
  onRemoveSort?: () => void;
  onRemoveVerifiedOnly?: () => void;
}

export const FilterBar = React.memo<FilterBarProps>(({
  filters,
  activeFilterCount,
  onOpenFilterModal,
  onClearFilters,
  onRemoveCondition,
  onRemovePrice,
  onRemoveSort,
  onRemoveVerifiedOnly,
}) => {
  return (
    <View className="py-2.5 px-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        {/* Main Filter Action Button */}
        <TouchableOpacity
          onPress={onOpenFilterModal}
          className="flex-row items-center bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-300 dark:border-slate-700"
          accessibilityLabel="Open filter sheet"
          accessibilityRole="button"
        >
          <AppIcon name="SlidersHorizontal" size={14} color={base.brand[500]} />
          <AppText variant="caption" className="font-semibold text-slate-800 dark:text-slate-200 ml-1.5">
            Filters
          </AppText>
          {activeFilterCount > 0 && (
            <View className="ml-1.5 bg-brand-600 rounded-full w-5 h-5 items-center justify-center">
              <AppText variant="tiny" className="text-white font-bold">
                {activeFilterCount}
              </AppText>
            </View>
          )}
        </TouchableOpacity>

        {/* Sort Chip */}
        {filters.sortBy && (
          <TouchableOpacity
            onPress={onRemoveSort}
            className="flex-row items-center bg-brand-50 dark:bg-brand-950/40 px-3 py-1.5 rounded-full border border-brand-200 dark:border-brand-800"
            accessibilityRole="button"
            accessibilityLabel={`Remove sort by ${filters.sortBy} filter`}
          >
            <AppText variant="caption" className="text-brand-700 dark:text-brand-300 font-medium mr-1">
              Sort: {filters.sortBy}
            </AppText>
            <AppIcon name="X" size={12} color={base.brand[600]} />
          </TouchableOpacity>
        )}

        {/* Condition Chip */}
        {filters.condition && (
          <TouchableOpacity
            onPress={onRemoveCondition}
            className="flex-row items-center bg-brand-50 dark:bg-brand-950/40 px-3 py-1.5 rounded-full border border-brand-200 dark:border-brand-800"
            accessibilityRole="button"
            accessibilityLabel={`Remove condition ${filters.condition} filter`}
          >
            <AppText variant="caption" className="text-brand-700 dark:text-brand-300 font-medium mr-1">
              Condition: {filters.condition}
            </AppText>
            <AppIcon name="X" size={12} color={base.brand[600]} />
          </TouchableOpacity>
        )}

        {/* Price Chip */}
        {(filters.minPrice !== undefined || filters.maxPrice !== undefined) && (
          <TouchableOpacity
            onPress={onRemovePrice}
            className="flex-row items-center bg-brand-50 dark:bg-brand-950/40 px-3 py-1.5 rounded-full border border-brand-200 dark:border-brand-800"
            accessibilityRole="button"
            accessibilityLabel={`Remove price filter`}
          >
            <AppText variant="caption" className="text-brand-700 dark:text-brand-300 font-medium mr-1">
              Price: ₹{filters.minPrice || 0} - ₹{filters.maxPrice || 'Any'}
            </AppText>
            <AppIcon name="X" size={12} color={base.brand[600]} />
          </TouchableOpacity>
        )}

        {/* Verified Sellers Only Chip */}
        {filters.verifiedOnly && (
          <TouchableOpacity
            onPress={onRemoveVerifiedOnly}
            className="flex-row items-center bg-brand-50 dark:bg-brand-950/40 px-3 py-1.5 rounded-full border border-brand-200 dark:border-brand-800"
            accessibilityRole="button"
            accessibilityLabel="Remove verified businesses only filter"
          >
            <AppIcon name="CheckCircle2" size={12} color={base.brand[600]} />
            <AppText variant="caption" className="text-brand-700 dark:text-brand-300 font-medium mx-1">
              Verified Businesses
            </AppText>
            <AppIcon name="X" size={12} color={base.brand[600]} />
          </TouchableOpacity>
        )}

        {/* Clear All Reset Action */}
        {activeFilterCount > 0 && (
          <TouchableOpacity
            onPress={onClearFilters}
            className="px-2 py-1.5"
            accessibilityRole="button"
            accessibilityLabel="Clear all filters"
          >
            <AppText variant="caption" className="text-red-500 font-semibold">
              Clear All
            </AppText>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
});

FilterBar.displayName = 'FilterBar';

const styles = StyleSheet.create({
  scrollContent: { alignItems: 'center', gap: 8 },
});

