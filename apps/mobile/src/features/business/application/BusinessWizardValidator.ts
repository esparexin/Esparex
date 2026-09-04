import { BusinessWizardStep } from '../domain/BusinessWizardStep';
import { BusinessFormState } from '../domain/BusinessFormState';

export interface BusinessValidationError {
  title: string;
  message: string;
}

export class BusinessWizardValidator {
  static validate(
    step: BusinessWizardStep,
    formState: BusinessFormState,
    isEditMode = false
  ): BusinessValidationError | null {
    switch (step) {
      case BusinessWizardStep.INFO:
        if (!formState.name.trim() || formState.name.trim().length < 3) {
          return {
            title: 'Validation Error',
            message: 'Please enter a valid business name (at least 3 characters).',
          };
        }
        if (!/^[6-9]\d{9}$/.test(formState.mobile.trim())) {
          return {
            title: 'Validation Error',
            message: 'Please enter a valid 10-digit Indian mobile number.',
          };
        }
        if (!formState.email.trim() || !formState.email.includes('@')) {
          return {
            title: 'Validation Error',
            message: 'Please enter a valid email address.',
          };
        }
        return null;

      case BusinessWizardStep.LOCATION:
        if (!formState.address.trim()) {
          return {
            title: 'Validation Error',
            message: 'Please enter your shop or business street address.',
          };
        }
        if (!formState.city.trim() || !formState.state.trim() || !formState.pincode.trim()) {
          return {
            title: 'Validation Error',
            message: 'Please complete your city, state, and pincode details.',
          };
        }
        return null;

      case BusinessWizardStep.DOCUMENTS:
        if (!isEditMode && !formState.documents.some((d) => d.type === 'id_proof')) {
          return {
            title: 'Document Required',
            message: 'Please attach your photo ID proof (Aadhaar / PAN) to continue.',
          };
        }
        return null;

      case BusinessWizardStep.REVIEW:
      default:
        return null;
    }
  }
}
