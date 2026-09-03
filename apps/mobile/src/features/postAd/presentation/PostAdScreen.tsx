import React, { useCallback, useEffect } from 'react';
import { View, ScrollView, Alert, KeyboardAvoidingView, Platform, BackHandler } from 'react-native';
import { Screen, Container, AppText, AppButton, AppIcon } from '@esparex/mobile-ui';
import { base } from '@esparex/design-tokens';
import { useAuth } from '../../../providers/AuthProvider';
import { usePostAdDraft } from '../usePostAdDraft';
import { PostAdValidator } from '../application/PostAdValidator';
import { WizardStep } from '../domain/WizardStep';
import { WizardProgress } from './components/WizardProgress';
import { WizardNavBar } from './components/WizardNavBar';
import { StepCategory } from './steps/StepCategory';
import { StepDetails } from './steps/StepDetails';
import { StepImages } from './steps/StepImages';
import { useSubmitAd } from './hooks/useSubmitAd';
import { navigationRef, navigate } from '../../../navigation/navigationRef';
import { ROUTES } from '../../../navigation/routes';

// ---------------------------------------------------------------------------
// Step router — maps WizardStep enum to the correct step component (3 Steps)
// ---------------------------------------------------------------------------

const STEP_COMPONENTS: Record<WizardStep, React.ComponentType> = {
  [WizardStep.CATEGORY]: StepCategory,
  [WizardStep.DETAILS]: StepDetails,
  [WizardStep.PHOTOS]: StepImages,
};

// ---------------------------------------------------------------------------
// Status-to-label mapping for WizardNavBar
// ---------------------------------------------------------------------------

const SUBMIT_LABELS: Record<string, string> = {
  uploading: 'Uploading photos\u2026',
  creating: 'Publishing listing\u2026',
};

// ---------------------------------------------------------------------------
// PostAdScreen — wizard orchestrator
// ---------------------------------------------------------------------------

export const PostAdScreen = () => {
  const { status: authStatus } = useAuth();
  const { state, nextStep, previousStep, reset } = usePostAdDraft();
  const { currentStep, draft } = state;
  const { submit, status, submitError, resetError } = useSubmitAd();

  const isLastStep = currentStep === WizardStep.PHOTOS;
  const isSubmitting = status === 'uploading' || status === 'creating';
  const canGoNext = PostAdValidator.canAdvanceFrom(currentStep, draft);
  const StepComponent = STEP_COMPONENTS[currentStep];

  // Android hardware back button handling: step backward instead of exiting wizard
  useEffect(() => {
    const onBackPress = () => {
      if (currentStep !== WizardStep.CATEGORY) {
        previousStep();
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [currentStep, previousStep]);

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

  if (authStatus === 'anonymous') {
    return (
      <Screen edges={['top', 'left', 'right']} backgroundColor="bg-slate-50 dark:bg-slate-950">
        <Container className="flex-1 justify-center items-center px-6">
          <View className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 items-center justify-center mb-4">
            <AppIcon name="PlusCircle" size={32} color={base.brand[500]} />
          </View>
          <AppText variant="h2" className="font-bold text-slate-900 dark:text-white text-center mb-2">
            Post an Ad on Esparex
          </AppText>
          <AppText variant="body" className="text-slate-600 dark:text-slate-400 text-center mb-6">
            Sign in to create your listing, upload photos, and connect with verified buyers across India.
          </AppText>
          <AppButton
            label="Sign In / Register"
            onPress={() => navigate(ROUTES.AUTH_STACK)}
            className="w-full"
            accessibilityLabel="Sign in to post an ad"
          />
        </Container>
      </Screen>
    );
  }

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
