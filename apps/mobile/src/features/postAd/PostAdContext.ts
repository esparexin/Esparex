import { createContext } from 'react';
import { LocationMeta } from '@esparex/contracts';
import { PostAdState, INITIAL_POST_AD_STATE } from './domain/PostAdState';
import { PickedImage } from './domain/PickedImage';
import { WizardStep } from './domain/WizardStep';

/**
 * PostAdContextType — the public API surface of the PostAd wizard.
 */
export interface PostAdContextType {
  /** The current wizard state (step + draft). Read-only for consumers. */
  state: PostAdState;

  /** Step 1 — Device & Specs */
  setCategory: (categoryId: string, categoryName: string) => void;
  setBrand: (brand: { brandId?: string; brandName?: string; customBrandName?: string }) => void;
  setModel: (model: { modelId?: string; modelName?: string; customModelName?: string }) => void;
  setDeviceCondition: (condition: 'power_on' | 'power_off') => void;
  setSpareParts: (parts: string[]) => void;

  /** Step 2 — Details & Pricing */
  setTitle: (title: string) => void;
  setDescription: (description: string) => void;
  setPrice: (price: number) => void;
  setIsFree: (isFree: boolean) => void;
  setLocation: (location: LocationMeta | null) => void;

  /** Step 3 — Photos */
  setPickedImages: (images: readonly PickedImage[]) => void;
  setImages: (localUris: string[]) => void;

  /** Navigation & Lifecycle */
  setStep: (step: WizardStep) => void;
  nextStep: () => void;
  previousStep: () => void;
  reset: () => void;
}

export const PostAdContext = createContext<PostAdContextType>({
  state: INITIAL_POST_AD_STATE,
  setCategory: () => {},
  setBrand: () => {},
  setModel: () => {},
  setDeviceCondition: () => {},
  setSpareParts: () => {},
  setTitle: () => {},
  setDescription: () => {},
  setPrice: () => {},
  setIsFree: () => {},
  setLocation: () => {},
  setPickedImages: () => {},
  setImages: () => {},
  setStep: () => {},
  nextStep: () => {},
  previousStep: () => {},
  reset: () => {},
});

