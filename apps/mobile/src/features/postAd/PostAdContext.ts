import { createContext } from 'react';
import { PostAdState, INITIAL_POST_AD_STATE } from './domain/PostAdState';

/**
 * PostAdContextType — the public API surface of the PostAd wizard.
 *
 * Intent methods (not raw dispatch) are the only way to update state.
 * Each method maps to one explicit reducer action — same clarity at
 * both the dispatch site and the reducer case.
 */
export interface PostAdContextType {
  /** The current wizard state (step + draft). Read-only for consumers. */
  state: PostAdState;

  /** Step 1 — select a category */
  setCategory: (categoryId: string, categoryName: string) => void;

  /** Step 2 — fill in individual detail fields */
  setTitle: (title: string) => void;
  setDescription: (description: string) => void;
  setPrice: (price: number) => void;
  setCondition: (condition: string) => void;
  setLocation: (locationId?: string, locationDisplay?: string) => void;

  /** Step 3 — attach local image URIs from device */
  setImages: (localUris: string[]) => void;

  /** Advance to the next step. Clamped — safe to call on last step. */
  nextStep: () => void;

  /** Return to the previous step. Clamped — safe to call on first step. */
  previousStep: () => void;

  /** Reset wizard to initial state (called on successful submission or cancel). */
  reset: () => void;
}

export const PostAdContext = createContext<PostAdContextType>({
  state: INITIAL_POST_AD_STATE,
  setCategory: () => {},
  setTitle: () => {},
  setDescription: () => {},
  setPrice: () => {},
  setCondition: () => {},
  setLocation: () => {},
  setImages: () => {},
  nextStep: () => {},
  previousStep: () => {},
  reset: () => {},
});

