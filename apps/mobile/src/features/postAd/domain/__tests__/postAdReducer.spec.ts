import { postAdReducer } from '../postAdReducer';
import { INITIAL_POST_AD_STATE } from '../PostAdState';
import { WizardStep } from '../WizardStep';

describe('postAdReducer', () => {
  it('handles SET_CATEGORY and resets child dependents', () => {
    const initialState = {
      ...INITIAL_POST_AD_STATE,
      draft: {
        categoryId: 'old-cat',
        brandId: 'old-brand',
        modelId: 'old-model',
        spareParts: ['part-1'],
      },
    };

    const state = postAdReducer(initialState, {
      type: 'SET_CATEGORY',
      payload: { categoryId: 'new-cat', categoryName: 'Laptops' },
    });

    expect(state.draft.categoryId).toBe('new-cat');
    expect(state.draft.categoryName).toBe('Laptops');
    expect(state.draft.brandId).toBeUndefined();
    expect(state.draft.modelId).toBeUndefined();
    expect(state.draft.spareParts).toEqual([]);
  });

  it('handles SET_BRAND and resets model', () => {
    const initialState = {
      ...INITIAL_POST_AD_STATE,
      draft: {
        categoryId: 'laptops',
        brandId: 'old-brand',
        modelId: 'old-model',
      },
    };

    const state = postAdReducer(initialState, {
      type: 'SET_BRAND',
      payload: { brandId: 'apple', brandName: 'Apple' },
    });

    expect(state.draft.brandId).toBe('apple');
    expect(state.draft.brandName).toBe('Apple');
    expect(state.draft.modelId).toBeUndefined();
  });

  it('handles SET_IS_FREE setting price to 0', () => {
    const initialState = {
      ...INITIAL_POST_AD_STATE,
      draft: { price: 500 },
    };

    const state = postAdReducer(initialState, {
      type: 'SET_IS_FREE',
      payload: true,
    });

    expect(state.draft.isFree).toBe(true);
    expect(state.draft.price).toBe(0);
  });

  it('handles 3-step navigation NEXT_STEP and PREVIOUS_STEP', () => {
    let state = INITIAL_POST_AD_STATE;
    expect(state.currentStep).toBe(WizardStep.CATEGORY);

    state = postAdReducer(state, { type: 'NEXT_STEP' });
    expect(state.currentStep).toBe(WizardStep.DETAILS);

    state = postAdReducer(state, { type: 'NEXT_STEP' });
    expect(state.currentStep).toBe(WizardStep.PHOTOS);

    // Clamped at step 2 (PHOTOS)
    state = postAdReducer(state, { type: 'NEXT_STEP' });
    expect(state.currentStep).toBe(WizardStep.PHOTOS);

    state = postAdReducer(state, { type: 'PREVIOUS_STEP' });
    expect(state.currentStep).toBe(WizardStep.DETAILS);
  });
});
