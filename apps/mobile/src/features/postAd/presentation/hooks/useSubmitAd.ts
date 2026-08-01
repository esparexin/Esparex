import { useState, useCallback } from 'react';
import { services } from '../../../../bootstrap';
import { usePostAdDraft } from '../../usePostAdDraft';
import type { SubmitResult, SubmitError } from '../../application/PostAdService';

// ---------------------------------------------------------------------------
// Status type
// ---------------------------------------------------------------------------

/**
 * SubmissionStatus — coarse-grained lifecycle state of a wizard submission.
 *
 * Each value maps to a UX moment:
 *   idle      — Submit button is enabled, no pending operation
 *   uploading — "Uploading photos…" label shown, button disabled
 *   creating  — "Creating listing…" label shown, button disabled
 *   success   — Transition complete; screen navigates away
 *   error     — Error displayed; resetError() restores idle
 */
export type SubmissionStatus =
  | 'idle'
  | 'uploading'
  | 'creating'
  | 'success'
  | 'error';

// ---------------------------------------------------------------------------
// Hook result
// ---------------------------------------------------------------------------

export interface UseSubmitAdResult {
  /**
   * Trigger the upload + creation pipeline.
   *
   * Returns a SubmitResult — the caller is responsible for reacting to
   * `success` (navigate) or `error` (display message). The hook owns
   * only mutation state, not UI flow decisions.
   */
  submit: () => Promise<SubmitResult>;
  status: SubmissionStatus;
  submitError: SubmitError | null;
  /** Clears the error and resets status to idle — enables a clean retry. */
  resetError: () => void;
}

// ---------------------------------------------------------------------------
// Implementation
// ---------------------------------------------------------------------------

/**
 * useSubmitAd — application-layer hook for wizard submission.
 *
 * Responsibilities:
 *   - Delegate the upload + listing creation to PostAdService
 *   - Expose granular SubmissionStatus for richer UX labels
 *   - Reset the wizard draft on success
 *   - Return SubmitResult so callers decide what to do (navigate, show error)
 *
 * Does NOT:
 *   - Navigate (PostAdScreen owns that decision)
 *   - Call uploadImages or the repository directly
 *   - Contain any validation logic (PostAdValidator and PostAdService handle it)
 */
export const useSubmitAd = (): UseSubmitAdResult => {
  const { state, reset } = usePostAdDraft();
  const [status, setStatus] = useState<SubmissionStatus>('idle');
  const [submitError, setSubmitError] = useState<SubmitError | null>(null);

  const resetError = useCallback(() => {
    setSubmitError(null);
    setStatus('idle');
  }, []);

  const submit = useCallback(async (): Promise<SubmitResult> => {
    setStatus('uploading');
    setSubmitError(null);

    const result = await services.postAdService.submit(
      state.draft,
      // Relay service-level phase changes to the SubmissionStatus state machine
      (phase) => setStatus(phase),
    );

    if (result.success) {
      // Reset wizard draft before returning — PostAdScreen navigates away
      reset();
      setStatus('success');
    } else {
      setStatus('error');
      setSubmitError({ kind: result.kind, message: result.message });
    }

    return result;
  }, [state.draft, reset]);

  return { submit, status, submitError, resetError };
};
