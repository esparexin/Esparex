import React, { useReducer, useMemo, useCallback } from 'react';
import { LocationMeta } from '@esparex/contracts';
import { PostAdContext } from './PostAdContext';
import { postAdReducer } from './domain/postAdReducer';
import { INITIAL_POST_AD_STATE } from './domain/PostAdState';
import { PickedImage } from './domain/PickedImage';
import { WizardStep } from './domain/WizardStep';

interface PostAdProviderProps {
  children: React.ReactNode;
}

export const PostAdProvider: React.FC<PostAdProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(postAdReducer, INITIAL_POST_AD_STATE);

  const setCategory = useCallback((categoryId: string, categoryName: string) => {
    dispatch({ type: 'SET_CATEGORY', payload: { categoryId, categoryName } });
  }, []);

  const setBrand = useCallback((brand: { brandId?: string; brandName?: string; customBrandName?: string }) => {
    dispatch({ type: 'SET_BRAND', payload: brand });
  }, []);

  const setModel = useCallback((model: { modelId?: string; modelName?: string; customModelName?: string }) => {
    dispatch({ type: 'SET_MODEL', payload: model });
  }, []);

  const setDeviceCondition = useCallback((condition: 'power_on' | 'power_off') => {
    dispatch({ type: 'SET_DEVICE_CONDITION', payload: condition });
  }, []);

  const setSpareParts = useCallback((parts: string[]) => {
    dispatch({ type: 'SET_SPARE_PARTS', payload: parts });
  }, []);

  const setTitle = useCallback((title: string) => {
    dispatch({ type: 'SET_TITLE', payload: title });
  }, []);

  const setDescription = useCallback((description: string) => {
    dispatch({ type: 'SET_DESCRIPTION', payload: description });
  }, []);

  const setPrice = useCallback((price: number) => {
    dispatch({ type: 'SET_PRICE', payload: price });
  }, []);

  const setIsFree = useCallback((isFree: boolean) => {
    dispatch({ type: 'SET_IS_FREE', payload: isFree });
  }, []);

  const setLocation = useCallback((location: LocationMeta | null) => {
    dispatch({ type: 'SET_LOCATION', payload: location });
  }, []);

  const setPickedImages = useCallback((images: readonly PickedImage[]) => {
    dispatch({ type: 'SET_PICKED_IMAGES', payload: images });
  }, []);

  const setImages = useCallback((localUris: string[]) => {
    dispatch({ type: 'SET_IMAGES', payload: localUris });
  }, []);

  const setStep = useCallback((step: WizardStep) => {
    dispatch({ type: 'SET_STEP', payload: step });
  }, []);

  const nextStep = useCallback(() => {
    dispatch({ type: 'NEXT_STEP' });
  }, []);

  const previousStep = useCallback(() => {
    dispatch({ type: 'PREVIOUS_STEP' });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const value = useMemo(() => ({
    state,
    setCategory,
    setBrand,
    setModel,
    setDeviceCondition,
    setSpareParts,
    setTitle,
    setDescription,
    setPrice,
    setIsFree,
    setLocation,
    setPickedImages,
    setImages,
    setStep,
    nextStep,
    previousStep,
    reset,
  }), [
    state,
    setCategory,
    setBrand,
    setModel,
    setDeviceCondition,
    setSpareParts,
    setTitle,
    setDescription,
    setPrice,
    setIsFree,
    setLocation,
    setPickedImages,
    setImages,
    setStep,
    nextStep,
    previousStep,
    reset,
  ]);

  return (
    <PostAdContext.Provider value={value}>
      {children}
    </PostAdContext.Provider>
  );
};

