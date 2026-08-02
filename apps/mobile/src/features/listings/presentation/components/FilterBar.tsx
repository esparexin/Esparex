import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { AppText, AppIcon, Badge } from '@esparex/mobile-ui';
import { ListingQueryParams } from '@esparex/contracts';

interface FilterBarProps {
  filters: ListingQueryParams;
  activeFilterCount: number;
  onOpenFilterModal: () => void;
  onClearFilters: () => void;
  onRemoveCategory?: () => void;
  onRemoveCondition?: () => void;
  onRemovePrice?: () => void;
  onRemoveSort?: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  activeFilterCount,
  onOpenFilterModal,
  onClearFilters,
  onRemoveCondition,
  onRemovePrice,
  onRemoveSort,
}) => {
  return (
    <View className="py-2.5 px-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ alignItems: 'center', gap: 8 }}
      >
        {/* Main Filter Action Button */}
        <TouchableOpacity
          onPress={onOpenFilterModal}
          className="flex-row items-center bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-300 dark:border-slate-700"
          accessibilityLabel="Open filter sheet"
          accessibilityRole="button"
        >
          <AppIcon name="SlidersHorizontal" size={14} color="#0ea5e9" />
          <AppText variant="caption" className="font-semibold text-slate-800 dark:text-slate-200 ml-1.5">
            Filters
          </AppText>
          {activeFilterCount > 0 && (
            <View className="ml-1.5 bg-sky-500 rounded-full w-5 h-5 items-center justify-center">
              <AppText variant="caption" className="text-white text-[10px] font-bold">
                {activeFilterCount}
              </AppText>
            </View>
          )}
        </TouchableOpacity>

        {/* Sort Chip */}
        {filters.sortBy && (
          <TouchableOpacity
            onPress={onRemoveSort}
            className="flex-row items-center bg-sky-50 dark:bg-sky-950/40 px-3 py-1.5 rounded-full border border-sky-200 dark:border-sky-800"
          >
            <AppText variant="caption" className="text-sky-700 dark:text-sky-300 font-medium mr-1">
              Sort: {filters.sortBy}
            </AppText>
            <AppIcon name="X" size={12} color="#0284c7" />
          </TouchableOpacity>
        )}

        {/* Condition Chip */}
        {filters.condition && (
          <TouchableOpacity
            onPress={onRemoveCondition}
            className="flex-row items-center bg-sky-50 dark:bg-sky-950/40 px-3 py-1.5 rounded-full border border-sky-200 dark:border-sky-800"
          >
            <AppText variant="caption" className="text-sky-700 dark:text-sky-300 font-medium mr-1">
              Condition: {filters.condition}
            </AppText>
            <AppIcon name="X" size={12} color="#0284c7" />
          </TouchableOpacity>
        )}

        {/* Price Chip */}
        {(filters.minPrice !== undefined || filters.maxPrice !== undefined) && (
          <TouchableOpacity
            onPress={onRemovePrice}
            className="flex-row items-center bg-sky-50 dark:bg-sky-950/40 px-3 py-1.5 rounded-full border border-sky-200 dark:border-sky-800"
          >
            <AppText variant="caption" className="text-sky-700 dark:text-sky-300 font-medium mr-1">
              Price: ₹{filters.minPrice || 0} - ₹{filters.maxPrice || 'Any'}
            </AppText>
            <AppIcon name="X" size={12} color="#0284c7" />
          </TouchableOpacity>
        )}

        {/* Clear All Reset Action */}
        {activeFilterCount > 0 && (
          <TouchableOpacity
            onPress={onClearFilters}
            className="px-2 py-1.5"
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
};
