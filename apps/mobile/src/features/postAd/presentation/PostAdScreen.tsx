import React, { useCallback, useEffect } from 'react';
import { View, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Screen } from '@esparex/mobile-ui';
import { usePostAdDraft } from '../usePostAdDraft';
import { PostAdValidator } from '../application/PostAdValidator';
import { WizardStep } from '../domain/WizardStep';
import { WizardProgress } from './components/WizardProgress';
import { WizardNavBar } from './components/WizardNavBar';
import { StepCategory } from './steps/StepCategory';
import { StepDetails } from './steps/StepDetails';
import { StepImages } from './steps/StepImages';
import { StepPreview } from './steps/StepPreview';
import { useSubmitAd } from './hooks/useSubmitAd';
import { navigationRef } from '../../../navigation/navigationRef';
import { ROUTES } from '../../../navigation/routes';

// ---------------------------------------------------------------------------
// Step router — maps WizardStep enum to the correct step component
// ---------------------------------------------------------------------------

const STEP_COMPONENTS: Record<WizardStep, React.ComponentType> = {
  [WizardStep.CATEGORY]: StepCategory,
  [WizardStep.DETAILS]: StepDetails,
  [WizardStep.IMAGES]: StepImages,
  [WizardStep.PREVIEW]: StepPreview,
};

// ---------------------------------------------------------------------------
// Status-to-label mapping for WizardNavBar
// ---------------------------------------------------------------------------

const SUBMIT_LABELS: Record<string, string> = {
  uploading: 'Uploading photos\u2026',
  creating:  'Creating listing\u2026',
};

// ---------------------------------------------------------------------------
// PostAdScreen — wizard orchestrator
// ---------------------------------------------------------------------------

/**
 * PostAdScreen — the wizard container.
 *
 * Responsibilities:
 *   1. Read current step and draft from usePostAdDraft
 *   2. Compute canGoNext via PostAdValidator (no inline validation logic here)
 *   3. Delegate submission to useSubmitAd on the last step
 *   4. Navigate to Home on successful submission
 *   5. Display a dismissable error Alert on failure
 *
 * Does NOT:
 *   - Directly read or write draft fields
 *   - Contain business validation rules
 *   - Orchestrate upload or API calls (useSubmitAd → PostAdService own those)
 */
export const PostAdScreen = () => {
  const { state, nextStep, previousStep } = usePostAdDraft();
  const { currentStep, draft } = state;
  const { submit, status, submitError, resetError } = useSubmitAd();

  const isLastStep = currentStep === WizardStep.PREVIEW;
  const isSubmitting = status === 'uploading' || status === 'creating';
  const canGoNext = PostAdValidator.canAdvanceFrom(currentStep, draft);
  const StepComponent = STEP_COMPONENTS[currentStep];

  // Derive a status-aware label; undefined falls back to WizardNavBar's default.
  const nextLabel: string | undefined = SUBMIT_LABELS[status];

  // On the last step, onNext triggers submission instead of step advancement.
  // PostAdScreen owns the navigate-on-success decision; useSubmitAd owns the
  // mutation state and returns a typed SubmitResult.
  const handleNext = useCallback(() => {
    if (isLastStep) {
      void submit().then((result) => {
        if (result.success) {
          navigationRef.current?.reset({
            index: 0,
            routes: [
              {
                name: ROUTES.MAIN_STACK,
                state: {
                  routes: [
                    {
                      name: ROUTES.MAIN_TABS,
                      state: { routes: [{ name: ROUTES.HOME_TAB }] },
                    },
                  ],
                },
              },
            ],
          });
        }
        // Failure is surfaced via submitError effect below
      });
    } else {
      nextStep();
    }
  }, [isLastStep, submit, nextStep]);

  // Surface submission errors as a dismissable Alert.
  // The user presses "Try again" → resetError() resets status to idle.
  useEffect(() => {
    if (submitError) {
      Alert.alert(
        'Submission failed',
        submitError.message,
        [{ text: 'Try again', onPress: resetError }],
      );
    }
  }, [submitError, resetError]);

  return (
    <Screen edges={['top', 'left', 'right']} backgroundColor="bg-slate-50 dark:bg-slate-950">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Progress indicator */}
        <WizardProgress currentStep={currentStep} />

        {/* Active step content */}
        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
          <View className="flex-1 min-h-80">
            <StepComponent />
          </View>
        </ScrollView>

        {/* Navigation controls */}
        <WizardNavBar
          currentStep={currentStep}
          canGoNext={canGoNext}
          isLastStep={isLastStep}
          isLoading={isSubmitting}
          nextLabel={nextLabel}
          onBack={previousStep}
          onNext={handleNext}
        />
      </KeyboardAvoidingView>
    </Screen>
  );
};
