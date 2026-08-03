"use client";

import { useEffect, useCallback, useState } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { AdPayload as PostAdFormData } from "@/schemas/adPayload.schema";
import { notify } from "@/lib/feedback";

const DRAFT_STORAGE_KEY = "esparex_post_ad_draft_v1";

export interface PostAdDraftData {
  updatedAt: number;
  step: number;
  values: Partial<PostAdFormData>;
}

export function usePostAdDraft(
  form: UseFormReturn<PostAdFormData>,
  currentStep: number,
  setCurrentStep: (step: number) => void,
  isEditMode: boolean
) {
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);

  // Check if a saved draft exists
  const getSavedDraft = useCallback((): PostAdDraftData | null => {
    if (typeof window === "undefined" || isEditMode) return null;
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as PostAdDraftData;
      // Expire drafts older than 7 days
      if (Date.now() - parsed.updatedAt > 7 * 24 * 60 * 60 * 1000) {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        return null;
      }
      return parsed;
    } catch (_e) {
      return null;
    }
  }, [isEditMode]);

  // Clear saved draft
  const clearDraft = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (_e) {
      // Ignore storage errors
    }
  }, []);

  // Save current form values to draft
  const saveDraft = useCallback(() => {
    if (typeof window === "undefined" || isEditMode) return;
    const values = form.getValues();
    // Only save if category or title or description has content
    if (!values.category && !values.title && !values.description) return;

    try {
      const draft: PostAdDraftData = {
        updatedAt: Date.now(),
        step: currentStep,
        values,
      };
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch (_e) {
      // Ignore storage quota errors
    }
  }, [form, currentStep, isEditMode]);

  // Restore draft into form
  const restoreDraft = useCallback(() => {
    const draft = getSavedDraft();
    if (!draft) return false;

    try {
      Object.entries(draft.values).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          form.setValue(key as any, val, { shouldDirty: true });
        }
      });
      if (draft.step && draft.step > 1) {
        setCurrentStep(draft.step);
      }
      setHasRestoredDraft(true);
      notify.info("Restored saved draft");
      return true;
    } catch (_e) {
      return false;
    }
  }, [getSavedDraft, form, setCurrentStep]);

  // Auto-save on form value changes (debounced 1000ms)
  useEffect(() => {
    if (isEditMode) return;

    const subscription = form.watch(() => {
      const timer = setTimeout(() => {
        saveDraft();
      }, 1000);
      return () => clearTimeout(timer);
    });

    return () => subscription.unsubscribe();
  }, [form, saveDraft, isEditMode]);

  // Warn on window reload/leave when form is dirty
  useEffect(() => {
    if (isEditMode) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const values = form.getValues();
      if (values.category || values.title || values.description) {
        saveDraft();
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [form, saveDraft, isEditMode]);

  return {
    getSavedDraft,
    saveDraft,
    restoreDraft,
    clearDraft,
    hasRestoredDraft,
  };
}
