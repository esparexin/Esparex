import React from 'react';
import { View } from 'react-native';
import { AppButton } from '@esparex/mobile-ui';
import { WizardStep } from '../../domain/WizardStep';

interface WizardNavBarProps {
  currentStep: WizardStep;
  canGoNext: boolean;
  isLastStep: boolean;
  isLoading?: boolean;
  /** Override the computed Next/Submit label — used for status-aware labels. */
  nextLabel?: string;
  onBack: () => void;
  onNext: () => void;
}

/**
 * WizardNavBar — stateless Back/Next control bar.
 *
 * Receives all navigation intent from its parent (PostAdScreen).
 * Has no knowledge of draft data or validation logic — it only
 * reflects the `canGoNext` boolean it receives.
 *
 * Back is hidden on the first step. "Next" becomes "Submit" on the
 * preview step. `nextLabel` overrides the computed label entirely,
 * allowing the parent to show "Uploading…" or "Creating listing…".
 */
export const WizardNavBar = ({
  currentStep,
  canGoNext,
  isLastStep,
  isLoading = false,
  nextLabel,
  onBack,
  onNext,
}: WizardNavBarProps) => {
  const isFirstStep = currentStep === WizardStep.CATEGORY;
  const computedLabel = isLastStep ? 'Post Ad Now' : 'Continue';
  const displayLabel = nextLabel ?? computedLabel;


  return (
    <View
      className="flex-row items-center px-4 py-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800"
      accessibilityRole="toolbar"
      accessibilityLabel="Wizard navigation"
    >
      {/* Back button — hidden on first step to avoid an empty placeholder */}
      <View className="flex-1 mr-2">
        {!isFirstStep && (
          <AppButton
            variant="outline"
            label="Back"
            onPress={onBack}
            disabled={isLoading}
            accessible
            accessibilityLabel="Go to previous step"
          />
        )}
      </View>

      {/* Next / Submit button */}
      <View className="flex-1 ml-2">
        <AppButton
          variant="primary"
          label={displayLabel}
          onPress={onNext}
          disabled={!canGoNext || isLoading}
          accessible
          accessibilityLabel={isLastStep ? 'Submit listing' : 'Go to next step'}
          accessibilityHint={
            !canGoNext ? 'Complete the required fields to continue' : undefined
          }
        />
      </View>
    </View>
  );
};
