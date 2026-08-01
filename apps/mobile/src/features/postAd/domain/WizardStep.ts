/**
 * WizardStep — ordered enum defining the Post Ad wizard progression.
 *
 * Steps are numbered so that currentStep arithmetic (next/previous)
 * works without a lookup table. The enum value is never persisted or
 * sent to the API.
 */
export enum WizardStep {
  CATEGORY = 0,
  DETAILS = 1,
  IMAGES = 2,
  PREVIEW = 3,
}

/**
 * WizardStepMeta — single source of truth for step metadata.
 *
 * Both WizardProgress and any future step-aware component should
 * derive labels and totals from this array rather than maintaining
 * their own copies.
 */
export interface WizardStepMeta {
  step: WizardStep;
  label: string;
}

export const WIZARD_STEPS: WizardStepMeta[] = [
  { step: WizardStep.CATEGORY, label: 'Category' },
  { step: WizardStep.DETAILS, label: 'Details' },
  { step: WizardStep.IMAGES, label: 'Photos' },
  { step: WizardStep.PREVIEW, label: 'Preview' },
];

/** Derived from WIZARD_STEPS — never hardcoded separately. */
export const TOTAL_WIZARD_STEPS = WIZARD_STEPS.length;

