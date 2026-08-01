import { PostAdDraft } from '@esparex/contracts';
import { PostAdState, INITIAL_POST_AD_STATE } from './PostAdState';
import { WizardStep, TOTAL_WIZARD_STEPS } from './WizardStep';

/**
 * PostAdAction — discriminated union of all state transitions.
 *
 * Every action is explicit — no generic SET_DETAILS that hides which
 * field changed. This makes reducer logs, debugging, and middleware
 * unambiguous.
 *
 * Consumers never construct these directly — they call intent methods
 * on PostAdContext (setTitle, setPrice, etc.).
 */
export type PostAdAction =
  | { type: 'SET_CATEGORY'; payload: { categoryId: string; categoryName: string } }
  | { type: 'SET_TITLE'; payload: string }
  | { type: 'SET_DESCRIPTION'; payload: string }
  | { type: 'SET_PRICE'; payload: number }
  | { type: 'SET_CONDITION'; payload: string }
  | { type: 'SET_LOCATION'; payload: { locationId?: string; locationDisplay?: string } }
  | { type: 'SET_IMAGES'; payload: string[] }
  | { type: 'NEXT_STEP' }
  | { type: 'PREVIOUS_STEP' }
  | { type: 'RESET' };

export function postAdReducer(state: PostAdState, action: PostAdAction): PostAdState {
  switch (action.type) {
    case 'SET_CATEGORY':
      return {
        ...state,
        draft: {
          ...state.draft,
          categoryId: action.payload.categoryId,
          categoryName: action.payload.categoryName,
        },
      };

    case 'SET_TITLE':
      return { ...state, draft: { ...state.draft, title: action.payload } };

    case 'SET_DESCRIPTION':
      return { ...state, draft: { ...state.draft, description: action.payload } };

    case 'SET_PRICE':
      return { ...state, draft: { ...state.draft, price: action.payload } };

    case 'SET_CONDITION':
      return { ...state, draft: { ...state.draft, condition: action.payload } };

    case 'SET_LOCATION':
      return {
        ...state,
        draft: {
          ...state.draft,
          locationId: action.payload.locationId,
          locationDisplay: action.payload.locationDisplay,
        },
      };

    case 'SET_IMAGES':
      return { ...state, draft: { ...state.draft, localImages: action.payload } };

    case 'NEXT_STEP': {
      const next = state.currentStep + 1;
      const clamped = Math.min(next, TOTAL_WIZARD_STEPS - 1) as WizardStep;
      return { ...state, currentStep: clamped };
    }

    case 'PREVIOUS_STEP': {
      const prev = state.currentStep - 1;
      const clamped = Math.max(prev, 0) as WizardStep;
      return { ...state, currentStep: clamped };
    }

    case 'RESET':
      return INITIAL_POST_AD_STATE;

    default:
      return state;
  }
}

