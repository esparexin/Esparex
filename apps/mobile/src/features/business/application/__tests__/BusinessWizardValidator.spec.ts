import { BusinessWizardValidator } from '../BusinessWizardValidator';
import { BusinessWizardStep } from '../../domain/BusinessWizardStep';
import { INITIAL_BUSINESS_FORM_STATE } from '../../domain/BusinessFormState';

describe('BusinessWizardValidator', () => {
  it('validates business name on INFO step', () => {
    const error = BusinessWizardValidator.validate(BusinessWizardStep.INFO, {
      ...INITIAL_BUSINESS_FORM_STATE,
      name: 'Ab',
    });
    expect(error?.message).toContain('at least 3 characters');
  });

  it('validates mobile on INFO step', () => {
    const error = BusinessWizardValidator.validate(BusinessWizardStep.INFO, {
      ...INITIAL_BUSINESS_FORM_STATE,
      name: 'Valid Shop Name',
      mobile: '12345',
    });
    expect(error?.message).toContain('10-digit');
  });

  it('validates email on INFO step', () => {
    const error = BusinessWizardValidator.validate(BusinessWizardStep.INFO, {
      ...INITIAL_BUSINESS_FORM_STATE,
      name: 'Valid Shop Name',
      mobile: '9876543210',
      email: 'invalid-email',
    });
    expect(error?.message).toContain('valid email');
  });

  it('passes valid INFO step', () => {
    const error = BusinessWizardValidator.validate(BusinessWizardStep.INFO, {
      ...INITIAL_BUSINESS_FORM_STATE,
      name: 'Valid Shop Name',
      mobile: '9876543210',
      email: 'valid@example.com',
    });
    expect(error).toBeNull();
  });

  it('validates address on LOCATION step', () => {
    const error = BusinessWizardValidator.validate(BusinessWizardStep.LOCATION, {
      ...INITIAL_BUSINESS_FORM_STATE,
      address: '',
    });
    expect(error?.message).toContain('street address');
  });

  it('validates documents requirement on DOCUMENTS step for new registrations', () => {
    const error = BusinessWizardValidator.validate(
      BusinessWizardStep.DOCUMENTS,
      INITIAL_BUSINESS_FORM_STATE,
      false
    );
    expect(error?.message).toContain('photo ID proof');
  });

  it('allows DOCUMENTS step without new documents in edit mode', () => {
    const error = BusinessWizardValidator.validate(
      BusinessWizardStep.DOCUMENTS,
      INITIAL_BUSINESS_FORM_STATE,
      true
    );
    expect(error).toBeNull();
  });
});
