import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { Screen, Container } from '@esparex/mobile-ui';
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
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formState, setFormState] = useState<BusinessFormState>(INITIAL_BUSINESS_FORM_STATE);

  const submitMutation = useSubmitBusinessRegistration();

  const currentStep = STEPS_ORDER[currentStepIndex];

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
      onError: (err: any) => {
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
    <Screen style={styles.screen}>
      <View style={styles.headerBar}>
        <Text style={styles.headerTitle}>Business Registration</Text>
        <Text style={styles.stepCounter}>Step {currentStepIndex + 1} of {STEPS_ORDER.length}</Text>
      </View>

      <ScrollView style={styles.scrollContent}>
        {renderStepComponent()}
      </ScrollView>

      <View style={styles.footerBar}>
        <TouchableOpacity style={styles.backButton} onPress={handlePrev}>
          <Text style={styles.backText}>{currentStepIndex === 0 ? 'Cancel' : 'Back'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.nextButton, submitMutation.isPending && styles.disabledButton]}
          onPress={handleNext}
          disabled={submitMutation.isPending}
        >
          <Text style={styles.nextText}>
            {submitMutation.isPending
              ? 'Submitting...'
              : currentStepIndex === STEPS_ORDER.length - 1
              ? 'Submit Application'
              : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8fafc' },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  stepCounter: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  scrollContent: { flex: 1 },
  footerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  backButton: { paddingVertical: 12, paddingHorizontal: 16 },
  backText: { fontSize: 15, fontWeight: '600', color: '#64748b' },
  nextButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  disabledButton: { backgroundColor: '#94a3b8' },
  nextText: { fontSize: 15, fontWeight: '700', color: '#ffffff' },
});
