import React, { useState, useEffect } from 'react';
import { View, Alert, TouchableOpacity, ScrollView, BackHandler } from 'react-native';
import { Screen, AppText, AppButton, AppIcon, Card, Container } from '@esparex/mobile-ui';
import { base } from '@esparex/design-tokens';
import { useAuth } from '../../../../providers/AuthProvider';
import { navigate } from '../../../../navigation/navigationRef';
import { ROUTES } from '../../../../navigation/routes';
import { BusinessWizardStep } from '../../domain/BusinessWizardStep';
import { BusinessFormState, INITIAL_BUSINESS_FORM_STATE } from '../../domain/BusinessFormState';
import { StepBusinessInfo } from '../steps/StepBusinessInfo';
import { StepLocationDetails } from '../steps/StepLocationDetails';
import { StepDocumentsUpload } from '../steps/StepDocumentsUpload';
import { StepBusinessReview } from '../steps/StepBusinessReview';
import { useSubmitBusinessRegistration } from '../hooks/useSubmitBusinessRegistration';

interface BusinessRegistrationWizardScreenProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const STEPS_ORDER = [
  BusinessWizardStep.INFO,
  BusinessWizardStep.LOCATION,
  BusinessWizardStep.DOCUMENTS,
  BusinessWizardStep.REVIEW,
];

export function BusinessRegistrationWizardScreen({ onSuccess, onCancel }: BusinessRegistrationWizardScreenProps) {
  const { status: authStatus } = useAuth();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formState, setFormState] = useState<BusinessFormState>(INITIAL_BUSINESS_FORM_STATE);

  const submitMutation = useSubmitBusinessRegistration();

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
    switch (currentStep) {
      case BusinessWizardStep.INFO:
        if (!formState.name.trim() || formState.name.trim().length < 3) {
          Alert.alert('Validation Error', 'Please enter a valid business name (at least 3 characters).');
          return false;
        }
        if (!/^[6-9]\d{9}$/.test(formState.mobile.trim())) {
          Alert.alert('Validation Error', 'Please enter a valid 10-digit Indian mobile number.');
          return false;
        }
        if (!formState.email.trim() || !formState.email.includes('@')) {
          Alert.alert('Validation Error', 'Please enter a valid email address.');
          return false;
        }
        return true;

      case BusinessWizardStep.LOCATION:
        if (!formState.address.trim()) {
          Alert.alert('Validation Error', 'Please enter your shop or business street address.');
          return false;
        }
        if (!formState.city.trim() || !formState.state.trim() || !formState.pincode.trim()) {
          Alert.alert('Validation Error', 'Please complete your city, state, and pincode details.');
          return false;
        }
        return true;

      case BusinessWizardStep.DOCUMENTS:
        if (!formState.documents.some((d) => d.type === 'id_proof')) {
          Alert.alert('Document Required', 'Please attach your photo ID proof (Aadhaar / PAN) to continue.');
          return false;
        }
        return true;

      case BusinessWizardStep.REVIEW:
        return true;

      default:
        return true;
    }
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
    submitMutation.mutate(formState, {
      onSuccess: () => {
        Alert.alert('Application Submitted', 'Your business application has been submitted successfully for verification.', [
          { text: 'OK', onPress: () => onSuccess && onSuccess() },
        ]);
      },
      onError: (err: Error) => {
        Alert.alert('Submission Error', err?.message || 'Unable to submit business application. Please try again.');
      },
    });
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
          Business Registration
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
          className={`py-3 px-6 rounded-xl ${submitMutation.isPending ? 'bg-slate-300 dark:bg-slate-700' : 'bg-brand-600 dark:bg-brand-500'}`}
          onPress={handleNext}
          disabled={submitMutation.isPending}
        >
          <AppText variant="body" className="font-bold text-white">
            {submitMutation.isPending
              ? 'Submitting...'
              : currentStepIndex === STEPS_ORDER.length - 1
              ? 'Submit Application'
              : 'Continue'}
          </AppText>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

