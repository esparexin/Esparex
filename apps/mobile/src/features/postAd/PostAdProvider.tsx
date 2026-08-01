import React, { useReducer, useMemo, useCallback } from 'react';
import { PostAdContext } from './PostAdContext';
import { postAdReducer } from './domain/postAdReducer';
import { INITIAL_POST_AD_STATE } from './domain/PostAdState';

interface PostAdProviderProps {
  children: React.ReactNode;
}

/**
 * PostAdProvider — scoped to the Post Ad tab only (not AppProvider).
 *
 * Mounts when the user opens the Post Ad tab.
 * Unmounts (and resets all state) when they leave.
 *
 * Exposes explicit intent methods — not raw dispatch — so the reducer
 * implementation can evolve without any consumer changes.
 */
export const PostAdProvider: React.FC<PostAdProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(postAdReducer, INITIAL_POST_AD_STATE);

  const setCategory = useCallback((categoryId: string, categoryName: string) => {
    dispatch({ type: 'SET_CATEGORY', payload: { categoryId, categoryName } });
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

  const setCondition = useCallback((condition: string) => {
    dispatch({ type: 'SET_CONDITION', payload: condition });
  }, []);

  const setLocation = useCallback((locationId?: string, locationDisplay?: string) => {
    dispatch({ type: 'SET_LOCATION', payload: { locationId, locationDisplay } });
  }, []);

  const setImages = useCallback((localUris: string[]) => {
    dispatch({ type: 'SET_IMAGES', payload: localUris });
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

  // Memoised so consumers don't re-render when unrelated state changes
  const value = useMemo(() => ({
    state,
    setCategory,
    setTitle,
    setDescription,
    setPrice,
    setCondition,
    setLocation,
    setImages,
    nextStep,
    previousStep,
    reset,
  }), [state, setCategory, setTitle, setDescription, setPrice, setCondition, setLocation, setImages, nextStep, previousStep, reset]);

  return (
    <PostAdContext.Provider value={value}>
      {children}
    </PostAdContext.Provider>
  );
};

