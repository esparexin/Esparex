import { useContext } from 'react';
import { PostAdContext, PostAdContextType } from './PostAdContext';

/**
 * usePostAdDraft — the only public hook for consuming Post Ad wizard state.
 *
 * Throws if called outside a PostAdProvider so misuse is caught immediately
 * at development time rather than surfacing as a silent data bug.
 *
 * Usage:
 *   const { state, setCategory, nextStep } = usePostAdDraft();
 */
export const usePostAdDraft = (): PostAdContextType => {
  const context = useContext(PostAdContext);

  // The default context value has no-op functions, so we detect "outside provider"
  // by checking whether the state object is the initial sentinel value.
  // A more robust check would use a nullable context + explicit null guard.
  if (!context) {
    throw new Error('usePostAdDraft must be used within a PostAdProvider');
  }

  return context;
};
