import React, { useState } from 'react';
import { Modal, View, TouchableOpacity, ScrollView } from 'react-native';
import { AppText, AppButton, AppInput, AppIcon } from '@esparex/mobile-ui';
import { base } from '@esparex/design-tokens';
import { ListingQueryParams } from '@esparex/contracts';

interface FilterModalProps {
  visible: boolean;
  initialFilters: ListingQueryParams;
  onClose: () => void;
  onApply: (filters: ListingQueryParams) => void;
  onReset: () => void;
}

const SORT_OPTIONS: Array<{ label: string; value: ListingQueryParams['sortBy'] }> = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Price: Low to High', value: 'price-low' },
  { label: 'Price: High to Low', value: 'price-high' },
  { label: 'Trending', value: 'trending' },
];

const CONDITION_OPTIONS = [
  { label: 'Brand New', value: 'new' },
  { label: 'Like New', value: 'used_like_new' },
  { label: 'Good', value: 'used_good' },
  { label: 'Fair', value: 'used_fair' },
];

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  initialFilters,
  onClose,
  onApply,
  onReset,
}) => {
  const [sortBy, setSortBy] = useState<ListingQueryParams['sortBy']>(initialFilters.sortBy);
  const [condition, setCondition] = useState<string | undefined>(initialFilters.condition);
  const [minPrice, setMinPrice] = useState<string>(
    initialFilters.minPrice !== undefined ? String(initialFilters.minPrice) : ''
  );
  const [maxPrice, setMaxPrice] = useState<string>(
    initialFilters.maxPrice !== undefined ? String(initialFilters.maxPrice) : ''
  );

  const handleApply = () => {
    const minVal = minPrice ? Number(minPrice) : undefined;
    const maxVal = maxPrice ? Number(maxPrice) : undefined;

    onApply({
      ...initialFilters,
      sortBy,
      condition,
      minPrice: minVal,
      maxPrice: maxVal,
      page: 1, // Explicitly reset pagination to page 1 on filter change
    });
    onClose();
  };

  const handleResetInternal = () => {
    setSortBy(undefined);
    setCondition(undefined);
    setMinPrice('');
    setMaxPrice('');
    onReset();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      accessibilityViewIsModal={true}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white dark:bg-slate-900 rounded-t-3xl p-6 max-h-[85%] border-t border-slate-200 dark:border-slate-800">
          {/* Header */}
          <View className="flex-row items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <AppText variant="h3" className="font-bold text-slate-900 dark:text-white">
              Filter Listings
            </AppText>
            <TouchableOpacity
              onPress={onClose}
              accessibilityLabel="Close filters"
              accessibilityRole="button"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <AppIcon name="X" size={20} color={base.slate[400]} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="my-4">
            {/* Sort Section */}
            <View className="mb-6">
              <AppText variant="h4" className="font-semibold text-slate-800 dark:text-slate-200 mb-3">
                Sort By
              </AppText>
              <View className="flex-row flex-wrap gap-2">
                {SORT_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => setSortBy(opt.value)}
                    className={`px-3.5 py-2 rounded-xl border ${
                      sortBy === opt.value
                        ? 'bg-brand-600 border-brand-600'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <AppText
                      variant="caption"
                      className={`font-medium ${
                        sortBy === opt.value ? 'text-white' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {opt.label}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Condition Section */}
            <View className="mb-6">
              <AppText variant="h4" className="font-semibold text-slate-800 dark:text-slate-200 mb-3">
                Condition
              </AppText>
              <View className="flex-row flex-wrap gap-2">
                {CONDITION_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => setCondition(condition === opt.value ? undefined : opt.value)}
                    className={`px-3.5 py-2 rounded-xl border ${
                      condition === opt.value
                        ? 'bg-brand-600 border-brand-600'
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <AppText
                      variant="caption"
                      className={`font-medium ${
                        condition === opt.value ? 'text-white' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {opt.label}
                    </AppText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Price Range Section */}
            <View className="mb-6">
              <AppText variant="h4" className="font-semibold text-slate-800 dark:text-slate-200 mb-3">
                Price Range (₹)
              </AppText>
              <View className="flex-row items-center gap-3">
                <View className="flex-1">
                  <AppInput
                    placeholder="Min Price"
                    keyboardType="numeric"
                    value={minPrice}
                    onChangeText={setMinPrice}
                  />
                </View>
                <AppText variant="caption" className="text-slate-400">
                  to
                </AppText>
                <View className="flex-1">
                  <AppInput
                    placeholder="Max Price"
                    keyboardType="numeric"
                    value={maxPrice}
                    onChangeText={setMaxPrice}
                  />
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View className="flex-row gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <AppButton variant="outline" onPress={handleResetInternal} className="flex-1">
              Reset
            </AppButton>
            <AppButton variant="primary" onPress={handleApply} className="flex-[2] bg-brand-600 hover:bg-brand-700">
              Apply Filters
            </AppButton>
          </View>
        </View>
      </View>
    </Modal>
  );
};

