import { PostAdDraft } from '@esparex/contracts';
import { WizardStep } from './WizardStep';

/**
 * PostAdState — full wizard state held by the reducer.
 *
 * Deliberately split into two separate sub-objects:
 * - `currentStep`: UI navigation state. Never sent to the API.
 * - `draft`: Accumulated business data. This becomes the submission payload.
 *
 * Keeping them separate prevents the step cursor from ever leaking into
 * the POST /ads request body.
 */
export interface PostAdState {
  currentStep: WizardStep;
  draft: PostAdDraft;
}

export const INITIAL_POST_AD_STATE: PostAdState = {
  currentStep: WizardStep.CATEGORY,
  draft: {},
};
