import React from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { AppText } from '@esparex/mobile-ui';
import { usePostAdDraft } from '../../usePostAdDraft';
import { TitleField } from '../components/TitleField';
import { PriceField } from '../components/PriceField';
import { ConditionField } from '../components/ConditionField';
import { LocationField } from '../components/LocationField';
import { DescriptionField } from '../components/DescriptionField';

/**
 * StepDetails — Step 2 of the Post Ad wizard.
 *
 * Responsibilities:
 * - Read current draft field values from context
 * - Call the appropriate intent method on each field change
 * - Compose all field components in order
 *
 * Does NOT:
 * - Contain any validation logic (PostAdValidator handles that)
 * - Know about step navigation (PostAdScreen handles that)
 * - Render WizardProgress or WizardNavBar (PostAdScreen owns those)
 * - Accumulate local state — each change dispatches immediately to the reducer
 */
export const StepDetails = () => {
  const { state, setTitle, setDescription, setPrice, setCondition, setLocation } = usePostAdDraft();
  const { draft } = state;

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <AppText variant="h3" className="text-slate-800 dark:text-slate-100 mb-1">
        Tell us about it
      </AppText>
      <AppText variant="body" className="text-slate-500 dark:text-slate-400 mb-5">
        Add the details buyers need to make a decision.
      </AppText>

      <View>
        <TitleField
          value={draft.title}
          onChange={setTitle}
        />

        <PriceField
          value={draft.price}
          onChange={setPrice}
        />

        <ConditionField
          value={draft.condition}
          onChange={setCondition}
        />

        <LocationField
          locationDisplay={draft.locationDisplay}
          onChange={(display) => setLocation(undefined, display)}
        />

        <DescriptionField
          value={draft.description}
          onChange={setDescription}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: { padding: 16, paddingBottom: 32 },
});
