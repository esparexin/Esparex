import React, { useState, useEffect } from 'react';
import { View, Alert, TouchableOpacity, ScrollView, BackHandler } from 'react-native';
import { Screen, AppText, AppButton, AppIcon, Card, Container } from '@esparex/mobile-ui';
import { base } from '@esparex/design-tokens';
import { useAuth } from '../../../../providers/AuthProvider';
import { navigate } from '../../../../navigation/navigationRef';
import { ROUTES } from '../../../../navigation/routes';
import { Business } from '@esparex/contracts';
import { BusinessWizardStep } from '../../domain/BusinessWizardStep';
import { BusinessFormState, INITIAL_BUSINESS_FORM_STATE, businessToFormState } from '../../domain/BusinessFormState';
import { StepBusinessInfo } from '../steps/StepBusinessInfo';
import { StepLocationDetails } from '../steps/StepLocationDetails';
import { StepDocumentsUpload } from '../steps/StepDocumentsUpload';
import { StepBusinessReview } from '../steps/StepBusinessReview';
import { useSubmitBusinessRegistration } from '../hooks/useSubmitBusinessRegistration';
import { useUpdateBusinessProfile } from '../hooks/useUpdateBusinessProfile';
import { BusinessWizardValidator } from '../../application/BusinessWizardValidator';

interface BusinessRegistrationWizardScreenProps {
  initialBusiness?: Business | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const STEPS_ORDER = [
  BusinessWizardStep.INFO,
  BusinessWizardStep.LOCATION,
  BusinessWizardStep.DOCUMENTS,
  BusinessWizardStep.REVIEW,
];

export function BusinessRegistrationWizardScreen({ initialBusiness, onSuccess, onCancel }: BusinessRegistrationWizardScreenProps) {
  const { status: authStatus } = useAuth();
  const isEditMode = Boolean(initialBusiness?.id);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formState, setFormState] = useState<BusinessFormState>(() =>
    initialBusiness ? businessToFormState(initialBusiness) : INITIAL_BUSINESS_FORM_STATE
  );

  const submitMutation = useSubmitBusinessRegistration();
  const updateMutation = useUpdateBusinessProfile();
  const isPending = submitMutation.isPending || updateMutation.isPending;

  if (authStatus === 'anonymous') {
    return (
      <Screen className="flex-1 bg-muted">
        <View className="flex-row items-center px-4 py-3.5 bg-card border-b border-border">
          {onCancel && (
            <TouchableOpacity
              onPress={onCancel}
              accessibilityLabel="Cancel"
              accessibilityRole="button"
              className="mr-3 p-1"
            >
              <AppIcon name="ArrowLeft" size={20} color={base.brand[500]} />
            </TouchableOpacity>
          )}
          <AppText variant="h3" className="font-bold text-foreground">
            Register as Business
          </AppText>
        </View>
        <Container className="flex-1 p-4">
          <Card className="p-6 items-center mt-4">
            <View className="w-16 h-16 rounded-full bg-muted items-center justify-center mb-4">
              <AppIcon name="Building2" size={28} color={base.slate[400]} />
            </View>
            <AppText variant="h3" className="font-bold text-foreground text-center mb-1">
              Sign in to register your business
            </AppText>
            <AppText variant="body" className="text-foreground-subtle text-center mb-5">
              Get a verified business badge, post unlimited ads, and grow your sales on Esparex.
            </AppText>
            <AppButton
              label="Sign In / Register"
              onPress={() => navigate(ROUTES.AUTH_STACK)}
              className="w-full"
              accessibilityLabel="Sign in to register your business"
            />
          </Card>
        </Container>
      </Screen>
    );
  }

  const currentStep = STEPS_ORDER[currentStepIndex];

  // Android hardware back button handling: step backward instead of exiting wizard
  useEffect(() => {
    const onBackPress = () => {
      if (currentStepIndex > 0) {
        setCurrentStepIndex((prev) => prev - 1);
        return true;
      }
      return false;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [currentStepIndex]);

  const handleFormChange = (updates: Partial<BusinessFormState>) => {
    setFormState((prev) => ({ ...prev, ...updates }));
  };

  const validateCurrentStep = (): boolean => {
    const error = BusinessWizardValidator.validate(currentStep, formState, isEditMode);
    if (error) {
      Alert.alert(error.title, error.message);
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) return;

    if (currentStepIndex < STEPS_ORDER.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    } else if (onCancel) {
      onCancel();
    }
  };

  const handleSubmit = () => {
    if (isEditMode && initialBusiness?.id) {
      updateMutation.mutate(
        { businessId: initialBusiness.id, state: formState },
        {
          onSuccess: () => {
            Alert.alert(
              'Profile Updated',
              'Your business profile has been updated successfully.',
              [{ text: 'OK', onPress: () => onSuccess && onSuccess() }]
            );
          },
          onError: (err: Error) => {
            Alert.alert('Update Error', err?.message || 'Unable to update business profile. Please try again.');
          },
        }
      );
    } else {
      submitMutation.mutate(formState, {
        onSuccess: () => {
          Alert.alert(
            'Application Submitted',
            'Your business application has been submitted successfully for verification.',
            [{ text: 'OK', onPress: () => onSuccess && onSuccess() }]
          );
        },
        onError: (err: Error) => {
          Alert.alert('Submission Error', err?.message || 'Unable to submit business application. Please try again.');
        },
      });
    }
  };

  const renderStepComponent = () => {
    switch (currentStep) {
      case BusinessWizardStep.INFO:
        return <StepBusinessInfo formState={formState} onChange={handleFormChange} />;
      case BusinessWizardStep.LOCATION:
        return <StepLocationDetails formState={formState} onChange={handleFormChange} />;
      case BusinessWizardStep.DOCUMENTS:
        return <StepDocumentsUpload formState={formState} onChange={handleFormChange} />;
      case BusinessWizardStep.REVIEW:
        return <StepBusinessReview formState={formState} />;
      default:
        return null;
    }
  };

  return (
    <Screen className="flex-1 bg-slate-50 dark:bg-slate-950">
      <View className="flex-row items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <AppText variant="h3" className="font-bold text-slate-900 dark:text-slate-100 text-base">
          {isEditMode ? 'Edit Business Profile' : 'Business Registration'}
        </AppText>
        <AppText variant="caption" className="font-semibold text-slate-500 dark:text-slate-400">
          Step {currentStepIndex + 1} of {STEPS_ORDER.length}
        </AppText>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {renderStepComponent()}
      </ScrollView>

      <View className="flex-row items-center justify-between p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <TouchableOpacity className="py-3 px-4" onPress={handlePrev}>
          <AppText variant="body" className="font-semibold text-slate-600 dark:text-slate-400">
            {currentStepIndex === 0 ? 'Cancel' : 'Back'}
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity
          className={`py-3 px-6 rounded-xl ${isPending ? 'bg-muted opacity-60' : 'bg-brand-600 dark:bg-brand-500'}`}
          onPress={handleNext}
          disabled={isPending}
        >
          <AppText variant="body" className="font-bold text-white">
            {isPending
              ? isEditMode
                ? 'Saving...'
                : 'Submitting...'
              : currentStepIndex === STEPS_ORDER.length - 1
              ? isEditMode
                ? 'Save Changes'
                : 'Submit Application'
              : 'Continue'}
          </AppText>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

