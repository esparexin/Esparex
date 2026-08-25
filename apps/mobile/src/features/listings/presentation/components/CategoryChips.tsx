import React from 'react';
import { ScrollView, TouchableOpacity, View, StyleSheet } from 'react-native';
import { AppText, AppIcon } from '@esparex/mobile-ui';
import { base } from '@esparex/design-tokens';
import { useCategories } from '../../../postAd/presentation/hooks/useCategories';

interface CategoryChipsProps {
  selectedCategoryId?: string;
  onSelectCategory: (categoryId?: string) => void;
}

export const CategoryChips: React.FC<CategoryChipsProps> = React.memo(({
  selectedCategoryId,
  onSelectCategory,
}) => {
  const { categories, isLoading } = useCategories();

  if (isLoading && categories.length === 0) {
    return null;
  }

  const isAllSelected = !selectedCategoryId;

  return (
    <View className="py-2 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* "All" Category Chip */}
        <TouchableOpacity
          onPress={() => onSelectCategory(undefined)}
          activeOpacity={0.7}
          className={`flex-row items-center px-3.5 py-1.5 rounded-full border ${
            isAllSelected
              ? 'bg-brand-500 border-brand-600 dark:bg-brand-600 dark:border-brand-500'
              : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
          }`}
          accessibilityRole="button"
          accessibilityState={{ selected: isAllSelected }}
          accessibilityLabel="All categories"
        >
          <AppIcon
            name="LayoutGrid"
            size={14}
            color={isAllSelected ? '#ffffff' : base.slate[600]}
          />
          <AppText
            variant="caption"
            className={`font-semibold ml-1.5 ${
              isAllSelected ? 'text-white' : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            All
          </AppText>
        </TouchableOpacity>

        {/* Dynamic Categories */}
        {categories.map((category) => {
          const isSelected = selectedCategoryId === category.id;
          return (
            <TouchableOpacity
              key={category.id}
              onPress={() => onSelectCategory(isSelected ? undefined : category.id)}
              activeOpacity={0.7}
              className={`flex-row items-center px-3.5 py-1.5 rounded-full border ${
                isSelected
                  ? 'bg-brand-500 border-brand-600 dark:bg-brand-600 dark:border-brand-500'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
              }`}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${category.name} category`}
            >
              <AppText
                variant="caption"
                className={`font-semibold ${
                  isSelected ? 'text-white' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {category.name}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
});

CategoryChips.displayName = 'CategoryChips';

const styles = StyleSheet.create({
  scrollContainer: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
});
