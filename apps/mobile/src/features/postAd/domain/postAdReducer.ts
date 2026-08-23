import { LocationMeta } from '@esparex/contracts';
import { PostAdDraft } from './PostAdDraft';
import { PickedImage } from './PickedImage';
import { PostAdState, INITIAL_POST_AD_STATE } from './PostAdState';
import { WizardStep, TOTAL_WIZARD_STEPS } from './WizardStep';

/**
 * PostAdAction — discriminated union of all state transitions.
 */
export type PostAdAction =
  | { type: 'SET_CATEGORY'; payload: { categoryId: string; categoryName: string } }
  | { type: 'SET_BRAND'; payload: { brandId?: string; brandName?: string; customBrandName?: string } }
  | { type: 'SET_MODEL'; payload: { modelId?: string; modelName?: string; customModelName?: string } }
  | { type: 'SET_DEVICE_CONDITION'; payload: 'power_on' | 'power_off' }
  | { type: 'SET_SPARE_PARTS'; payload: string[] }
  | { type: 'SET_TITLE'; payload: string }
  | { type: 'SET_DESCRIPTION'; payload: string }
  | { type: 'SET_PRICE'; payload: number }
  | { type: 'SET_IS_FREE'; payload: boolean }
  | { type: 'SET_LOCATION'; payload: LocationMeta | null }
  | { type: 'SET_PICKED_IMAGES'; payload: readonly PickedImage[] }
  | { type: 'SET_IMAGES'; payload: string[] }
  | { type: 'SET_STEP'; payload: WizardStep }
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
          // Reset dependent brand/model/parts when category changes
          brandId: undefined,
          brandName: undefined,
          modelId: undefined,
          modelName: undefined,
          customBrandName: undefined,
          customModelName: undefined,
          spareParts: [],
        },
      };

    case 'SET_BRAND':
      return {
        ...state,
        draft: {
          ...state.draft,
          brandId: action.payload.brandId,
          brandName: action.payload.brandName,
          customBrandName: action.payload.customBrandName,
          modelId: undefined,
          modelName: undefined,
          customModelName: undefined,
        },
      };

    case 'SET_MODEL':
      return {
        ...state,
        draft: {
          ...state.draft,
          modelId: action.payload.modelId,
          modelName: action.payload.modelName,
          customModelName: action.payload.customModelName,
        },
      };

    case 'SET_DEVICE_CONDITION':
      return {
        ...state,
        draft: { ...state.draft, deviceCondition: action.payload },
      };

    case 'SET_SPARE_PARTS':
      return {
        ...state,
        draft: { ...state.draft, spareParts: action.payload },
      };

    case 'SET_TITLE':
      return { ...state, draft: { ...state.draft, title: action.payload } };

    case 'SET_DESCRIPTION':
      return { ...state, draft: { ...state.draft, description: action.payload } };

    case 'SET_PRICE':
      return { ...state, draft: { ...state.draft, price: action.payload, isFree: false } };

    case 'SET_IS_FREE':
      return {
        ...state,
        draft: {
          ...state.draft,
          isFree: action.payload,
          price: action.payload ? 0 : state.draft.price || 0,
        },
      };

    case 'SET_LOCATION':
      return {
        ...state,
        draft: {
          ...state.draft,
          location: action.payload,
          locationId: action.payload?.locationId,
          locationDisplay: action.payload?.display,
        },
      };

    case 'SET_PICKED_IMAGES':
      return {
        ...state,
        draft: {
          ...state.draft,
          pickedImages: action.payload,
          localImages: action.payload.map((img) => img.uri),
        },
      };

    case 'SET_IMAGES':
      return { ...state, draft: { ...state.draft, localImages: action.payload } };

    case 'SET_STEP':
      return { ...state, currentStep: action.payload };

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

