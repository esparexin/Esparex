import React from 'react';
import { View, ScrollView } from 'react-native';
import { AppText, Center, AppIcon } from '@esparex/mobile-ui';
import { usePostAdDraft } from '../../usePostAdDraft';
import { useCategories } from '../../application/useCategories';
import type { IconName } from '@esparex/mobile-ui';
import { CategoryCard } from '../components/CategoryCard';

/**
 * StepCategory — Step 1 of the Post Ad wizard.
 *
 * Responsibilities:
 * - Fetch the category list via useCategories()
 * - Read the currently selected categoryId from the draft
 * - Dispatch setCategory() when the user taps a card
 *
 * Does NOT:
 * - Know about navigation or step advancement (PostAdScreen handles that)
 * - Know about validation (PostAdValidator handles that)
 * - Render the WizardProgress or WizardNavBar (PostAdScreen owns those)
 */
export const StepCategory = () => {
  const { state, setCategory } = usePostAdDraft();
  const { categories, isLoading } = useCategories();
  const selectedCategoryId = state.draft.categoryId;

  if (isLoading) {
    return (
      <Center className="flex-1">
        <AppIcon name="Loader" size={32} color="#64748b" />
      </Center>
    );
  }

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ padding: 16 }}
      showsVerticalScrollIndicator={false}
    >
      <AppText
        variant="h3"
        className="text-slate-800 dark:text-slate-100 mb-1"
      >
        What are you selling?
      </AppText>
      <AppText
        variant="body"
        className="text-slate-500 dark:text-slate-400 mb-5"
      >
        Choose the category that best describes your item.
      </AppText>

      {/* Category grid — two columns */}
      <View
        className="flex-row flex-wrap justify-between"
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
    </ScrollView>
  );
};
