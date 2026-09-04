import React, { useState } from 'react';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { AppText, AppButton, AppInput, AppIcon, AppModalSheet } from '@esparex/mobile-ui';
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
  { label: 'Power On (Working)', value: 'power_on' },
  { label: 'Power Off (For Parts)', value: 'power_off' },
];

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  initialFilters,
  onClose,
  onApply,
  onReset,
}) => {
  const [sortBy, setSortBy] = useState<ListingQueryParams['sortBy']>(initialFilters.sortBy);
  const [condition, setCondition] = useState<string | undefined>(
    initialFilters.deviceCondition || initialFilters.condition
  );
  const [minPrice, setMinPrice] = useState<string>(
    initialFilters.minPrice !== undefined ? String(initialFilters.minPrice) : ''
  );
  const [maxPrice, setMaxPrice] = useState<string>(
    initialFilters.maxPrice !== undefined ? String(initialFilters.maxPrice) : ''
  );

  const handleApply = () => {
    const minVal = minPrice ? Number(minPrice) : undefined;
    const maxVal = maxPrice ? Number(maxPrice) : undefined;
    const devCond = (condition === 'power_on' || condition === 'power_off') ? condition : undefined;

    onApply({
      ...initialFilters,
      sortBy,
      condition,
      deviceCondition: devCond,
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
    <AppModalSheet
      visible={visible}
      onClose={onClose}
      title="Filter Listings"
    >
      <ScrollView showsVerticalScrollIndicator={false} className="my-4">
        {/* Sort Section */}
        <View className="mb-6">
          <AppText variant="h4" className="font-semibold text-foreground mb-3">
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
                    : 'bg-muted border-border'
                }`}
              >
                <AppText
                  variant="caption"
                  className={`font-medium ${
                    sortBy === opt.value ? 'text-white' : 'text-foreground'
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
          <AppText variant="h4" className="font-semibold text-foreground mb-3">
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
                    : 'bg-muted border-border'
                }`}
              >
                <AppText
                  variant="caption"
                  className={`font-medium ${
                    condition === opt.value ? 'text-white' : 'text-foreground'
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
          <AppText variant="h4" className="font-semibold text-foreground mb-3">
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
            <AppText variant="caption" className="text-foreground-secondary">
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
      <View className="flex-row gap-3 pt-3 border-t border-border">
        <AppButton variant="outline" onPress={handleResetInternal} className="flex-1">
          Reset
        </AppButton>
        <AppButton variant="primary" onPress={handleApply} className="flex-[2] bg-brand-600 hover:bg-brand-700">
          Apply Filters
        </AppButton>
      </View>
    </AppModalSheet>
  );
};
