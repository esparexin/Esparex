import React from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { AppText, Center } from '@esparex/mobile-ui';
import type { IconName } from '@esparex/mobile-ui';
import { base } from '@esparex/design-tokens';
import { usePostAdDraft } from '../../usePostAdDraft';
import { useCategories } from '../hooks/useCategories';
import { useCategoryDependents } from '../hooks/useCategoryDependents';
import { CategoryCard } from '../components/CategoryCard';
import { BrandModelSection } from '../components/BrandModelSection';
import { DeviceConditionSection } from '../components/DeviceConditionSection';
import { SparePartsSection } from '../components/SparePartsSection';

/**
 * StepCategory — Step 1 of the Post Ad wizard (Item & Device Information).
 *
 * Responsibilities:
 * - 4-column compact category selector
 * - Brand & Model selection with proposal fallback
 * - Device Condition (Power On vs Power Off)
 * - Working / Available Spare Parts multi-select chips
 */
export const StepCategory = () => {
  const {
    state,
    setCategory,
    setBrand,
    setModel,
    setDeviceCondition,
    setSpareParts,
  } = usePostAdDraft();

  const { categories, isLoading: isLoadingCategories } = useCategories();
  const { draft } = state;
  const selectedCategoryId = draft.categoryId;
  const selectedBrandId = draft.brandId;
  const selectedModelId = draft.modelId;
  const selectedCondition = draft.deviceCondition;
  const selectedSpareParts = draft.spareParts || [];

  const {
    brands,
    models,
    spareParts,
    isLoadingBrands,
    isLoadingModels,
  } = useCategoryDependents(selectedCategoryId, selectedBrandId);

  const toggleSparePart = (partId: string) => {
    if (selectedSpareParts.includes(partId)) {
      setSpareParts(selectedSpareParts.filter((id) => id !== partId));
    } else {
      setSpareParts([...selectedSpareParts, partId]);
    }
  };

  if (isLoadingCategories) {
    return (
      <Center className="flex-1">
        <ActivityIndicator size="large" color={base.brand[600]} />
      </Center>
    );
  }

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* 1. Category Selection */}
      <AppText variant="h3" className="text-slate-900 dark:text-white font-bold mb-1">
        Select Category
      </AppText>
      <AppText variant="caption" className="text-slate-500 dark:text-slate-400 mb-4">
        Choose the device category you want to post.
      </AppText>

      {/* 4-column compact category icon grid */}
      <View
        className="flex-row flex-wrap justify-between mb-5"
        accessibilityRole="radiogroup"
        accessibilityLabel="Category selection"
      >
        {categories.map((category) => (
          <CategoryCard
            key={category.id}
            title={category.name}
            icon={category.icon as IconName | undefined}
            selected={category.id === selectedCategoryId}
            onPress={() => setCategory(category.id, category.name)}
          />
        ))}
      </View>

      {selectedCategoryId && (
        <>
          {/* 2. Brand & Model Section */}
          <BrandModelSection
            brands={brands}
            models={models}
            selectedBrandId={selectedBrandId}
            selectedBrandName={draft.brandName}
            selectedModelId={selectedModelId}
            selectedModelName={draft.modelName}
            customBrandName={draft.customBrandName}
            customModelName={draft.customModelName}
            isLoadingBrands={isLoadingBrands}
            isLoadingModels={isLoadingModels}
            onSelectBrand={setBrand}
            onSelectModel={setModel}
          />

          {/* 3. Device Condition */}
          <DeviceConditionSection
            selectedCondition={selectedCondition}
            onSelectCondition={setDeviceCondition}
          />

          {/* 4. Working / Available Spare Parts */}
          <SparePartsSection
            spareParts={spareParts}
            selectedSpareParts={selectedSpareParts}
            onToggleSparePart={toggleSparePart}
          />
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: { padding: 16, paddingBottom: 40 },
});
